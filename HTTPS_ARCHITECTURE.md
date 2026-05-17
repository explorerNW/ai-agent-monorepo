# HTTPS Architecture Diagram

## System Architecture with SSL/TLS

```
┌─────────────────────────────────────────────────────────────┐
│                        User's Browser                        │
│                                                              │
│  Access: https://localhost or https://niewang.uunat.com     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │  HTTPS (TLS Encrypted)
                       │  Port 443
                       │  🔒 Secure Connection
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Nginx Container (Front-end)                     │
│              ai-agent-frontend                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          SSL/TLS Termination Layer                    │  │
│  │                                                       │  │
│  │  • server.crt (SSL Certificate)                      │  │
│  │  • server.key (Private Key)                          │  │
│  │  • TLSv1.2 / TLSv1.3 Protocols                       │  │
│  │  • Strong Cipher Suites                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         HTTP → HTTPS Redirect (Port 80)              │  │
│  │         301 Permanent Redirect                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        Static File Server (React App)                │  │
│  │        /usr/share/nginx/html                         │  │
│  │                                                       │  │
│  │  • index.html                                        │  │
│  │  • JavaScript bundles                                │  │
│  │  • CSS stylesheets                                   │  │
│  │  • Images & Assets                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Reverse Proxy Configuration                     │  │
│  │                                                       │  │
│  │  location /api/ {                                    │  │
│  │    proxy_pass http://back-end:3000/;                 │  │
│  │    proxy_set_header X-Real-IP $remote_addr;          │  │
│  │    proxy_set_header X-Forwarded-Proto $scheme;       │  │
│  │  }                                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │  HTTP (Internal Docker Network)
                       │  Port 3000
                       │  ⚡ Unencrypted (Secure within Docker)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           NestJS Container (Back-end)                        │
│           ai-agent-backend                                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           API Endpoints                               │  │
│  │                                                       │  │
│  │  • /api/chat          - AI Chat Service              │  │
│  │  • /api/analytics     - Performance Metrics          │  │
│  │  • /api/code-review   - Code Review Service          │  │
│  │  • /api/pdf-process   - PDF Processing               │  │
│  │  • /api/ocr           - OCR Service                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Business Logic Layer                          │  │
│  │                                                       │  │
│  │  • LangChain Integration                             │  │
│  │  • RabbitMQ Message Queue                            │  │
│  │  • PostgreSQL Database                               │  │
│  │  • Parallel Task Processing                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow Example

### 1. Initial Page Load

```
Browser                    Nginx                    Backend
   │                         │                         │
   │  GET / (HTTPS)          │                         │
   │ ──────────────────────► │                         │
   │                         │                         │
   │                         │  Serve index.html       │
   │  HTML Response          │                         │
   │ ◄────────────────────── │                         │
   │                         │                         │
   │  Parse HTML, load JS    │                         │
   │  & CSS assets           │                         │
   │ ◄────────────────────── │                         │
   │                         │                         │
```

### 2. API Request

```
Browser                    Nginx                    Backend
   │                         │                         │
   │  POST /api/chat         │                         │
   │  (HTTPS)                │                         │
   │ ──────────────────────► │                         │
   │                         │                         │
   │                         │  Proxy to backend       │
   │                         │ ──────────────────────► │
   │                         │                         │
   │                         │  Process request        │
   │                         │  (AI chat logic)        │
   │                         │                         │
   │                         │  JSON Response          │
   │                         │ ◄────────────────────── │
   │                         │                         │
   │  JSON Response          │                         │
   │ ◄────────────────────── │                         │
   │                         │                         │
```

### 3. WebSocket Connection (if applicable)

```
Browser                    Nginx                    Backend
   │                         │                         │
   │  WS Upgrade Request     │                         │
   │  (wss://)               │                         │
   │ ──────────────────────► │                         │
   │                         │                         │
   │                         │  Upgrade to WebSocket   │
   │                         │ ──────────────────────► │
   │                         │                         │
   │  ↔ Bidirectional        │  ↔ Bidirectional        │
   │     Communication          Communication          │
   │ ◄─────────────────────► │ ◄─────────────────────► │
   │                         │                         │
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                   External Traffic                       │
│                                                         │
│  🔒 HTTPS (TLS Encryption)                              │
│  • All data encrypted in transit                        │
│  • Certificate validation                               │
│  • Perfect Forward Secrecy (PFS)                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              SSL Termination (Nginx)                     │
│                                                         │
│  🔓 Decrypt incoming traffic                            │
│  🔐 Encrypt outgoing responses                          │
│  🛡️  Apply security headers                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Internal Docker Network                     │
│                                                         │
│  ⚡ HTTP (Unencrypted but isolated)                     │
│  • Container-to-container communication                 │
│  • Not exposed to external network                      │
│  • Docker network isolation provides security           │
└─────────────────────────────────────────────────────────┘
```

## Certificate Trust Chain

```
For Self-Signed Certificates (Development):

┌──────────────────────┐
│  Self-Signed Cert    │  ← Created by generate-ssl-cert.sh
│  (server.crt)        │
└──────────┬───────────┘
           │
           │  Not trusted by default
           │
           ▼
┌──────────────────────┐
│  Browser Warning     │  ← "Your connection is not private"
│  "Not Secure"        │
└──────────┬───────────┘
           │
           │  User must manually trust
           │
           ▼
┌──────────────────────┐
│  Add to Trust Store  │  ← sudo security add-trusted-cert
│  (System Keychain)   │
└──────────┬───────────┘
           │
           │  Now trusted ✅
           │
           ▼
┌──────────────────────┐
│  Secure Connection   │  ← No more warnings
│  Established         │
└──────────────────────┘


For Production (CA-Signed):

┌──────────────────────┐
│  CA-Signed Cert      │  ← From Let's Encrypt, DigiCert, etc.
│  (server.crt)        │
└──────────┬───────────┘
           │
           │  Signed by trusted CA
           │
           ▼
┌──────────────────────┐
│  Browser Trusts      │  ← Automatically trusted
│  Automatically ✅    │
└──────────┬───────────┘
           │
           │  No user action needed
           │
           ▼
┌──────────────────────┐
│  Secure Connection   │  ← Green lock icon
│  Established         │
└──────────────────────┘
```

## Port Mapping

```
Host Machine              Docker Container
─────────────            ─────────────────

Port 443  ────────────►  Port 443 (Nginx HTTPS)
Port 80   ────────────►  Port 80  (Nginx HTTP → HTTPS redirect)

Internal Docker Network:
Nginx (front-end)  ────►  Back-end:3000 (HTTP)
```

## Environment Variables Flow

```
.docker-compose.yml
       │
       │  VITE_API_BASE_URL=https://localhost:443
       │
       ▼
┌──────────────────────┐
│  Front-end Build     │  ← Compiled into React app
│  (Vite)              │
└──────────┬───────────┘
           │
           │  API requests use HTTPS
           │
           ▼
┌──────────────────────┐
│  Browser Runtime     │  ← Makes requests to https://localhost:443/api/
└──────────┬───────────┘
           │
           │  Through Nginx reverse proxy
           │
           ▼
┌──────────────────────┐
│  Back-end Service    │  ← Receives HTTP on port 3000
└──────────────────────┘
```

---

**Key Takeaways:**

1. ✅ **External traffic is fully encrypted** via HTTPS/TLS
2. ✅ **Internal communication uses HTTP** within isolated Docker network
3. ✅ **SSL termination at Nginx** provides centralized certificate management
4. ✅ **Reverse proxy** allows seamless API access through same domain
5. ✅ **Security headers** protect against common web vulnerabilities
