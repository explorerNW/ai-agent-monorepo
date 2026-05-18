#!/bin/bash

# Let's Encrypt SSL Certificate Setup Script
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

# Step 3: Check for existing certificate and rate limits
echo -e "\n${YELLOW}Step 3: Checking certificate status...${NC}"

# Check if certificate already exists
if [ -f "$CERT_DIR/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${GREEN}✓ Certificate already exists for $DOMAIN${NC}"
    
    # Check certificate expiration
    EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_DIR/live/$DOMAIN/fullchain.pem" | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRY_DATE" +%s 2>/dev/null)
    CURRENT_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
    
    echo -e "Current certificate expires: ${EXPIRY_DATE}"
    echo -e "Days until expiry: ${DAYS_UNTIL_EXPIRY}"
    
    if [ "$DAYS_UNTIL_EXPIRY" -gt 30 ]; then
        echo -e "${GREEN}✓ Certificate is still valid (>30 days). Skipping renewal.${NC}"
        echo -e "${YELLOW}If you need to force renewal, delete the certificate first:${NC}"
        echo -e "  sudo certbot delete --cert-name $DOMAIN"
        exit 0
    else
        echo -e "${YELLOW}⚠ Certificate expires in less than 30 days. Proceeding with renewal...${NC}"
    fi
else
    echo -e "${YELLOW}No existing certificate found. Will attempt to obtain new certificate.${NC}"
fi

# Check rate limit status before attempting renewal
echo -e "\n${YELLOW}Checking Let's Encrypt rate limit status...${NC}"
if certbot certificates 2>/dev/null | grep -q "$DOMAIN"; then
    echo -e "${GREEN}✓ Domain has existing certificate records${NC}"
else
    echo -e "${YELLOW}ℹ No certificate records found (this may be a new domain)${NC}"
fi

# Step 4: Obtain certificate
echo -e "\n${YELLOW}Step 4: Obtaining certificate...${NC}"
cd "$PROJECT_ROOT"
docker-compose stop front-end 2>/dev/null || true

# Attempt to obtain/renew certificate with error handling
if certbot certonly --standalone \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    --keep-until-expiring; then
    echo -e "${GREEN}✓ Certificate obtained successfully${NC}"
else
    CERTBOT_EXIT_CODE=$?
    docker-compose start front-end 2>/dev/null || true
    
    echo -e "\n${RED}✗ Failed to obtain certificate (exit code: $CERTBOT_EXIT_CODE)${NC}"
    echo -e "\n${YELLOW}Possible reasons:${NC}"
    echo -e "  1. Rate limit exceeded (too many certificates issued recently)"
    echo -e "  2. Domain validation failed"
    echo -e "  3. Port 80 is blocked by firewall"
    echo -e "  4. DNS not properly configured"
    echo -e "\n${YELLOW}Solutions:${NC}"
    echo -e "  • If rate limited: Wait until the rate limit resets (check error message for time)"
    echo -e "  • For testing: Use self-signed certificates instead"
    echo -e "  • Verify DNS: Ensure $DOMAIN points to this server's IP"
    echo -e "  • Check firewall: Ensure port 80 is open"
    echo -e "\n${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}Quick Fix Options:${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}Option 1: Use self-signed certificates (immediate)${NC}"
    echo -e "  ./docker.sh deploy"
    echo -e ""
    echo -e "${BLUE}Option 2: Check when rate limit resets${NC}"
    echo -e "  sudo cat /var/log/letsencrypt/letsencrypt.log | tail -50"
    echo -e ""
    echo -e "${BLUE}Option 3: View all certificates${NC}"
    echo -e "  sudo certbot certificates"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    exit $CERTBOT_EXIT_CODE
fi

docker-compose start front-end 2>/dev/null || true

# Step 5: Configure Docker Compose
echo -e "\n${YELLOW}Step 5: Configuring Docker Compose...${NC}"
DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
cp "$DOCKER_COMPOSE_FILE" "$DOCKER_COMPOSE_FILE.bak.$(date +%Y%m%d_%H%M%S)"

if ! grep -q "/etc/letsencrypt:/etc/letsencrypt" "$DOCKER_COMPOSE_FILE"; then
    sed -i '/front-end:/,/volumes:/{
        /volumes:/a\
      - /etc/letsencrypt:/etc/letsencrypt:ro
    }' "$DOCKER_COMPOSE_FILE"
    echo -e "${GREEN}✓ Docker Compose updated${NC}"
fi

# Step 6: Configure Nginx
echo -e "\n${YELLOW}Step 6: Configuring Nginx...${NC}"
NGINX_CONF="$PROJECT_ROOT/packages/front-end/nginx.conf"
cp "$NGINX_CONF" "$NGINX_CONF.bak.$(date +%Y%m%d_%H%M%S)"

sed -i "s|ssl_certificate /etc/nginx/ssl/server.crt;|ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;|" "$NGINX_CONF"
sed -i "s|ssl_certificate_key /etc/nginx/ssl/server.key;|ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;|" "$NGINX_CONF"
echo -e "${GREEN}✓ Nginx configured${NC}"

# Step 7: Setup auto-renewal
echo -e "\n${YELLOW}Step 7: Setting up auto-renewal...${NC}"
CRON_JOB="0 0 1 * * certbot renew --quiet && cd $PROJECT_ROOT && docker-compose restart front-end"

if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✓ Auto-renewal cron job added${NC}"
fi

# Step 8: Verify and deploy
echo -e "\n${YELLOW}Step 8: Verifying setup...${NC}"
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
