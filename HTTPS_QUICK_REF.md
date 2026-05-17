# HTTPS Quick Reference Card

## 🚀 One-Command Setup

```bash
./setup-https.sh
```

## 📋 Essential Commands

### Certificate Management

```bash
# Generate new certificates
./generate-ssl-cert.sh

# View certificate details
openssl x509 -in ssl/server.crt -text -noout

# Check certificate expiration
openssl x509 -in ssl/server.crt -enddate -noout

# Trust certificate on macOS
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ./ssl/server.crt
```

### Docker Operations

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f front-end
docker-compose logs -f back-end

# Restart services
docker-compose restart front-end
docker-compose restart back-end

# Stop all services
docker-compose down

# Check running containers
docker-compose ps
```

### Testing & Verification

```bash
# Test HTTPS endpoint
curl -k https://localhost:443/

# Test API through proxy
curl -k https://localhost:443/api/health

# Check SSL connection
openssl s_client -connect localhost:443

# Verify internal proxy
docker exec -it ai-agent-frontend wget -O- http://back-end:3000/health
```

## 🔍 Troubleshooting Checklist

### Issue: Browser shows "Not Secure"

✅ **Expected for self-signed certs**

- Click "Advanced" → "Proceed to localhost"
- Or trust the certificate (see above)

### Issue: Port 443 already in use

```bash
# Find conflicting process
lsof -i :443

# Kill process (replace PID)
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Issue: Container won't start

```bash
# Check logs
docker-compose logs front-end

# Common fixes:
# 1. Missing certificates
./generate-ssl-cert.sh

# 2. Permission issues
chmod -R 644 ssl/

# 3. Rebuild container
docker-compose build front-end
docker-compose up -d front-end
```

### Issue: API requests failing

```bash
# Check nginx configuration
docker exec -it ai-agent-frontend cat /etc/nginx/conf.d/default.conf

# Test backend directly
docker exec -it ai-agent-backend curl http://localhost:3000/health

# Check environment variables
docker exec -it ai-agent-frontend env | grep VITE
```

## 📁 File Locations

```
Project Root/
├── ssl/                          # SSL Certificates
│   ├── server.crt               # Public certificate
│   ├── server.key               # Private key (keep secure!)
│   └── openssl.cnf              # OpenSSL config
│
├── packages/front-end/
│   ├── nginx.conf               # Nginx configuration
│   ├── Dockerfile               # Front-end container
│   └── .env                     # Front-end env vars
│
├── packages/back-end/
│   └── .env                     # Back-end env vars
│
├── docker-compose.yml           # Docker orchestration
├── generate-ssl-cert.sh         # Certificate generator
├── setup-https.sh               # Automated setup script
└── .env                         # Root environment vars
```

## 🔐 Security Checklist

- [ ] SSL certificates generated
- [ ] Private key permissions set to 600
- [ ] Certificates added to .gitignore
- [ ] TLSv1.2 and TLSv1.3 enabled
- [ ] Strong cipher suites configured
- [ ] HSTS header enabled
- [ ] Security headers present
- [ ] HTTP→HTTPS redirect working
- [ ] Internal network isolated

## 🌐 Access URLs

| Service        | URL                        | Notes               |
| -------------- | -------------------------- | ------------------- |
| Frontend       | `https://localhost`        | Accept cert warning |
| Backend API    | `https://localhost/api/*`  | Via reverse proxy   |
| Health Check   | `https://localhost/health` | Returns "healthy"   |
| Direct Backend | `http://localhost:3000`    | Not exposed in prod |

## 📊 Monitoring

```bash
# Real-time logs
docker-compose logs -f

# Resource usage
docker stats ai-agent-frontend ai-agent-backend

# Container health
docker inspect --format='{{.State.Health.Status}}' ai-agent-frontend

# Nginx access logs
docker exec -it ai-agent-frontend tail -f /var/log/nginx/access.log

# Nginx error logs
docker exec -it ai-agent-frontend tail -f /var/log/nginx/error.log
```

## 🔄 Regeneration Workflow

```bash
# 1. Stop services
docker-compose down

# 2. Remove old certificates
rm -rf ssl/

# 3. Generate new certificates
./generate-ssl-cert.sh

# 4. Rebuild and start
docker-compose up -d --build

# 5. Clear browser cache
#    (Important! Browsers cache SSL sessions)

# 6. Test new setup
curl -k https://localhost:443/
```

## 💡 Pro Tips

1. **Browser Cache**: After regenerating certs, clear browser cache or use incognito mode
2. **Certificate Validity**: Self-signed certs are valid for 365 days by default
3. **Production**: Replace self-signed certs with CA-signed ones before going live
4. **Backup**: Backup your `ssl/` directory if you want to reuse certificates
5. **Debug Mode**: Add `error_log /var/log/nginx/error.log debug;` to nginx.conf for detailed logs

## 🆘 Emergency Procedures

### Lost Private Key

```bash
# Must regenerate everything
rm -rf ssl/
./generate-ssl-cert.sh
docker-compose up -d --build
```

### Certificate Expired

```bash
# Same as lost key - regenerate
./generate-ssl-cert.sh
docker-compose restart front-end
```

### Security Breach Suspected

```bash
# 1. Stop all services immediately
docker-compose down

# 2. Remove compromised certificates
rm -rf ssl/

# 3. Generate new certificates
./generate-ssl-cert.sh

# 4. Review logs for unauthorized access
docker-compose logs --tail=1000 > incident.log

# 5. Rebuild and restart
docker-compose up -d --build
```

---

**Quick Links:**

- [Full Setup Guide](./HTTPS_SETUP.md)
- [Architecture Diagram](./HTTPS_ARCHITECTURE.md)
- [Configuration Summary](./HTTPS_CONFIGURATION_SUMMARY.md)
