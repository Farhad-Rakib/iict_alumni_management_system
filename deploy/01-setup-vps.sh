#!/bin/bash

###############################################################################
# Contabo VPS Deployment Script
# Sets up Docker, Docker Compose, and required services
# Ubuntu 24.04 LTS
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}
# ============================================
# 1. Install Docker
# ============================================
log_info "Installing Docker..."

# Remove old Docker installation if exists
sudo apt-get remove -y docker docker.io containerd runc || true

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Ensure docker group exists
sudo groupadd -f docker

log_success "Docker installed"
# ============================================
# 2. Create Dedicated CI/CD Deployment User
# ============================================
log_info "Creating dedicated deployment user..."

DEPLOY_USER="iictadeploy"
DEPLOY_HOME="/home/${DEPLOY_USER}"

# Check if user exists
if id "${DEPLOY_USER}" &>/dev/null; then
    log_warn "User ${DEPLOY_USER} already exists"
else
    # Create user with home directory and no shell
    sudo useradd -m -s /bin/bash "${DEPLOY_USER}"
    log_success "Deployment user '${DEPLOY_USER}' created"
fi

# Add user to docker group
sudo usermod -aG docker "${DEPLOY_USER}"
log_info "Added ${DEPLOY_USER} to docker group"

# Add sudo privileges for docker and service commands (without password)
echo "${DEPLOY_USER} ALL=(ALL) NOPASSWD: /usr/bin/systemctl, /usr/bin/docker, /usr/local/bin/docker-compose" | sudo tee /etc/sudoers.d/${DEPLOY_USER} > /dev/null
sudo chmod 440 /etc/sudoers.d/${DEPLOY_USER}
log_success "Sudo privileges configured for ${DEPLOY_USER}"

# ============================================
# 1.1 Update System Packages
# ============================================
log_info "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y
log_success "System packages updated"

# ============================================
# 2. Install Required Dependencies
# ============================================
log_info "Installing required dependencies..."
sudo apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common

log_success "Dependencies installed"



# ============================================
# 4. Install Docker Compose
# ============================================
log_info "Installing Docker Compose..."

DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

log_success "Docker Compose installed: $(docker-compose --version)"

# ============================================
# 5. Configure Docker Daemon
# ============================================
log_info "Configuring Docker daemon..."

sudo systemctl daemon-reload
sudo systemctl enable docker
sudo systemctl start docker

# Add current user to docker group (optional, for convenience)
sudo usermod -aG docker ${USER} || true

log_success "Docker daemon configured"

# ============================================
# 6. Install PostgreSQL
# ============================================
log_info "Installing PostgreSQL..."

sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install -y postgresql-16 postgresql-contrib-16 postgresql-client-16

# Enable and start PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

log_success "PostgreSQL installed and running"

# ============================================
# 7. Install Redis (Optional)
# ============================================
log_info "Installing Redis..."

sudo apt-get install -y redis-server

# Configure Redis to require password (edit /etc/redis/redis.conf)
sudo systemctl enable redis-server
sudo systemctl start redis-server

log_success "Redis installed and running"

# ============================================
# 8. Install Nginx (Reverse Proxy)
# ============================================
log_info "Installing Nginx..."

sudo apt-get install -y nginx

sudo systemctl enable nginx
sudo systemctl start nginx

log_success "Nginx installed and running"

# ============================================
# 9. Install Certbot for SSL Certificates
# ============================================
log_info "Installing Certbot for SSL..."

sudo apt-get install -y certbot python3-certbot-nginx

log_success "Certbot installed"

# ============================================
# 10. Create Application Directory
# ============================================
log_info "Creating application directory..."

APP_DIR="/home/${DEPLOY_USER}/iictaa"
sudo mkdir -p "${APP_DIR}"
sudo chown "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"

log_success "Application directory created: ${APP_DIR}"

# ============================================
# 11. Create systemd service for auto-restart
# ============================================
log_info "Creating systemd service for TMS..."

sudo tee /etc/systemd/system/iictaa.service > /dev/null <<EOF
[Unit]
Description=IICT Alumni Management System (Docker Compose)
Requires=docker.service
After=docker.service
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
User=${DEPLOY_USER}
Group=${DEPLOY_USER}
WorkingDirectory=${APP_DIR}
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
Restart=on-failure
RestartSec=60s
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin"

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable iictaa.service

log_success "Systemd service created"

# ============================================
# 12. Display Next Steps
# ============================================
echo ""
echo -e "${GREEN}=== Installation Complete ===${NC}"
echo ""
echo "Deployment User:"
echo "  Username: ${DEPLOY_USER}"
echo "  Home: ${DEPLOY_HOME}"
echo "  Directory: ${APP_DIR}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Set up PostgreSQL database:"
echo "   sudo -u postgres psql"
echo "   CREATE DATABASE alumni_db;"
echo "   CREATE USER alumni_user WITH PASSWORD 'your_password';"
echo "   GRANT ALL PRIVILEGES ON DATABASE alumni_db TO alumni_user;"
echo ""
echo "2. Configure Redis password (optional):"
echo "   Edit /etc/redis/redis.conf and add: requirepass your_password"
echo ""
echo "3. Switch to deployment user:"
echo "   sudo su - ${DEPLOY_USER}"
echo ""
echo "4. Pull your application code:"
echo "   cd ${APP_DIR}"
echo "   git clone https://github.com/Farhad-Rakib/iict_alumni_management_system.git ."
echo ""
echo "5. Copy environment configuration:"
echo "   cp .env.production.template .env.production"
echo "   nano .env.production  # Edit with your settings"
echo ""
echo "6. Configure Nginx reverse proxy:"
echo "   See deploy/nginx-config.conf for template"
echo ""
echo "7. Set up SSL certificate:"
echo "   sudo certbot certonly --nginx -d yourdomain.com"
echo ""
echo "8. Start the services:"
echo "   cd ${APP_DIR}"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo -e "${BLUE}Documentation: See docs/CONTABO_DEPLOYMENT_GUIDE.md${NC}"
echo ""

log_success "All installations complete!"
