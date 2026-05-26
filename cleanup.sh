#!/bin/bash

# Alumni Management System - Cleanup Script
# This script safely stops and cleans up Docker services

set -e

echo "================================"
echo "Cleanup Alumni Management System"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}This will stop and remove containers, networks, and optionally volumes.${NC}"
echo ""

read -p "Do you want to stop the services? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Stopping services...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ Services stopped${NC}"
    echo ""
    
    read -p "Do you want to remove volumes (databases, etc)? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Removing volumes...${NC}"
        docker-compose down -v
        echo -e "${GREEN}✓ Volumes removed${NC}"
        echo -e "${YELLOW}Note: All data in databases has been deleted${NC}"
    fi
else
    echo "Cleanup cancelled"
fi

echo ""
echo -e "${GREEN}Cleanup complete${NC}"
