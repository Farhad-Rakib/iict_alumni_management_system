#!/bin/bash

# TMS CI/CD Setup Helper Script
# This script helps you verify and set up your CI/CD pipeline

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Start
print_header "TMS CI/CD Setup Checker"

# 1. Check Git
print_info "Checking Git configuration..."
if ! command -v git &> /dev/null; then
    print_error "Git is not installed"
    exit 1
fi
print_success "Git is installed"

# Check remote
if git remote -v | grep -q origin; then
    REMOTE_URL=$(git remote get-url origin)
    print_success "Git remote configured: $REMOTE_URL"
else
    print_warning "No git remote found. You'll need to add it:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/TMS.git"
fi

# Check branches
if git branch | grep -q main; then
    print_success "Main branch exists"
else
    print_warning "Main branch not found"
fi

# 2. Check GitHub CLI
print_info "\nChecking GitHub CLI..."
if command -v gh &> /dev/null; then
    print_success "GitHub CLI is installed"
    if gh auth status &> /dev/null; then
        print_success "GitHub CLI is authenticated"
    else
        print_warning "GitHub CLI is not authenticated. Run: gh auth login"
    fi
else
    print_warning "GitHub CLI is not installed. Install with: brew install gh (macOS)"
fi

# 3. Check Docker
print_info "\nChecking Docker configuration..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
else
    print_success "Docker is installed: $(docker --version)"
    
    # Check if logged into Docker Hub
    if docker info 2>/dev/null | grep -q "Username: "; then
        USERNAME=$(docker info 2>/dev/null | grep "Username:" | awk '{print $2}')
        print_success "Logged into Docker Hub as: $USERNAME"
    else
        print_warning "Not logged into Docker Hub. Run: docker login"
    fi
fi

# 4. Check SSH
print_info "\nChecking SSH configuration..."
if [ -f ~/.ssh/id_rsa ] || [ -f ~/.ssh/id_ed25519 ]; then
    print_success "SSH key found"
else
    print_warning "No SSH key found. Generate with: ssh-keygen -t rsa -b 4096"
fi

# 5. Check Workflow Files
print_info "\nChecking workflow files..."
if [ -f ".github/workflows/ci.yml" ]; then
    print_success "Workflow file exists: .github/workflows/ci.yml"
else
    print_error "Workflow file not found: .github/workflows/ci.yml"
fi

if [ -f ".github/scripts/deploy.sh" ]; then
    print_success "Deploy script exists: .github/scripts/deploy.sh"
else
    print_error "Deploy script not found: .github/scripts/deploy.sh"
fi

# 6. Check Documentation
print_info "\nChecking documentation..."
if [ -f "docs/CI_CD_SETUP_GUIDE.md" ]; then
    print_success "CI/CD setup guide found: docs/CI_CD_SETUP_GUIDE.md"
else
    print_warning "CI/CD setup guide not found: docs/CI_CD_SETUP_GUIDE.md"
fi

# 7. Summary
echo ""
print_header "Setup Checklist"

echo -e "${YELLOW}Before deploying to production, ensure:${NC}\n"

echo "1. GitHub Repository:"
echo "   [ ] Repository created and pushed to GitHub"
echo "   [ ] Main and develop branches exist"
echo ""

echo "2. GitHub Secrets (Settings → Secrets and variables → Actions):"
echo "   [ ] DOCKER_USERNAME"
echo "   [ ] DOCKER_PASSWORD (Docker Hub access token)"
echo "   [ ] CONTABO_HOST (VPS IP address)"
echo "   [ ] CONTABO_USER (SSH username)"
echo "   [ ] CONTABO_SSH_PORT (usually 22)"
echo "   [ ] CONTABO_SSH_KEY (SSH private key content)"
echo ""

echo "3. Docker Hub:"
echo "   [ ] Created docker.io account"
echo "   [ ] Generated access token"
echo "   [ ] Created repositories: tms-backend, tms-frontend"
echo ""

echo "4. Contabo VPS:"
echo "   [ ] Docker installed"
echo "   [ ] Docker Compose installed"
echo "   [ ] /opt/tms directory created"
echo "   [ ] .env.production file configured"
echo "   [ ] SSH key authentication set up"
echo ""

echo "5. Local Configuration:"
echo "   [ ] Update .github/scripts/deploy.sh with your repo URL"
echo "   [ ] Docker Hub credentials configured locally"
echo "   [ ] SSH key added to ssh-agent (optional): ssh-add ~/.ssh/your_key"
echo ""

print_header "Next Steps"

echo "1. Complete all checklist items above"
echo ""
echo "2. Test the workflow:"
echo "   git checkout develop"
echo "   git commit --allow-empty -m 'Test CI pipeline'"
echo "   git push origin develop"
echo ""
echo "3. Monitor the run in GitHub Actions:"
echo "   https://github.com/YOUR_USERNAME/TMS/actions"
echo ""
echo "4. Once develop tests pass, test production deployment:"
echo "   git checkout main"
echo "   git commit --allow-empty -m 'Test production deployment'"
echo "   git push origin main"
echo ""
echo "5. For detailed instructions, see:"
echo "   docs/CI_CD_SETUP_GUIDE.md"
echo ""

print_success "Setup checker complete!"
