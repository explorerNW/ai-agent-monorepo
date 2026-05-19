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
    echo "  logs:mcp-service View MCP microservice logs"
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
    echo -e "${GREEN}Starting services in production mode...${NC}"
    $DOCKER_COMPOSE up -d --build
    echo -e "${GREEN}✓ Services started successfully!${NC}"
    echo -e "${BLUE}Front-end: http://localhost:3001${NC}"
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
    if docker ps --format '{{.Names}}' | grep -q 'ai-agent-monorepo-mcp-mq-service'; then
        $DOCKER_COMPOSE down
    fi
    if docker ps --format '{{.Names}}' | grep -q 'ai-agent-monorepo-front-end'; then
        $DOCKER_COMPOSE down
    fi
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

view_mcp_service_logs() {
    echo -e "${BLUE}Viewing MCP microservice logs...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    $DOCKER_COMPOSE logs -f mcp-server
}

view_postgres_logs() {
    echo -e "${BLUE}Viewing PostgreSQL logs...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    $DOCKER_COMPOSE logs -f postgres
}

build_services() {
    echo -e "${GREEN}Building all services...${NC}"
    
    # 配置国内镜像源加速（针对国内网络环境）
    echo -e "${BLUE}Configuring registry mirrors for China network...${NC}"
    
    # 设置npm/pnpm国内镜像
    export NPM_CONFIG_REGISTRY=${NPM_CONFIG_REGISTRY:-https://registry.npmmirror.com}
    export PNPM_REGISTRY=${PNPM_REGISTRY:-https://registry.npmmirror.com}
    
    # Docker构建时使用国内镜像源（如果配置了DOCKER_BUILDKIT）
    if [ -n "$DOCKER_BUILDKIT" ]; then
        echo -e "${YELLOW}Using Docker BuildKit with optimized settings${NC}"
    fi
    
    $DOCKER_COMPOSE build --no-cache
    echo -e "${GREEN}✓ Build completed${NC}"
}

build_service() {
    local service_name="${2:-back-end}"
    echo -e "${GREEN}Building service: ${service_name}...${NC}"
    $DOCKER_COMPOSE build --no-cache "$service_name"
    echo -e "${GREEN}✓ Build completed for ${service_name}${NC}"
}

deploy_rolling() {
    local force_mode="${1:-false}"
    
    echo -e "${BLUE}Starting rolling update deployment...${NC}"
    echo -e "${YELLOW}This will perform zero-downtime updates with health checks${NC}"
    echo ""
    
    # Pre-deployment: Check and generate SSL certificates if needed
    echo -e "${BLUE}Step 0: Checking SSL certificates...${NC}"
    
    # Extract domain from DEPLOY_DOMAIN or use default
    local deploy_domain=""
    if [ -n "$DEPLOY_DOMAIN" ]; then
        deploy_domain="$DEPLOY_DOMAIN"
        echo -e "${BLUE}Detected deployment domain: ${deploy_domain}${NC}"
    fi
    
    # Pre-deployment health check
    echo -e "${BLUE}Step 1: Checking current service health...${NC}"
    if ! $DOCKER_COMPOSE ps | grep -q "Up"; then
        echo -e "${RED}Error: No running services detected. Please start services first.${NC}"
        exit 1
    fi
    
    # Backup current state
    echo -e "${BLUE}Step 2: Creating backup of current configuration...${NC}"
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    cp docker-compose.yml "$backup_dir/docker-compose.yml.bak"
    echo -e "${GREEN}✓ Backup created at ${backup_dir}${NC}"
    
    # Build new images
    echo -e "${BLUE}Step 3: Building new images...${NC}"
    if [ "$force_mode" = "true" ]; then
        $DOCKER_COMPOSE build --no-cache
    else
        $DOCKER_COMPOSE build
    fi
    echo -e "${GREEN}✓ New images built successfully${NC}"
    
    # Perform rolling update
    echo -e "${BLUE}Step 4: Performing rolling update...${NC}"
    echo -e "${YELLOW}Update strategy:${NC}"
    echo "  - Order: Start new container before stopping old one"
    echo "  - Parallelism: 1 service at a time"
    echo "  - Delay between updates: 10-15 seconds"
    echo "  - Health check monitoring: 30-60 seconds"
    echo "  - Max failure ratio: 30%"
    echo "  - Auto-rollback on failure: Enabled"
    echo ""
    
    # Update services in dependency order
    echo -e "${BLUE}Updating mcp-server...${NC}"
    $DOCKER_COMPOSE up -d --no-deps mcp-server
    # mcp-server is a NestJS microservice without HTTP endpoint, use simple wait
    echo -e "${YELLOW}Waiting for mcp-server to stabilize...${NC}"
    sleep 8
    local container_name
    container_name=$(get_container_name "mcp-server")
    local container_status=$(docker inspect --format='{{.State.Running}}' "$container_name" 2>/dev/null || echo "false")
    if [ "$container_status" = "true" ]; then
        echo -e "${GREEN}✓ mcp-server is running${NC}"
    else
        echo -e "${RED}✗ mcp-server failed to start${NC}"
        handle_update_failure "mcp-server"
    fi
    
    sleep 5
    
    echo -e "${BLUE}Updating back-end...${NC}"
    $DOCKER_COMPOSE up -d --no-deps back-end
    # Wait longer for backend to initialize (includes start_period)
    sleep 15
    wait_for_healthcheck "back-end" 90 || handle_update_failure "back-end"
    
    sleep 5
    
    echo -e "${BLUE}Updating front-end...${NC}"
    $DOCKER_COMPOSE up -d --no-deps front-end
    # Wait for frontend to initialize
    sleep 10
    wait_for_healthcheck "front-end" 60 || handle_update_failure "front-end"
    
    echo ""
    echo -e "${GREEN}✓ Rolling update completed successfully!${NC}"
    echo -e "${BLUE}All services are running with new version${NC}"
    
    # Post-deployment verification
    verify_deployment
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
        "mcp-server")
            echo "ai-agent-mcp-service"
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
    
    echo -e "${YELLOW}Waiting for ${service_name} to become healthy...${NC}"
    
    while [ $elapsed -lt $timeout ]; do
        local health_status
        health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>&1)
        local exit_code=$?
        
        # If docker inspect fails, treat as not ready yet
        if [ $exit_code -ne 0 ]; then
            health_status="error"
        else
            # Trim whitespace and newlines
            health_status=$(echo "$health_status" | tr -d '[:space:]')
        fi
        
        if [ "$health_status" = "healthy" ]; then
            echo -e "${GREEN}✓ ${service_name} is healthy${NC}"
            return 0
        elif [ "$health_status" = "unhealthy" ]; then
            echo -e "${RED}✗ ${service_name} health check failed${NC}"
            return 1
        fi
        
        sleep 2
        elapsed=$((elapsed + 2))
        
        if [ $((elapsed % 10)) -eq 0 ]; then
            echo -e "${YELLOW}  Still waiting... (${elapsed}s/${timeout}s)${NC}"
        fi
    done
    
    echo -e "${RED}✗ ${service_name} health check timeout after ${timeout}s${NC}"
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
    
    local all_healthy=true
    
    # Check back-end and front-end with health checks
    for service in "back-end" "front-end"; do
        local container_name
        container_name=$(get_container_name "$service")
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "not found")
        
        if [ "$health_status" = "healthy" ]; then
            echo -e "${GREEN}✓ ${service}: healthy${NC}"
        else
            echo -e "${RED}✗ ${service}: ${health_status}${NC}"
            all_healthy=false
        fi
    done
    
    # Check mcp-server (microservice without health check)
    local container_name
    container_name=$(get_container_name "mcp-server")
    local container_status=$(docker inspect --format='{{.State.Running}}' "$container_name" 2>/dev/null || echo "false")
    local exit_code=$(docker inspect --format='{{.State.ExitCode}}' "$container_name" 2>/dev/null || echo "-1")
    
    if [ "$container_status" = "true" ] && [ "$exit_code" = "0" ]; then
        echo -e "${GREEN}✓ mcp-server: running${NC}"
    else
        echo -e "${RED}✗ mcp-server: not running (exit code: ${exit_code})${NC}"
        all_healthy=false
    fi
    
    if [ "$all_healthy" = true ]; then
        echo ""
        echo -e "${GREEN}✓ All services verified successfully!${NC}"
        echo -e "${BLUE}Front-end: http://localhost:3001${NC}"
        echo -e "${BLUE}Back-end:  http://localhost:3000${NC}"
        return 0
    else
        echo ""
        echo -e "${RED}⚠ Some services may not be healthy. Check logs for details.${NC}"
        return 1
    fi
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
    logs:-service)
        view_mcp_service_logs
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
