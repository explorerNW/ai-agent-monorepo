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
    echo "  build         Build all services"
    echo "  clean         Stop and remove all containers, networks, and volumes"
    echo "  status        Show container status"
    echo "  shell:backend Open shell in backend container"
    echo "  shell:frontend Open shell in frontend container"
    echo "  help          Show this help message"
    echo ""
}

start_prod() {
    echo -e "${GREEN}Starting services in production mode...${NC}"
    docker-compose up -d --build
    echo -e "${GREEN}✓ Services started successfully!${NC}"
    echo -e "${BLUE}Front-end: http://localhost:3001${NC}"
    echo -e "${BLUE}Back-end:  http://localhost:3000${NC}"
}

start_dev() {
    echo -e "${GREEN}Starting services in development mode...${NC}"
    docker-compose -f docker-compose.dev.yml up -d --build
    echo -e "${GREEN}✓ Services started successfully!${NC}"
    echo -e "${BLUE}Front-end: http://localhost:5173${NC}"
    echo -e "${BLUE}Back-end:  http://localhost:3000${NC}"
}

stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    if docker ps --format '{{.Names}}' | grep -q 'ai-agent-backend'; then
        docker-compose down
    fi
    if docker ps --format '{{.Names}}' | grep -q 'ai-agent-backend-dev'; then
        docker-compose -f docker-compose.dev.yml down
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
    docker-compose logs -f
}

view_backend_logs() {
    echo -e "${BLUE}Viewing backend logs...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    docker-compose logs -f back-end
}

view_frontend_logs() {
    echo -e "${BLUE}Viewing frontend logs...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    docker-compose logs -f front-end
}

build_services() {
    echo -e "${GREEN}Building all services...${NC}"
    docker-compose build --no-cache
    echo -e "${GREEN}✓ Build completed${NC}"
}

clean_all() {
    echo -e "${RED}WARNING: This will remove all containers, networks, and volumes!${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cleaning up...${NC}"
        docker-compose down -v --remove-orphans
        docker-compose -f docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
        docker system prune -f
        echo -e "${GREEN}✓ Cleanup completed${NC}"
    else
        echo -e "${YELLOW}Cancelled${NC}"
    fi
}

show_status() {
    echo -e "${BLUE}Container Status:${NC}"
    docker-compose ps
    echo ""
    echo -e "${BLUE}Development Containers:${NC}"
    docker-compose -f docker-compose.dev.yml ps 2>/dev/null || echo "No dev containers running"
}

shell_backend() {
    echo -e "${BLUE}Opening shell in backend container...${NC}"
    docker exec -it ai-agent-backend sh
}

shell_frontend() {
    echo -e "${BLUE}Opening shell in frontend container...${NC}"
    docker exec -it ai-agent-frontend sh
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
    help|*)
        print_help
        ;;
esac