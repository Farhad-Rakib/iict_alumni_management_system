#!/bin/bash

###############################################################################
# Application Deployment Script
# Pulls latest code and restarts Docker services
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
APP_DIR="/home/iictadeploy/iictaa"
DEPLOY_USER="iictadeploy"
LOG_DIR="${APP_DIR}/logs"
DEPLOYMENT_LOG="${LOG_DIR}/deployment.log"

# Create log directory
mkdir -p "${LOG_DIR}"

# ============================================
# Deployment Process
# ============================================
{
    log_info "Starting deployment..."
    
    # Change to app directory
    cd "${APP_DIR}"
    
    # Backup current .env
    if [ -f .env.production ]; then
        log_info "Backing up .env.production..."
        cp .env.production ".env.production.backup.$(date +%s)"
    fi
    
    # Pull latest code from git
    log_info "Pulling latest code from repository..."
    git fetch origin
    git checkout production
    git pull origin production
    
    # Load environment
    if [ ! -f .env.production ]; then
        log_error ".env.production not found. Aborting deployment."
        exit 1
    fi
    
    set -a
    source .env.production
    set +a
    
    # Login to container registry
    log_info "Logging in to container registry..."
    echo "${GITHUB_TOKEN}" | docker login ghcr.io -u "farhad-rakib" --password-stdin || {
        log_error "Docker login failed"
        exit 1
    }
    
    # Pull latest images
    log_info "Pulling latest Docker images..."
    docker pull "ghcr.io/farhad-rakib/iict_alumni_management_system/alumni-backend:latest"
    docker pull "ghcr.io/farhad-rakib/iict_alumni_management_system/alumni-frontend:latest"
    
    # Stop old containers
    log_info "Stopping current containers..."
    docker-compose -f docker-compose.prod.yml down
    
    # Remove dangling images
    docker image prune -f
    
    # Start new containers
    log_info "Starting new containers..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to become healthy..."
    sleep 10
    
    # Health check
    log_info "Performing health checks..."
    BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${BACKEND_PORT}/api/v1/health" || echo "000")
    
    if [ "${BACKEND_HEALTH}" = "200" ]; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed (HTTP ${BACKEND_HEALTH})"
        docker-compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
    
    # Cleanup old logs
    log_info "Cleaning up old log files..."
    find "${LOG_DIR}" -name "*.log" -type f -mtime +7 -delete
    
    log_success "Deployment completed successfully!"
    
} | tee -a "${DEPLOYMENT_LOG}"

# Log rotation
if [ -f "${DEPLOYMENT_LOG}" ] && [ $(wc -l < "${DEPLOYMENT_LOG}") -gt 1000 ]; then
    tail -n 500 "${DEPLOYMENT_LOG}" > "${DEPLOYMENT_LOG}.tmp"
    mv "${DEPLOYMENT_LOG}.tmp" "${DEPLOYMENT_LOG}"
fi
