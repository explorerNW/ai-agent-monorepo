#!/bin/bash

# Quick HTTPS Setup Script
# This script automates the entire HTTPS setup process

set -e

echo "🚀 AI Agent Monorepo - HTTPS Quick Setup"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Step 1: Generate SSL certificates
echo "📝 Step 1: Generating SSL certificates..."
if [ ! -d "ssl" ] || [ ! -f "ssl/server.crt" ] || [ ! -f "ssl/server.key" ]; then
    ./generate-ssl-cert.sh
else
    echo "✅ SSL certificates already exist. Skipping generation."
    echo "   To regenerate, remove the ssl/ directory first:"
    echo "   rm -rf ssl/"
fi
echo ""

# Step 2: Verify environment files
echo "📋 Step 2: Verifying environment configuration..."
if grep -q "https://" .env; then
    echo "✅ Root .env configured for HTTPS"
else
    echo "⚠️  Warning: Root .env may not be configured for HTTPS"
fi

if grep -q "https://" packages/front-end/.env; then
    echo "✅ Front-end .env configured for HTTPS"
else
    echo "⚠️  Warning: Front-end .env may not be configured for HTTPS"
fi

if grep -q "https://" packages/back-end/.env; then
    echo "✅ Back-end .env configured for HTTPS"
else
    echo "⚠️  Warning: Back-end .env may not be configured for HTTPS"
fi
echo ""

# Step 3: Check Docker
echo "🐳 Step 3: Checking Docker availability..."
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✅ Docker and Docker Compose are available"
else
    echo "❌ Error: Docker or Docker Compose not found"
    echo "   Please install Docker Desktop or Docker Engine"
    exit 1
fi
echo ""

# Step 4: Offer to build and start
echo "🎯 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Build and start the services:"
echo "   docker-compose up -d --build"
echo ""
echo "2. View logs:"
echo "   docker-compose logs -f front-end"
echo ""
echo "3. Test HTTPS:"
echo "   curl -k https://localhost:443/"
echo ""
echo "4. Open in browser (accept security warning):"
echo "   https://localhost"
echo ""

read -p "Would you like to build and start the services now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔨 Building Docker images..."
    docker-compose build
    
    echo ""
    echo "🚀 Starting services..."
    docker-compose up -d
    
    echo ""
    echo "⏳ Waiting for services to start..."
    sleep 5
    
    echo ""
    echo "📊 Service status:"
    docker-compose ps
    
    echo ""
    echo "✅ Services started! Check logs with: docker-compose logs -f"
    echo ""
    echo "🌐 Access your application at: https://localhost"
    echo "   (Accept the security warning for self-signed certificate)"
fi
