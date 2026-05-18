#!/bin/bash

# Let's Encrypt SSL Certificate Setup Script
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="${SSL_DOMAIN:-niewang.uunat.com}"
EMAIL="${SSL_EMAIL:-admin@uunat.com}"
CERT_DIR="/etc/letsencrypt"
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Let's Encrypt SSL Certificate Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Domain: ${DOMAIN}"
echo -e "Email: ${EMAIL}\n"

# Step 1: Check prerequisites
echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root or with sudo${NC}"
    exit 1
fi

# Step 2: Install Certbot
echo -e "\n${YELLOW}Step 2: Installing Certbot...${NC}"
if command -v certbot &> /dev/null; then
    echo -e "${GREEN}✓ Certbot already installed${NC}"
else
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        case "$ID" in
            ubuntu|debian) apt-get update && apt-get install -y certbot ;;
            centos|rhel) yum install -y epel-release && yum install -y certbot ;;
            *) echo -e "${RED}Unsupported OS${NC}"; exit 1 ;;
        esac
    fi
    echo -e "${GREEN}✓ Certbot installed${NC}"
fi

# Step 3: Obtain certificate
echo -e "\n${YELLOW}Step 3: Obtaining certificate...${NC}"
cd "$PROJECT_ROOT"
docker-compose stop front-end 2>/dev/null || true

certbot certonly --standalone \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive

docker-compose start front-end 2>/dev/null || true
echo -e "${GREEN}✓ Certificate obtained${NC}"

# Step 4: Configure Docker Compose
echo -e "\n${YELLOW}Step 4: Configuring Docker Compose...${NC}"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
cp "$DOCKER_COMPOSE_FILE" "$DOCKER_COMPOSE_FILE.bak.$(date +%Y%m%d_%H%M%S)"

if ! grep -q "/etc/letsencrypt:/etc/letsencrypt" "$DOCKER_COMPOSE_FILE"; then
    sed -i '/front-end:/,/volumes:/{
        /volumes:/a\
      - /etc/letsencrypt:/etc/letsencrypt:ro
    }' "$DOCKER_COMPOSE_FILE"
    echo -e "${GREEN}✓ Docker Compose updated${NC}"
fi

# Step 5: Configure Nginx
echo -e "\n${YELLOW}Step 5: Configuring Nginx...${NC}"
NGINX_CONF="$PROJECT_ROOT/packages/front-end/nginx.conf"
cp "$NGINX_CONF" "$NGINX_CONF.bak.$(date +%Y%m%d_%H%M%S)"

sed -i "s|ssl_certificate /etc/nginx/ssl/server.crt;|ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;|" "$NGINX_CONF"
sed -i "s|ssl_certificate_key /etc/nginx/ssl/server.key;|ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;|" "$NGINX_CONF"
echo -e "${GREEN}✓ Nginx configured${NC}"

# Step 6: Setup auto-renewal
echo -e "\n${YELLOW}Step 6: Setting up auto-renewal...${NC}"
CRON_JOB="0 0 1 * * certbot renew --quiet && cd $PROJECT_ROOT && docker-compose restart front-end"

if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✓ Auto-renewal cron job added${NC}"
fi

# Step 7: Verify and deploy
echo -e "\n${YELLOW}Step 7: Verifying setup...${NC}"
openssl x509 -in "$CERT_DIR/live/$DOMAIN/fullchain.pem" -noout -subject -dates 2>/dev/null || true

echo -e "\n${BLUE}Redeploying services...${NC}"
./docker.sh deploy

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Completed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Domain: $DOMAIN"
echo -e "Certificate: $CERT_DIR/live/$DOMAIN/"
echo -e "Service Worker: ✅ Should now work\n"
echo -e "${BLUE}Access: https://$DOMAIN/${NC}"
echo -e "${BLUE}Verify SW: DevTools > Application > Service Workers${NC}"
