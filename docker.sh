#!/bin/bash

# AI Agent Monorepo - Docker Helper Script
# This script provides convenient commands for managing Docker containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    echo "  logs          View logs from all services"
    echo "  logs:backend  View backend logs"
    echo "  logs:frontend View frontend logs"
    echo "  logs:rabbitmq View RabbitMQ server logs"
    echo "  logs:rabbitmq-service View RabbitMQ microservice logs"
    echo "  logs:postgres View PostgreSQL logs"
    echo "  build         Build all services"
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
    $DOCKER_COMPOSE up -d --build --parallel
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
    if docker ps --format '{{.Names}}' | grep -q 'ai-agent-backend'; then
        $DOCKER_COMPOSE down
    fi
    if docker ps --format '{{.Names}}' | grep -q 'ai-agent-backend-dev'; then
        $DOCKER_COMPOSE -f docker-compose.dev.yml down
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

build_services() {
    echo -e "${GREEN}Building all services...${NC}"
    $DOCKER_COMPOSE build --no-cache
    echo -e "${GREEN}✓ Build completed${NC}"
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
