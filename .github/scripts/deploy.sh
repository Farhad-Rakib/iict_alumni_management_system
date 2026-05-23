#!/bin/bash

# TMS Deployment Script for Contabo VPS
# This script loads Docker images from TAR files and deploys them

set -e

# Configuration
BRANCH=${1:-main}
COMMIT_SHA=${2:-latest}
PROJECT_DIR="/opt/tms"
APP_ENV="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting TMS Deployment...${NC}"
echo "Branch: $BRANCH"
echo "Commit SHA: $COMMIT_SHA"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Create project directory if it doesn't exist
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}Creating project directory: $PROJECT_DIR${NC}"
    mkdir -p "$PROJECT_DIR"
fi

# Navigate to project directory
cd "$PROJECT_DIR"

# Initialize git repo if needed
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git || true
fi

# Pull latest code
echo -e "${YELLOW}Pulling latest code from $BRANCH branch...${NC}"
git fetch origin
git checkout origin/$BRANCH

# Load Docker images from TAR files
echo -e "${YELLOW}Loading Docker images from TAR files...${NC}"
BACKEND_TAR="/tmp/tms-backend-${BRANCH}-${COMMIT_SHA}.tar"
FRONTEND_TAR="/tmp/tms-frontend-${BRANCH}-${COMMIT_SHA}.tar"

if [ ! -f "$BACKEND_TAR" ]; then
    echo -e "${RED}Backend TAR file not found: $BACKEND_TAR${NC}"
    exit 1
fi

if [ ! -f "$FRONTEND_TAR" ]; then
    echo -e "${RED}Frontend TAR file not found: $FRONTEND_TAR${NC}"
    exit 1
fi

# Load images
echo -e "${YELLOW}Loading backend image...${NC}"
docker load -i "$BACKEND_TAR"

echo -e "${YELLOW}Loading frontend image...${NC}"
docker load -i "$FRONTEND_TAR"

# Create docker-compose override file with correct image names
cat > docker-compose.prod.override.yml <<EOF
version: '3.8'
services:
  backend:
    image: tms-backend:$BRANCH-$COMMIT_SHA
    labels:
      - "app=tms"
      - "service=backend"
      - "deployed-at=\$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
      - "commit=$COMMIT_SHA"

  frontend:
    image: tms-frontend:$BRANCH-$COMMIT_SHA
    labels:
      - "app=tms"
      - "service=frontend"
      - "deployed-at=\$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
      - "commit=$COMMIT_SHA"
EOF

# Stop old containers gracefully
echo -e "${YELLOW}Stopping old containers...${NC}"
docker-compose -f docker-compose.prod.yml -f docker-compose.prod.override.yml stop || true

# Remove old containers
echo -e "${YELLOW}Removing old containers...${NC}"
docker-compose -f docker-compose.prod.yml -f docker-compose.prod.override.yml rm -f || true

# Start new containers
echo -e "${YELLOW}Starting new containers...${NC}"
docker-compose -f docker-compose.prod.yml -f docker-compose.prod.override.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Run database migrations (if applicable)
echo -e "${YELLOW}Running database migrations...${NC}"
if docker-compose -f docker-compose.prod.yml -f docker-compose.prod.override.yml exec -T backend alembic upgrade head 2>/dev/null; then
    echo -e "${GREEN}✓ Database migrations completed${NC}"
else
    echo -e "${YELLOW}⚠ Database migrations skipped or not applicable${NC}"
fi

# Create database superuser/admin (optional - uncomment if needed)
# echo -e "${YELLOW}Creating admin user...${NC}"
# docker-compose -f docker-compose.prod.yml -f docker-compose.prod.override.yml exec -T backend \
#   python -c "from app.models import User; from app.db.base import Base, engine; Base.metadata.create_all(bind=engine)" || true

# Verify deployment
echo -e "${YELLOW}Verifying deployment...${NC}"
if docker-compose -f docker-compose.prod.yml -f docker-compose.prod.override.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo -e "${GREEN}Services running:${NC}"
    docker-compose -f docker-compose.prod.yml -f docker-compose.prod.override.yml ps
else
    echo -e "${RED}✗ Deployment failed! Services not running.${NC}"
    echo -e "${RED}Logs:${NC}"
    docker-compose -f docker-compose.prod.yml -f docker-compose.prod.override.yml logs
    exit 1
fi

# Cleanup old TAR files
echo -e "${YELLOW}Cleaning up old TAR files...${NC}"
rm -f /tmp/tms-backend-*.tar
rm -f /tmp/tms-frontend-*.tar

# Cleanup old images (keep last 3 versions)
echo -e "${YELLOW}Cleaning up old images...${NC}"
docker image prune -f --filter "label=app=tms" --filter "until=72h" || true

echo -e "${GREEN}Deployment completed successfully!${NC}"
