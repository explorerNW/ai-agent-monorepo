#!/bin/bash

# SSL Certificate Generation Script for Local Development and Production
# This script generates self-signed certificates for HTTPS development and deployment

set -e

CERT_DIR="./ssl"
CERT_FILE="$CERT_DIR/server.crt"
KEY_FILE="$CERT_DIR/server.key"
CONFIG_FILE="$CERT_DIR/openssl.cnf"

echo "🔐 Generating self-signed SSL certificates..."

# Create ssl directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Support custom domain from environment variable or use defaults
CUSTOM_DOMAIN="${SSL_DOMAIN:-}"
CUSTOM_PORT="${SSL_PORT:-443}"

# Build SAN (Subject Alternative Name) entries
SAN_ENTRIES=""
DNS_COUNT=0
IP_COUNT=0

# Always include localhost for local development
DNS_COUNT=$((DNS_COUNT + 1))
SAN_ENTRIES="${SAN_ENTRIES}DNS.${DNS_COUNT} = localhost\n"

DNS_COUNT=$((DNS_COUNT + 1))
SAN_ENTRIES="${SAN_ENTRIES}DNS.${DNS_COUNT} = *.localhost\n"

IP_COUNT=$((IP_COUNT + 1))
SAN_ENTRIES="${SAN_ENTRIES}IP.${IP_COUNT} = 127.0.0.1\n"

# Add custom domain if provided
if [ -n "$CUSTOM_DOMAIN" ]; then
    echo "🌐 Adding custom domain: ${CUSTOM_DOMAIN}:${CUSTOM_PORT}"
    
    # Extract hostname without port
    HOSTNAME=$(echo "$CUSTOM_DOMAIN" | sed 's|:[0-9]*$||')
    
    DNS_COUNT=$((DNS_COUNT + 1))
    SAN_ENTRIES="${SAN_ENTRIES}DNS.${DNS_COUNT} = ${HOSTNAME}\n"
    
    DNS_COUNT=$((DNS_COUNT + 1))
    SAN_ENTRIES="${SAN_ENTRIES}DNS.${DNS_COUNT} = *.${HOSTNAME}\n"
fi

# Generate OpenSSL configuration file with dynamic SAN entries
cat > "$CONFIG_FILE" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = CN
ST = Beijing
L = Beijing
O = AI Agent Monorepo
OU = Development
CN = ${CUSTOM_DOMAIN:-localhost}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
$(echo -e "$SAN_ENTRIES")
EOF

echo "📋 Certificate will be valid for:"
echo "   - localhost and *.localhost"
echo "   - 127.0.0.1"
if [ -n "$CUSTOM_DOMAIN" ]; then
    echo "   - ${HOSTNAME} and *.${HOSTNAME}"
fi
echo ""

# Generate private key and certificate
echo "📝 Generating private key and certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$KEY_FILE" \
  -out "$CERT_FILE" \
  -config "$CONFIG_FILE" \
  -extensions v3_req

# Set appropriate permissions
chmod 644 "$CERT_FILE"
chmod 600 "$KEY_FILE"

echo ""
echo "✅ SSL certificates generated successfully!"
echo "📁 Certificate location: $CERT_FILE"
echo "🔑 Key location: $KEY_FILE"
echo ""
echo "⚠️  IMPORTANT: These are self-signed certificates for development/testing only."
echo "   Your browser will show a security warning. You need to:"
echo "   1. Accept the security warning in your browser"
echo "   2. Or add the certificate to your system's trusted certificates"
echo ""
echo "To trust this certificate on macOS:"
echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERT_FILE"
echo ""
