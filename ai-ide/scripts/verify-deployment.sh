#!/bin/bash

# AI-IDE Vercel Deployment Verification Script
# This script helps verify that your Vercel deployment is working correctly

set -e

echo "🚀 AI-IDE Vercel Deployment Verification"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required commands are available
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        exit 1
    fi
}

# Check environment variables
check_env_vars() {
    echo -e "\n${BLUE}Checking environment variables...${NC}"
    
    if [ -z "$VITE_API_URL" ]; then
        echo -e "${RED}✗${NC} VITE_API_URL is not set"
        echo -e "${YELLOW}Hint:${NC} Set it with: export VITE_API_URL=https://your-backend-url.com"
        return 1
    else
        echo -e "${GREEN}✓${NC} VITE_API_URL is set: $VITE_API_URL"
    fi
    
    if [ -z "$VITE_WS_URL" ]; then
        echo -e "${RED}✗${NC} VITE_WS_URL is not set"
        echo -e "${YELLOW}Hint:${NC} Set it with: export VITE_WS_URL=wss://your-backend-url.com"
        return 1
    else
        echo -e "${GREEN}✓${NC} VITE_WS_URL is set: $VITE_WS_URL"
    fi
    
    return 0
}

# Test API endpoints
test_api() {
    echo -e "\n${BLUE}Testing API endpoints...${NC}"
    
    if curl -f -s "$VITE_API_URL/api/health" > /dev/null; then
        echo -e "${GREEN}✓${NC} Backend API is accessible"
    else
        echo -e "${RED}✗${NC} Backend API is not accessible at $VITE_API_URL"
        echo -e "${YELLOW}Hint:${NC} Make sure your backend is deployed and running"
        return 1
    fi
    
    return 0
}

# Test WebSocket connection
test_websocket() {
    echo -e "\n${BLUE}Testing WebSocket connection...${NC}"
    
    # Simple WebSocket connection test using Node.js
    if command -v node &> /dev/null; then
        cat > /tmp/ws_test.js << 'EOF'
const WebSocket = require('ws');
const url = process.env.VITE_WS_URL || 'ws://localhost:4000';

const ws = new WebSocket(url);

ws.on('open', () => {
    console.log('✓ WebSocket connection successful');
    ws.close();
    process.exit(0);
});

ws.on('error', (error) => {
    console.log('✗ WebSocket connection failed:', error.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('✗ WebSocket connection timeout');
    process.exit(1);
}, 5000);
EOF
        
        if node /tmp/ws_test.js; then
            echo -e "${GREEN}✓${NC} WebSocket connection test passed"
        else
            echo -e "${RED}✗${NC} WebSocket connection test failed"
            echo -e "${YELLOW}Hint:${NC} Check if your backend WebSocket server is running"
            rm -f /tmp/ws_test.js
            return 1
        fi
        
        rm -f /tmp/ws_test.js
    else
        echo -e "${YELLOW}⚠${NC} Node.js not available, skipping WebSocket test"
    fi
    
    return 0
}

# Check frontend build
check_build() {
    echo -e "\n${BLUE}Checking frontend build...${NC}"
    
    if [ -d "frontend/dist" ]; then
        echo -e "${GREEN}✓${NC} Frontend build directory exists"
        
        if [ -f "frontend/dist/index.html" ]; then
            echo -e "${GREEN}✓${NC} Frontend build output exists"
        else
            echo -e "${RED}✗${NC} Frontend build output missing"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} Frontend build directory missing"
        echo -e "${YELLOW}Hint:${NC} Run: cd frontend && npm run build"
        return 1
    fi
    
    return 0
}

# Main verification process
main() {
    echo -e "${BLUE}Starting verification process...${NC}\n"
    
    # Check required commands
    check_command curl
    check_command npm
    
    # Environment checks
    if ! check_env_vars; then
        echo -e "\n${RED}Environment variable check failed${NC}"
        exit 1
    fi
    
    # Backend connectivity
    if ! test_api; then
        echo -e "\n${RED}API connectivity check failed${NC}"
        exit 1
    fi
    
    # WebSocket connectivity
    test_websocket
    
    # Frontend build check
    if ! check_build; then
        echo -e "\n${RED}Build check failed${NC}"
        exit 1
    fi
    
    echo -e "\n${GREEN}🎉 All checks passed! Your deployment should work correctly.${NC}"
    echo -e "\n${BLUE}Next steps:${NC}"
    echo "1. Deploy backend to your chosen platform"
    echo "2. Update environment variables in Vercel dashboard"
    echo "3. Deploy frontend: npm run vercel:deploy"
    echo "4. Test the deployed application"
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose output"
    echo ""
    echo "Environment variables required:"
    echo "  VITE_API_URL   Backend API URL (e.g., https://backend.railway.app)"
    echo "  VITE_WS_URL    WebSocket URL (e.g., wss://backend.railway.app)"
    echo ""
    echo "Example:"
    echo "  VITE_API_URL=https://my-backend.railway.app VITE_WS_URL=wss://my-backend.railway.app $0"
}

# Parse command line arguments
VERBOSE=false
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Run main function
main