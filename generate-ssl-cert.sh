#!/bin/bash

# SSL Certificate Generation Script for Local Development
# This script generates self-signed certificates for HTTPS development

set -e

CERT_DIR="./ssl"
CERT_FILE="$CERT_DIR/server.crt"
KEY_FILE="$CERT_DIR/server.key"
CONFIG_FILE="$CERT_DIR/openssl.cnf"

echo "🔐 Generating self-signed SSL certificates..."

# Create ssl directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate OpenSSL configuration file
cat > "$CONFIG_FILE" << 'EOF'
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
CN = localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
EOF

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
echo "⚠️  IMPORTANT: These are self-signed certificates for development only."
echo "   Your browser will show a security warning. You need to:"
echo "   1. Accept the security warning in your browser"
echo "   2. Or add the certificate to your system's trusted certificates"
echo ""
echo "To trust this certificate on macOS:"
echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERT_FILE"
echo ""
