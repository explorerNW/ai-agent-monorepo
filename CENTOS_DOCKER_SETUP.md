# Docker Setup Guide for CentOS

## Quick Start

```bash
# Make the script executable
chmod +x docker.sh

# Start services
./docker.sh start
```

## Installing Docker Compose on CentOS

If you encounter the error `docker-compose: command not found`, you need to install Docker Compose.

### Method 1: Install Docker Compose Plugin (Recommended)

For CentOS/RHEL systems with Docker installed:

```bash
sudo yum install docker-compose-plugin
```

Verify installation:

```bash
docker compose version
```

### Method 2: Manual Installation

If the plugin is not available in your repository:

```bash
# Create the CLI plugins directory (if it doesn't exist)
sudo mkdir -p /usr/libexec/docker/cli-plugins

# Download the latest Docker Compose binary
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/libexec/docker/cli-plugins/docker-compose

# Make it executable
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose
```

Verify installation:

```bash
docker compose version
```

### Method 3: Install Standalone docker-compose (Legacy)

For older systems:

```bash
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose
```

Verify installation:

```bash
docker-compose --version
```

## Troubleshooting

### Issue: "command not found"

**Solution:** The `docker.sh` script now automatically detects which Docker Compose command is available on your system. It will use:

- `docker compose` (new syntax) if available, OR
- `docker-compose` (old syntax) as fallback

If neither is found, you'll see an error message with installation instructions.

### Issue: Permission denied

**Solution:** Make sure the script is executable:

```bash
chmod +x docker.sh
```

### Issue: Docker daemon not running

**Solution:** Start Docker service:

```bash
sudo systemctl start docker
sudo systemctl enable docker  # Enable auto-start on boot
```

## Available Commands

```bash
./docker.sh start          # Start production services
./docker.sh start:dev      # Start development services
./docker.sh stop           # Stop all services
./docker.sh restart        # Restart all services
./docker.sh logs           # View all logs
./docker.sh build          # Rebuild all services
./docker.sh status         # Show container status
./docker.sh clean          # Remove all containers and volumes
./docker.sh help           # Show help
```

## Service Ports

- **Front-end**: http://localhost:3001
- **Back-end**: http://localhost:3000

## Next Steps

After successful installation, see [DOCKER.md](DOCKER.md) for detailed configuration options.
