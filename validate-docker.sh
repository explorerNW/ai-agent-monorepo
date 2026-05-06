#!/bin/bash

# Docker Setup Validation Script
# This script checks if all required Docker configurations are in place

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Docker Setup Validation${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $description"
    else
        echo -e "  ${RED}✗${NC} $description (MISSING)"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check command exists
check_command() {
    local cmd=$1
    
    if command -v "$cmd" &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $cmd is installed"
        return 0
    else
        echo -e "  ${RED}✗${NC} $cmd is NOT installed"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

echo -e "${BLUE}1. Checking Prerequisites...${NC}"
check_command docker
check_command "docker-compose" || check_command "docker compose"
echo ""

echo -e "${BLUE}2. Checking Configuration Files...${NC}"
check_file "docker-compose.yml" "Production Docker Compose file"
check_file "docker-compose.dev.yml" "Development Docker Compose file"
check_file "packages/back-end/Dockerfile" "Backend Dockerfile"
check_file "packages/back-end/.dockerignore" "Backend .dockerignore"
check_file "packages/front-end/Dockerfile" "Frontend production Dockerfile"
check_file "packages/front-end/Dockerfile.dev" "Frontend development Dockerfile"
check_file "packages/front-end/.dockerignore" "Frontend .dockerignore"
echo ""

echo -e "${BLUE}3. Checking Environment Files...${NC}"
if [ -f "packages/back-end/.env" ]; then
    echo -e "  ${GREEN}✓${NC} Backend .env file exists"
    # Check for required variables
    if grep -q "PORT=" packages/back-end/.env && grep -q "FRONT_END_URL=" packages/back-end/.env; then
        echo -e "    ${GREEN}✓${NC} Required variables present"
    else
        echo -e "    ${YELLOW}⚠${NC} Some required variables may be missing"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "  ${RED}✗${NC} Backend .env file (MISSING)"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "packages/front-end/.env" ]; then
    echo -e "  ${GREEN}✓${NC} Frontend .env file exists"
else
    echo -e "  ${YELLOW}⚠${NC} Frontend .env file (MISSING, will use defaults)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo -e "${BLUE}4. Checking Helper Scripts...${NC}"
check_file "docker.sh" "Docker helper script"
if [ -x "docker.sh" ]; then
    echo -e "  ${GREEN}✓${NC} docker.sh is executable"
else
    echo -e "  ${YELLOW}⚠${NC} docker.sh is not executable"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo -e "${BLUE}5. Checking Documentation...${NC}"
check_file "DOCKER.md" "Docker documentation"
check_file "DOCKER_QUICK_REF.md" "Quick reference guide"
check_file "DOCKER_CONFIG_SUMMARY.md" "Configuration summary"
echo ""

echo -e "${BLUE}6. Checking Package.json Scripts...${NC}"
if grep -q "docker:start" package.json; then
    echo -e "  ${GREEN}✓${NC} Docker scripts added to package.json"
else
    echo -e "  ${YELLOW}⚠${NC} Docker scripts missing from package.json"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo -e "${BLUE}7. Checking Directory Structure...${NC}"
if [ -d "packages/back-end/uploads" ]; then
    echo -e "  ${GREEN}✓${NC} Backend uploads directory exists"
else
    echo -e "  ${YELLOW}⚠${NC} Backend uploads directory (will be created at runtime)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}================================${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo -e "${GREEN}You're ready to use Docker!${NC}"
    echo ""
    echo -e "Next steps:"
    echo -e "  ${BLUE}./docker.sh start${NC}     - Start production environment"
    echo -e "  ${BLUE}./docker.sh start:dev${NC} - Start development environment"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Passed with $WARNINGS warning(s)${NC}"
    echo -e "${GREEN}You can proceed, but review warnings above${NC}"
    exit 0
else
    echo -e "${RED}✗ Failed with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo -e "${RED}Please fix the errors before proceeding${NC}"
    exit 1
fi