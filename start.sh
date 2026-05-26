#!/bin/bash

# Alumni Management System - Quick Start Script
# This script starts all services with Docker Compose

set -e

echo "================================"
echo "Starting Alumni Management System"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker daemon is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

echo -e "${BLUE}Checking environment files...${NC}"

# Check backend .env
if [ ! -f "tms_be/.env" ]; then
    echo -e "${RED}Error: tms_be/.env not found${NC}"
    echo "Please run: cp tms_be/.env.example tms_be/.env"
    exit 1
fi

# Check frontend .env
if [ ! -f "tms_ui/.env.local" ]; then
    echo -e "${RED}Error: tms_ui/.env.local not found${NC}"
    echo "Please run: cp tms_ui/.env.example tms_ui/.env.local"
    exit 1
fi

echo -e "${GREEN}✓ Environment files found${NC}"
echo ""

echo -e "${BLUE}Pulling latest images...${NC}"
docker-compose pull

echo ""
echo -e "${BLUE}Building services...${NC}"
docker-compose build --no-cache

echo ""
echo -e "${BLUE}Starting services...${NC}"
docker-compose up -d

echo ""
echo -e "${BLUE}Waiting for services to be ready...${NC}"
sleep 10

# Check if services are running
echo -e "${BLUE}Checking service status...${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Services started successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

echo -e "${BLUE}Access points:${NC}"
echo -e "  Frontend:     ${GREEN}http://localhost:5173${NC}"
echo -e "  Backend API:  ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs:     ${GREEN}http://localhost:8000/docs${NC}"
echo -e "  ReDoc:        ${GREEN}http://localhost:8000/redoc${NC}"
echo ""

echo -e "${BLUE}Useful commands:${NC}"
echo "  View logs:           docker-compose logs -f"
echo "  View backend logs:   docker-compose logs -f backend"
echo "  View frontend logs:  docker-compose logs -f frontend"
echo "  Stop services:       docker-compose down"
echo "  Restart services:    docker-compose restart"
echo ""

echo -e "${YELLOW}Note: It may take a minute for databases to initialize.${NC}"
echo -e "${YELLOW}If you see connection errors, wait a moment and try again.${NC}"
echo ""
