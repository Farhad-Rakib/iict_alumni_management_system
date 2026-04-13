#!/bin/bash

# Alumni Management System - Environment Setup Script
# This script helps set up the environment for local development

set -e

echo "================================"
echo "Alumni Management System Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Warning: Docker not found. Please install Docker.${NC}"
else
    echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Warning: Docker Compose not found. Please install Docker Compose.${NC}"
else
    echo -e "${GREEN}✓ Docker Compose found: $(docker-compose --version)${NC}"
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Warning: Python 3 not found${NC}"
else
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Python found: $PYTHON_VERSION${NC}"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Warning: Node.js not found${NC}"
else
    echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}Warning: npm not found${NC}"
else
    echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"
fi

echo ""
echo -e "${BLUE}Setting up environment files...${NC}"

# Setup backend .env
if [ ! -f "tms_be/.env" ]; then
    if [ -f "tms_be/.env.example" ]; then
        cp tms_be/.env.example tms_be/.env
        echo -e "${GREEN}✓ Created tms_be/.env${NC}"
        echo -e "${YELLOW}  Please edit tms_be/.env with your configuration${NC}"
    else
        echo -e "${YELLOW}⚠ tms_be/.env.example not found${NC}"
    fi
else
    echo -e "${GREEN}✓ tms_be/.env already exists${NC}"
fi

# Setup frontend .env
if [ ! -f "tms_ui/.env.local" ]; then
    if [ -f "tms_ui/.env.example" ]; then
        cp tms_ui/.env.example tms_ui/.env.local
        echo -e "${GREEN}✓ Created tms_ui/.env.local${NC}"
    else
        echo -e "${YELLOW}⚠ tms_ui/.env.example not found${NC}"
    fi
else
    echo -e "${GREEN}✓ tms_ui/.env.local already exists${NC}"
fi

echo ""
echo -e "${BLUE}Checking Docker setup...${NC}"

# Check if Docker daemon is running
if docker ps > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Docker daemon is running${NC}"
else
    echo -e "${YELLOW}⚠ Docker daemon is not running. Please start Docker.${NC}"
    echo -e "${YELLOW}  On macOS, run: open -a Docker${NC}"
fi

echo ""
echo -e "${BLUE}Available commands:${NC}"
echo ""
echo -e "${GREEN}Development Setup:${NC}"
echo "  ./setup.sh backend    - Setup backend environment"
echo "  ./setup.sh frontend   - Setup frontend environment"
echo "  ./setup.sh all        - Setup both backend and frontend"
echo ""
echo -e "${GREEN}Running with Docker:${NC}"
echo "  docker-compose up -d              - Start all services"
echo "  docker-compose logs -f            - View logs"
echo "  docker-compose down               - Stop all services"
echo ""
echo -e "${GREEN}Manual Setup:${NC}"
echo "  cd tms_be && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
echo "  cd tms_ui && npm install && npm run dev"
echo ""
echo -e "${GREEN}Testing:${NC}"
echo "  Backend:  cd tms_be && pytest"
echo "  Frontend: cd tms_ui && npm run test"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Edit configuration files (.env files)"
echo "2. Run 'docker-compose up -d' to start services"
echo "3. Access frontend at http://localhost:5173"
echo "4. Access API docs at http://localhost:8000/docs"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
