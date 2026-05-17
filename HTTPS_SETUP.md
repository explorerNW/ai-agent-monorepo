# HTTPS Setup Guide with Self-Signed Certificates

This guide explains how to set up HTTPS with self-signed certificates for the AI Agent Monorepo project.

## 📋 Prerequisites

- Docker and Docker Compose installed
- OpenSSL (for certificate generation)
- Access to ports 80 and 443

## 🔐 Step 1: Generate Self-Signed SSL Certificates

Run the certificate generation script from the project root:

```bash
./generate-ssl-cert.sh
```

This will create:

- `ssl/server.crt` - The SSL certificate
- `ssl/server.key` - The private key
- `ssl/openssl.cnf` - OpenSSL configuration file

### Trusting the Certificate (Optional but Recommended)

**On macOS:**

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ./ssl/server.crt
```

**On Linux (Ubuntu/Debian):**

```bash
sudo cp ssl/server.crt /usr/local/share/ca-certificates/ai-agent.crt
sudo update-ca-certificates
```

**On Windows:**

1. Double-click the `ssl/server.crt` file
2. Click "Install Certificate"
3. Choose "Local Machine"
4. Select "Place all certificates in the following store"
5. Browse and select "Trusted Root Certification Authorities"

## 🚀 Step 2: Update Environment Variables

The `.env` files have been updated to use HTTPS URLs:

- **Root `.env`**: `VITE_API_BASE_URL=https://localhost:443`
- **Front-end `.env`**: `VITE_API_BASE_URL=https://localhost:443`
- **Back-end `.env`**: `FRONT_END_URL=https://niewang.uunat.com:443`

Verify these values match your deployment needs.

## 🐳 Step 3: Build and Run with Docker Compose

```bash
# Build the images
docker-compose build

# Start the services
docker-compose up -d

# Check logs
docker-compose logs -f front-end
```

## 🔍 Step 4: Verify HTTPS is Working

### Test Locally

```bash
# Test HTTPS endpoint (with self-signed cert)
curl -k https://localhost:443/

# Or using wget
wget --no-check-certificate https://localhost:443/
```

### Test in Browser

1. Open `https://localhost` in your browser
2. You'll see a security warning (expected for self-signed certs)
3. Click "Advanced" → "Proceed to localhost (unsafe)"
4. The application should load over HTTPS

## 📊 Architecture Overview

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS (443)
       ▼
┌─────────────────────┐
│   Nginx (Front-end) │
│  - SSL Termination  │
│  - Static Files     │
│  - Reverse Proxy    │
└──────┬──────────────┘
       │ HTTP (internal)
       ▼
┌─────────────────────┐
│  NestJS (Back-end)  │
│  - API Endpoints    │
│  - Business Logic   │
└─────────────────────┘
```

## ⚙️ Configuration Details

### Nginx Configuration (`packages/front-end/nginx.conf`)

- **Port 80**: Redirects to HTTPS (301)
- **Port 443**: Serves content with SSL
- **SSL Protocols**: TLSv1.2 and TLSv1.3
- **Reverse Proxy**: `/api/*` routes to back-end service

### Docker Compose Changes

- Front-end container now exposes ports 80 and 443
- SSL certificates mounted as read-only volume: `./ssl:/etc/nginx/ssl:ro`
- Health check uses HTTPS with `--no-check-certificate`

## 🔧 Troubleshooting

### Certificate Errors in Browser

If you see certificate errors:

1. Ensure the certificate is trusted (see Step 1)
2. Clear browser cache and restart
3. Check that the certificate CN matches your domain

### Port Conflicts

If port 443 or 80 is already in use:

```bash
# Check what's using the port
lsof -i :443
lsof -i :80

# Stop conflicting services or change ports in docker-compose.yml
```

### Container Won't Start

Check logs:

```bash
docker-compose logs front-end
```

Common issues:

- Missing SSL certificates: Run `./generate-ssl-cert.sh`
- Permission issues: Ensure `ssl/` directory is readable
- Port conflicts: Change port mappings in `docker-compose.yml`

### Internal Communication Issues

The front-end proxies API requests to the back-end internally via HTTP (not HTTPS). This is normal and secure because:

- Communication happens within the Docker network
- External traffic is encrypted via HTTPS
- No sensitive data is exposed on internal network

To verify internal proxy works:

```bash
docker exec -it ai-agent-frontend wget -O- http://back-end:3000/health
```

## 🔄 Regenerating Certificates

If you need to regenerate certificates (e.g., expired):

```bash
# Remove old certificates
rm -rf ssl/

# Generate new ones
./generate-ssl-cert.sh

# Restart containers
docker-compose restart front-end
```

## 🛡️ Security Notes

⚠️ **Self-signed certificates are for development/testing only!**

For production:

- Use certificates from a trusted CA (Let's Encrypt, DigiCert, etc.)
- Enable HSTS (already configured in nginx.conf)
- Regularly rotate certificates
- Monitor certificate expiration

## 📝 Quick Reference Commands

```bash
# Generate certificates
./generate-ssl-cert.sh

# Start services
docker-compose up -d

# View logs
docker-compose logs -f front-end

# Test HTTPS
curl -k https://localhost:443/

# Restart front-end after cert changes
docker-compose restart front-end

# Check certificate details
openssl x509 -in ssl/server.crt -text -noout
```

## 🎯 Next Steps

After HTTPS is working:

1. Test all API endpoints through the HTTPS proxy
2. Verify WebSocket connections work (if used)
3. Update any hardcoded HTTP URLs in the codebase
4. Consider setting up automatic certificate renewal

---

**Need Help?** Check the Docker logs or review the nginx configuration for detailed error messages.
