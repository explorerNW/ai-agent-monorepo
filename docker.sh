#!/bin/bash

# AI Agent Monorepo - Docker Helper Script
# This script provides convenient commands for managing Docker containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Detect docker compose command (prefer new plugin syntax, fallback to standalone)
DOCKER_COMPOSE=""
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}Error: Neither 'docker compose' nor 'docker-compose' found.${NC}"
    echo -e "${YELLOW}Please install Docker Compose:${NC}"
    echo "  - For Docker Desktop: It's included by default"
    echo "  - For Linux: sudo yum install docker-compose-plugin (CentOS/RHEL)"
    echo "               or sudo apt-get install docker-compose-plugin (Ubuntu/Debian)"
    exit 1
fi

echo -e "${BLUE}Using: $DOCKER_COMPOSE${NC}"

# Functions
print_help() {
    echo -e "${BLUE}AI Agent Monorepo - Docker Helper${NC}"
    echo ""
    echo "Usage: ./docker.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start         Start all services (production mode)"
    echo "  start:dev     Start all services (development mode)"
    echo "  stop          Stop all services"
    echo "  restart       Restart all services"
    echo "  deploy        Rolling update deployment (zero-downtime)"
    echo "  deploy:force  Force rolling update (skip health checks)"
    echo "  logs          View logs from all services"
    echo "  logs:backend  View backend logs"
    echo "  logs:frontend View frontend logs"
    echo "  logs:rabbitmq View RabbitMQ server logs"
    echo "  logs:rabbitmq-service View RabbitMQ microservice logs"
    echo "  logs:postgres View PostgreSQL logs"
    echo "  build         Build all services"
    echo "  build:service Build specific service (usage: build:service back-end)"
    echo "  clean         Stop and remove all containers, networks, and volumes"
    echo "  status        Show container status"
    echo "  shell:backend Open shell in backend container"
    echo "  shell:frontend Open shell in frontend container"
    echo "  shell:rabbitmq Open shell in RabbitMQ container"
    echo "  shell:postgres Open shell in PostgreSQL container"
    echo "  db:init       Initialize database tables"
    echo "  db:shell      Open PostgreSQL command line"
    echo "  help          Show this help message"
    echo ""
    echo "Services:"
    echo "  Front-end:    http://localhost:3001"
    echo "  Back-end:     http://localhost:3000"
    echo "  RabbitMQ UI:  http://localhost:15672 (guest/guest)"
    echo "  PostgreSQL:   localhost:5432"
    echo ""
}

start_prod() {
    set -e
    echo -e "${GREEN}Starting services in production mode...${NC}"

    docker compose up -d --build

    echo ""
    echo -e "${GREEN}✓ Deployment completed${NC}"

    verify_deployment

    echo -e "${GREEN}✓ Services started successfully!${NC}"
    echo -e "${BLUE}Front-end: https://localhost:443${NC}"
    echo -e "${BLUE}Back-end:  http://localhost:3000${NC}"
    echo -e "${BLUE}PostgreSQL: localhost:5432${NC}"
}

start_dev() {
    echo -e "${GREEN}Starting services in development mode...${NC}"
    $DOCKER_COMPOSE -f docker-compose.dev.yml up -d --build
    echo -e "${GREEN}✓ Services started successfully!${NC}"
    echo -e "${BLUE}Front-end: http://localhost:5173${NC}"
    echo -e "${BLUE}Back-end:  http://localhost:3000${NC}"
}

stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    $DOCKER_COMPOSE down
    echo -e "${GREEN}✓ All services stopped${NC}"
}

restart_services() {
    echo -e "${YELLOW}Restarting all services...${NC}"
    stop_services
    sleep 2
    start_prod
}

view_logs() {
    echo -e "${BLUE}Viewing logs from all services...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    $DOCKER_COMPOSE logs -f
}

view_backend_logs() {
    echo -e "${BLUE}Viewing backend logs...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    $DOCKER_COMPOSE logs -f back-end
}

view_frontend_logs() {
    echo -e "${BLUE}Viewing frontend logs...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    $DOCKER_COMPOSE logs -f front-end
}

view_rabbitmq_logs() {
    echo -e "${BLUE}Viewing RabbitMQ server logs...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    $DOCKER_COMPOSE logs -f rabbitmq
}

view_rabbitmq_service_logs() {
    echo -e "${BLUE}Viewing RabbitMQ microservice logs...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    $DOCKER_COMPOSE logs -f rabbit-mq-service
}

view_postgres_logs() {
    echo -e "${BLUE}Viewing PostgreSQL logs...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    $DOCKER_COMPOSE logs -f postgres
}

clean_build_cache() {
    echo -e "${YELLOW}Cleaning old build cache...${NC}"
    docker builder prune -f --keep-storage 8GB 2>/dev/null || true
}

build_services() {
    echo -e "${GREEN}Building all services (with cache)...${NC}"
    
    # 配置国内镜像源加速（针对国内网络环境）
    echo -e "${BLUE}Configuring registry mirrors for China network...${NC}"
    
    # 设置npm/pnpm国内镜像
    export NPM_CONFIG_REGISTRY=${NPM_CONFIG_REGISTRY:-https://registry.npmmirror.com} #http://192.168.88.118:4873
    export PNPM_REGISTRY=${PNPM_REGISTRY:-https://registry.npmmirror.com}#http://192.168.88.118:4873
    
    # 启用 BuildKit 并行构建 + 层缓存
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    echo -e "${YELLOW}Using Docker BuildKit with parallel build and layer cache${NC}"
    
    # --parallel 并行构建 back-end / front-end / rabbit-mq-service 三个镜像
    # 不加 --no-cache，充分利用 Docker 层缓存
    $DOCKER_COMPOSE build --parallel
    echo -e "${GREEN}✓ Build completed${NC}"
}

build_service() {
    local service_name="${2:-back-end}"
    echo -e "${GREEN}Building service: ${service_name}...${NC}"
    $DOCKER_COMPOSE build --no-cache "$service_name"
    echo -e "${GREEN}✓ Build completed for ${service_name}${NC}"
}

# ── 变更检测：根据 git diff 判断哪些服务需要重建 ──
# 映射规则：
#   packages/front-end/**                      → front-end
#   packages/back-end/micro-service/rabbit-mq/** → rabbit-mq-service
#   packages/back-end/** (排除 rabbit-mq)       → back-end
#   根目录文件 (docker-compose.yml / Dockerfile / package.json / pnpm-lock.yaml / .npmrc) → all
detect_changed_services() {
    local last_commit_file=".deploy-commit-hash"
    local last_commit=""
    
    if [ -f "$last_commit_file" ]; then
        last_commit=$(cat "$last_commit_file")
    fi
    
    # 首次部署 / 无记录 / force 模式 / last_commit 不存在于 git 历史 → 全量重建
    if [ -z "$last_commit" ] || ! git rev-parse "$last_commit" &>/dev/null; then
        echo "back-end front-end rabbit-mq-service"
        return
    fi
    
    local current_commit
    current_commit=$(git rev-parse HEAD)
    
    if [ "$last_commit" = "$current_commit" ]; then
        # 没有新提交
        echo ""
        return
    fi
    
    local changed_files
    changed_files=$(git diff --name-only "$last_commit" "$current_commit" 2>/dev/null)
    
    if [ -z "$changed_files" ]; then
        echo ""
        return
    fi
    
    local services=()
    local rebuild_all=false
    
    # 根目录文件变更 → 全部重建
    while IFS= read -r file; do
        case "$file" in
            docker-compose.yml|docker-compose*.yml|package.json|pnpm-lock.yaml|pnpm-workspace.yaml|.npmrc)
                rebuild_all=true
                ;;
            packages/front-end/*)
                services+=("front-end")
                ;;
            packages/back-end/micro-service/rabbit-mq/*)
                services+=("rabbit-mq-service")
                ;;
            packages/back-end/*)
                services+=("back-end")
                ;;
        esac
    done <<< "$changed_files"
    
    if [ "$rebuild_all" = true ]; then
        echo "back-end front-end rabbit-mq-service"
        return
    fi
    
    # 去重
    local unique_services
    unique_services=$(printf '%s\n' "${services[@]}" | sort -u | tr '\n' ' ' | sed 's/ *$//')
    
    echo "$unique_services"
}

# 保存当前部署的 commit hash
save_deploy_commit() {
    git rev-parse HEAD > .deploy-commit-hash
}

deploy_rolling() {
    local force_mode="${1:-false}"
    
    echo -e "${BLUE}Starting zero-downtime deployment...${NC}"
    
    # BuildKit 并行构建 + 层缓存
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    # ── 智能变更检测 ──
    local services_to_build=""
    
    if [ "$force_mode" = "true" ]; then
        echo -e "${YELLOW}Force mode: rebuilding all services${NC}"
        services_to_build="back-end front-end rabbit-mq-service"
    else
        services_to_build=$(detect_changed_services)
    fi
    
    if [ -z "$services_to_build" ]; then
        echo -e "${GREEN}No code changes detected. Starting services with existing images...${NC}"
        $DOCKER_COMPOSE up -d
        verify_deployment
        return
    fi
    
    echo -e "${BLUE}Changed services: ${CYAN}${services_to_build}${NC}"
    
    # ═══ Phase 1: Build images (不影响运行中的服务) ═══
    echo ""
    echo -e "${BLUE}Phase 1: Building images...${NC}"
    $DOCKER_COMPOSE build --parallel $services_to_build
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Build failed! No services were touched.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ All images built${NC}"
    
    # ═══ Phase 2: Deploy each service with auto-rollback ═══
    echo ""
    echo -e "${BLUE}Phase 2: Deploying services (build-first + auto-rollback)...${NC}"
    local failed_services=""
    
    for svc in $services_to_build; do
        deploy_service_safe "$svc"
        if [ $? -ne 0 ]; then
            failed_services="$failed_services $svc"
        fi
    done
    
    # ═══ Phase 3: Ensure unchanged services are running ═══
    $DOCKER_COMPOSE up -d 2>/dev/null
    
    # ═══ Phase 4: Cleanup ═══
    docker image prune -f 2>/dev/null || true
    docker builder prune -f --keep-storage 2GB 2>/dev/null || true
    
    # Save deploy commit hash
    save_deploy_commit
    
    # ═══ Result ═══
    echo ""
    if [ -z "$failed_services" ]; then
        echo -e "${GREEN}✓ All services deployed successfully!${NC}"
    else
        echo -e "${YELLOW}⚠ Failed services:${failed_services} (auto-rolled back)${NC}"
    fi
    
    verify_deployment
}

# ── 安全部署单个服务 ──
# 策略：记录旧镜像 → 快速切换新镜像 → 等健康检查 → 失败自动回滚到旧镜像
deploy_service_safe() {
    local svc=$1
    local container_name=$(get_container_name "$svc")
    
    echo ""
    echo -e "${BLUE}━━━ Deploying: ${CYAN}${svc}${NC} ━━━${NC}"
    
    # Step 1: 记录当前运行的镜像 ID（用于回滚）
    local old_image
    old_image=$(docker inspect --format='{{.Image}}' "$container_name" 2>/dev/null || echo "")
    
    # Step 2: 快速切换 — stop + recreate with new image
    echo -e "${YELLOW}  Switching to new image...${NC}"
    $DOCKER_COMPOSE up -d --no-deps --force-recreate "$svc" 2>/dev/null
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}  ✗ Failed to recreate container!${NC}"
        return 1
    fi
    
    # Step 3: 等待健康检查
    echo -e "${YELLOW}  Verifying health...${NC}"
    wait_for_healthcheck "$svc" 90
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}  ✓ ${svc} deployed successfully!${NC}"
        return 0
    fi
    
    # Step 4: 健康检查失败 → 自动回滚
    echo -e "${RED}  ✗ New version failed health check!${NC}"
    
    if [ -n "$old_image" ]; then
        echo -e "${YELLOW}  Rolling back to previous image...${NC}"
        docker stop "$container_name" 2>/dev/null
        docker rm "$container_name" 2>/dev/null
        
        # 用旧镜像启动
        docker run -d --name "$container_name" \
            $(docker inspect --format='{{range $e := .Config.Env}}-e "{{$e}}" {{end}}' "$container_name" 2>/dev/null || true) \
            --network ai-agent-network \
            --restart unless-stopped \
            "$old_image" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}  ✓ Rolled back to previous version${NC}"
        else
            echo -e "${RED}  ✗ Rollback failed! Manual intervention needed.${NC}"
        fi
    else
        echo -e "${YELLOW}  No previous image found, container may be in bad state${NC}"
    fi
    
    return 1
}

# Helper function to get container name from service name
get_container_name() {
    local service_name="$1"
    case "$service_name" in
        "back-end")
            echo "ai-agent-backend"
            ;;
        "front-end")
            echo "ai-agent-frontend"
            ;;
        "rabbit-mq-service")
            echo "ai-agent-rabbitmq-service"
            ;;
        *)
            echo "ai-agent-${service_name}"
            ;;
    esac
}

wait_for_healthcheck() {
    local service_name="$1"
    local timeout="$2"
    local container_name
    container_name=$(get_container_name "$service_name")
    local elapsed=0
    local prev_restart_count=-1
    local stable_checks=0
    
    echo -e "${YELLOW}Waiting for ${service_name} to become healthy...${NC}"
    echo -e "${YELLOW}  Container name: ${container_name}${NC}"

    # Check if container exists
    local exists
    exists=$(docker inspect --format='{{.Id}}' "$container_name" 2>/dev/null)
    if [ -z "$exists" ]; then
        echo -e "${RED}✗ Container '${container_name}' not found!${NC}"
        echo -e "${YELLOW}  Running containers:${NC}"
        docker ps --format "table {{.Names}}\t{{.Status}}" | grep -i "agent\|backend\|frontend\|rabbit" || echo "  (none matching)"
        return 1
    fi

    # Detect if service has a healthcheck defined
    local has_healthcheck
    has_healthcheck=$(docker inspect --format='{{if .State.Health}}yes{{else}}no{{end}}' "$container_name" 2>/dev/null || echo "no")
    echo -e "${YELLOW}  Has healthcheck: ${has_healthcheck}${NC}"

    # No healthcheck: fallback to stability check
    if [ "$has_healthcheck" = "no" ]; then
        echo -e "${YELLOW}  No healthcheck defined, checking container stability...${NC}"
        local initial_pid
        initial_pid=$(docker inspect --format='{{.State.Pid}}' "$container_name" 2>/dev/null || echo "0")
        sleep 5
        local running
        running=$(docker inspect --format='{{.State.Running}}' "$container_name" 2>/dev/null || echo "false")
        local current_pid
        current_pid=$(docker inspect --format='{{.State.Pid}}' "$container_name" 2>/dev/null || echo "0")
        local restart_count
        restart_count=$(docker inspect --format='{{.RestartCount}}' "$container_name" 2>/dev/null || echo "0")
        
        if [ "$running" = "true" ] && [ "$restart_count" -le 1 ] && [ "$initial_pid" = "$current_pid" ]; then
            echo -e "${GREEN}✓ ${service_name} is running (stable, pid=${current_pid})${NC}"
            return 0
        else
            echo -e "${RED}✗ ${service_name} container unstable (running=${running}, restarts=${restart_count}, pid changed=${initial_pid}→${current_pid})${NC}"
            docker logs --tail 5 "$container_name" 2>&1
            return 1
        fi
    fi

    while [ $elapsed -lt $timeout ]; do
        # Get current status + restart count + PID in one inspect call
        local inspect_json
        inspect_json=$(docker inspect --format='{{json .State}}' "$container_name" 2>/dev/null || echo "{}")
        
        local health_status
        health_status=$(echo "$inspect_json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health',{}).get('Status','unknown'))" 2>/dev/null || echo "unknown")
        health_status=$(echo "$health_status" | tr -d '[:space:]')
        
        local running
        running=$(echo "$inspect_json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Running',False))" 2>/dev/null || echo "False")
        
        local restart_count
        restart_count=$(echo "$inspect_json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('RestartCount',0))" 2>/dev/null || echo "0")
        
        local current_pid
        current_pid=$(echo "$inspect_json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Pid',0))" 2>/dev/null || echo "0")

        # Get last healthcheck output
        local last_output
        last_output=$(docker inspect --format='{{(index .State.Health.Log 0).Output}}' "$container_name" 2>/dev/null || echo "")
        last_output=$(echo "$last_output" | tr -d '\n' | head -c 150)

        if [ "$health_status" = "healthy" ]; then
            echo -e "${GREEN}✓ ${service_name} is healthy (pid=${current_pid})${NC}"
            return 0
        elif [ "$health_status" = "unhealthy" ]; then
            echo -e "${RED}✗ ${service_name} health check failed (status: ${health_status})${NC}"
            echo -e "${YELLOW}  Last check output: ${last_output}${NC}"
            return 1
        fi

        # ── Crash loop detection ──
        # If restart count jumped by 2+ since we started watching, container is crash-looping
        if [ "$prev_restart_count" -ge 0 ] && [ "$restart_count" -ge $((prev_restart_count + 2)) ]; then
            echo -e "${RED}✗ ${service_name} is crash-looping (restarts: ${prev_restart_count} → ${restart_count})${NC}"
            echo -e "${YELLOW}  Last healthcheck output: ${last_output}${NC}"
            docker logs --tail 10 "$container_name" 2>&1 | head -15
            return 1
        fi

        # If container not running at all and has restarted, it crashed
        if [ "$running" != "True" ] && [ "$running" != "true" ] && [ "$restart_count" -gt 0 ]; then
            echo -e "${RED}✗ ${service_name} crashed and stopped (restarts=${restart_count}, exit code from logs)${NC}"
            docker logs --tail 10 "$container_name" 2>&1 | head -15
            return 1
        fi
        
        # Track restart count for next iteration
        prev_restart_count=$restart_count

        # Periodic status output
        if [ $((elapsed % 10)) -eq 0 ]; then
            echo -e "${YELLOW}  Still waiting... (${elapsed}s/${timeout}s) [status=${health_status}, running=${running}, restarts=${restart_count}, pid=${current_pid}]${NC}"
            if [ -n "$last_output" ]; then
                echo -e "${YELLOW}  Last output: ${last_output}${NC}"
            fi
        fi
        
        sleep 2
        elapsed=$((elapsed + 2))
    done
    
    echo -e "${RED}✗ ${service_name} health check timeout after ${timeout}s${NC}"
    docker logs --tail 10 "$container_name" 2>&1 | head -15
    return 1
}

wait_for_container_running() {
    local service_name="$1"
    local timeout="$2"
    local container_name
    container_name=$(get_container_name "$service_name")
    local elapsed=0
    
    echo -e "${YELLOW}Waiting for ${service_name} container to be running...${NC}"
    
    # Give container a moment to start/restart after up -d command
    sleep 5
    
    while [ $elapsed -lt $timeout ]; do
        local container_status=$(docker inspect --format='{{.State.Running}}' "$container_name" 2>/dev/null || echo "false")
        local exit_code=$(docker inspect --format='{{.State.ExitCode}}' "$container_name" 2>/dev/null || echo "-1")
        
        if [ "$container_status" = "true" ] && [ "$exit_code" = "0" ]; then
            echo -e "${GREEN}✓ ${service_name} is running${NC}"
            return 0
        elif [ "$container_status" = "false" ]; then
            echo -e "${RED}✗ ${service_name} container is not running (exit code: ${exit_code})${NC}"
            return 1
        fi
        
        sleep 2
        elapsed=$((elapsed + 2))
        
        if [ $((elapsed % 10)) -eq 0 ]; then
            echo -e "${YELLOW}  Still waiting... (${elapsed}s/${timeout}s)${NC}"
        fi
    done
    
    echo -e "${RED}✗ ${service_name} container start timeout after ${timeout}s${NC}"
    # Show final status for debugging
    docker inspect "$container_name" --format='Status: {{.State.Status}}, Running: {{.State.Running}}, ExitCode: {{.State.ExitCode}}' 2>/dev/null || true
    return 1
}

handle_update_failure() {
    local service_name="$1"
    echo -e "${RED}Update failed for ${service_name}${NC}"
    echo -e "${YELLOW}Initiating rollback...${NC}"
    
    # Rollback to previous version
    $DOCKER_COMPOSE up -d --no-deps "$service_name"
    
    echo -e "${RED}Rollback completed. Please check logs and fix issues before retrying.${NC}"
    echo -e "${BLUE}View logs: ./docker.sh logs:${service_name}${NC}"
    exit 1
}

verify_deployment() {
    echo -e "${BLUE}Verifying deployment...${NC}"

    local max_wait=${1:-60}   # 最长等待秒数，默认 60
    local interval=5          # 轮询间隔秒数
    local elapsed=0

    # 带健康检查的服务列表
    local health_services=("back-end" "front-end")
    # 只需 running 状态的服务
    local running_services=("rabbit-mq-service")

    while [ $elapsed -lt $max_wait ]; do
        local all_ok=true

        # 检查带健康检查的服务
        for service in "${health_services[@]}"; do
            local container_name
            container_name=$(get_container_name "$service")
            local status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "not_found")
            if [ "$status" != "healthy" ]; then
                all_ok=false
            fi
        done

        # 检查只需 running 的服务
        for service in "${running_services[@]}"; do
            local container_name
            container_name=$(get_container_name "$service")
            local running=$(docker inspect --format='{{.State.Running}}' "$container_name" 2>/dev/null || echo "false")
            local exit_code=$(docker inspect --format='{{.State.ExitCode}}' "$container_name" 2>/dev/null || echo "-1")
            if [ "$running" != "true" ] || [ "$exit_code" != "0" ]; then
                all_ok=false
            fi
        done

        if [ "$all_ok" = true ]; then
            echo ""
            # 打印最终状态
            for service in "${health_services[@]}"; do
                echo -e "${GREEN}✓ ${service}: healthy${NC}"
            done
            for service in "${running_services[@]}"; do
                echo -e "${GREEN}✓ ${service}: running${NC}"
            done
            echo ""
            echo -e "${GREEN}✓ All services verified successfully! (${elapsed}s)${NC}"
            echo -e "${BLUE}Front-end: https://localhost:443${NC}"
            echo -e "${BLUE}Back-end:  http://localhost:3000${NC}"
            return 0
        fi

        echo -e "${YELLOW}  Waiting for services to be healthy... (${elapsed}s/${max_wait}s)${NC}"
        sleep $interval
        elapsed=$((elapsed + interval))
    done

    # 超时后打印各服务实际状态
    echo ""
    echo -e "${RED}⚠ Timeout after ${max_wait}s. Current status:${NC}"
    for service in "${health_services[@]}"; do
        local container_name
        container_name=$(get_container_name "$service")
        local status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "not_found")
        if [ "$status" = "healthy" ]; then
            echo -e "${GREEN}✓ ${service}: ${status}${NC}"
        else
            echo -e "${RED}✗ ${service}: ${status}${NC}"
        fi
    done
    for service in "${running_services[@]}"; do
        local container_name
        container_name=$(get_container_name "$service")
        local running=$(docker inspect --format='{{.State.Running}}' "$container_name" 2>/dev/null || echo "false")
        if [ "$running" = "true" ]; then
            echo -e "${GREEN}✓ ${service}: running${NC}"
        else
            echo -e "${RED}✗ ${service}: not running${NC}"
        fi
    done
    echo -e "${RED}  Check logs: $DOCKER_COMPOSE logs front-end${NC}"
    return 1
}

clean_all() {
    echo -e "${RED}WARNING: This will remove all containers, networks, and volumes!${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cleaning up...${NC}"
        $DOCKER_COMPOSE down -v --remove-orphans
        $DOCKER_COMPOSE -f docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
        docker system prune -f
        echo -e "${GREEN}✓ Cleanup completed${NC}"
    else
        echo -e "${YELLOW}Cancelled${NC}"
    fi
}

show_status() {
    echo -e "${BLUE}Container Status:${NC}"
    $DOCKER_COMPOSE ps
    echo ""
    echo -e "${BLUE}Development Containers:${NC}"
    $DOCKER_COMPOSE -f docker-compose.dev.yml ps 2>/dev/null || echo "No dev containers running"
}

shell_backend() {
    echo -e "${BLUE}Opening shell in backend container...${NC}"
    docker exec -it ai-agent-backend sh
}

shell_frontend() {
    echo -e "${BLUE}Opening shell in frontend container...${NC}"
    docker exec -it ai-agent-frontend sh
}

shell_rabbitmq() {
    echo -e "${BLUE}Opening shell in RabbitMQ container...${NC}"
    docker exec -it ai-agent-rabbitmq sh
}

shell_postgres() {
    echo -e "${BLUE}Opening shell in PostgreSQL container...${NC}"
    docker exec -it ai-agent-postgres sh
}

db_init() {
    echo -e "${GREEN}Initializing database...${NC}"
    chmod +x init-db.sh
    ./init-db.sh
}

db_shell() {
    echo -e "${BLUE}Opening PostgreSQL command line...${NC}"
    docker exec -it ai-agent-postgres psql -U ${DB_USER:-admin} -d ${DB_NAME:-analytics}
}

# Main command handler
case "${1:-help}" in
    start)
        start_prod
        ;;
    start:dev)
        start_dev
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    deploy)
        deploy_rolling "false"
        ;;
    deploy:force)
        deploy_rolling "true"
        ;;
    logs)
        view_logs
        ;;
    logs:backend)
        view_backend_logs
        ;;
    logs:frontend)
        view_frontend_logs
        ;;
    logs:rabbitmq)
        view_rabbitmq_logs
        ;;
    logs:rabbitmq-service)
        view_rabbitmq_service_logs
        ;;
    logs:postgres)
        view_postgres_logs
        ;;
    build)
        build_services
        ;;
    build:service)
        build_service "$@"
        ;;
    clean)
        clean_all
        ;;
    clean:build)
        clean_build_cache
        ;;
    verify)
        verify_services
        ;;
    status)
        show_status
        ;;
    shell:backend)
        shell_backend
        ;;
    shell:frontend)
        shell_frontend
        ;;
    shell:rabbitmq)
        shell_rabbitmq
        ;;
    shell:postgres)
        shell_postgres
        ;;
    db:init)
        db_init
        ;;
    db:shell)
        db_shell
        ;;
    help|*)
        print_help
        ;;
esac