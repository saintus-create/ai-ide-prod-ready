#!/bin/bash

# Security Scanning Script for AI-IDE
# This script performs comprehensive security checks

set -e

echo "🔒 Starting Security Scan for AI-IDE..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_tools() {
    echo "Checking required tools..."
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        print_error "npx is not installed"
        exit 1
    fi
    
    print_status "Required tools found"
}

# Security: Check for secrets in code
scan_secrets() {
    echo "🔍 Scanning for secrets in code..."
    
    # Check for common API keys and tokens
    patterns=(
        "api_key.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
        "secret.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
        "token.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
        "password.*=.*['\"][^'\"]+['\"]"
        "ghp_[a-zA-Z0-9]{36}"
        "sk-[a-zA-Z0-9]{48}"
    )
    
    found_secrets=false
    
    for pattern in "${patterns[@]}"; do
        if grep -r -E "$pattern" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" . 2>/dev/null; then
            print_error "Potential secret found with pattern: $pattern"
            found_secrets=true
        fi
    done
    
    if [ "$found_secrets" = false ]; then
        print_status "No secrets found in code"
    fi
}

# Security: Check for SQL injection patterns
scan_sql_injection() {
    echo "🔍 Checking for SQL injection vulnerabilities..."
    
    # Check for raw SQL queries without parameterization
    sql_patterns=(
        "SELECT.*FROM.*WHERE.*\$"
        "INSERT.*VALUES.*\$"
        "UPDATE.*SET.*WHERE.*\$"
        "DELETE.*FROM.*WHERE.*\$"
    )
    
    found_vulnerabilities=false
    
    for pattern in "${sql_patterns[@]}"; do
        if grep -r -E "$pattern" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" . 2>/dev/null; then
            print_warning "Potential SQL injection vulnerability: $pattern"
            found_vulnerabilities=true
        fi
    done
    
    if [ "$found_vulnerabilities" = false ]; then
        print_status "No SQL injection patterns found"
    fi
}

# Security: Check for XSS vulnerabilities
scan_xss() {
    echo "🔍 Checking for XSS vulnerabilities..."
    
    # Check for dangerous innerHTML usage
    xss_patterns=(
        "innerHTML.*="
        "dangerouslySetInnerHTML"
        "eval\("
        "document\.write"
    )
    
    found_xss=false
    
    for pattern in "${xss_patterns[@]}"; do
        if grep -r -E "$pattern" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" . 2>/dev/null; then
            print_warning "Potential XSS vulnerability: $pattern"
            found_xss=true
        fi
    done
    
    if [ "$found_xss" = false ]; then
        print_status "No obvious XSS patterns found"
    fi
}

# Dependency security audit
audit_dependencies() {
    echo "🔍 Auditing dependencies for vulnerabilities..."
    
    # Backend audit
    if [ -d "backend" ]; then
        echo "Auditing backend dependencies..."
        cd backend
        npm audit --audit-level=moderate --json > ../backend-audit.json 2>/dev/null || true
        
        if [ -s "../backend-audit.json" ]; then
            print_warning "Backend vulnerabilities found. Check backend-audit.json"
        else
            print_status "Backend dependencies are secure"
        fi
        cd ..
    fi
    
    # Frontend audit
    if [ -d "frontend" ]; then
        echo "Auditing frontend dependencies..."
        cd frontend
        npm audit --audit-level=moderate --json > ../frontend-audit.json 2>/dev/null || true
        
        if [ -s "../frontend-audit.json" ]; then
            print_warning "Frontend vulnerabilities found. Check frontend-audit.json"
        else
            print_status "Frontend dependencies are secure"
        fi
        cd ..
    fi
}

# Check for vulnerable dependencies
check_vulnerable_deps() {
    echo "🔍 Checking for known vulnerable dependencies..."
    
    # Install and run snyk if available
    if npm list snyk &> /dev/null; then
        npx snyk test --severity-threshold=medium
    else
        print_warning "Snyk not available, skipping dependency vulnerability scan"
    fi
}

# Check Docker security
scan_docker() {
    echo "🔍 Scanning Docker images for vulnerabilities..."
    
    if command -v docker &> /dev/null; then
        # Check if Docker files exist
        if [ -f "backend/Dockerfile" ]; then
            echo "Scanning backend Dockerfile..."
            # Basic Dockerfile security checks
            if grep -q "USER root" backend/Dockerfile; then
                print_warning "Backend Dockerfile runs as root user"
            else
                print_status "Backend Dockerfile uses non-root user"
            fi
            
            if grep -q "COPY.*\.\.\." backend/Dockerfile; then
                print_warning "Backend Dockerfile uses parent directory COPY"
            fi
        fi
        
        if [ -f "frontend/Dockerfile" ]; then
            echo "Scanning frontend Dockerfile..."
            if grep -q "USER root" frontend/Dockerfile; then
                print_warning "Frontend Dockerfile runs as root user"
            else
                print_status "Frontend Dockerfile uses non-root user"
            fi
        fi
    else
        print_warning "Docker not available, skipping Docker security scan"
    fi
}

# Check network security
scan_network() {
    echo "🔍 Checking network security configurations..."
    
    # Check for hardcoded IPs
    if grep -r -E "https?://[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" . 2>/dev/null; then
        print_warning "Hardcoded IP addresses found - use domain names instead"
    fi
    
    # Check for HTTP instead of HTTPS
    if grep -r "http://" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" . 2>/dev/null; then
        print_warning "HTTP URLs found - consider using HTTPS"
    fi
}

# Check authentication and authorization
scan_auth() {
    echo "🔍 Checking authentication and authorization..."
    
    # Check for missing authentication checks
    auth_patterns=(
        "express\.router\("
        "app\.post\("
        "app\.get\("
    )
    
    for pattern in "${auth_patterns[@]}"; do
        if grep -r "$pattern" backend/src/routes/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v "auth\|Auth\|middleware" > /dev/null; then
            print_warning "Route $pattern may need authentication middleware"
        fi
    done
    
    # Check for JWT secret handling
    if grep -r "jwtSecret\|JWT_SECRET" --include="*.ts" --include="*.js" . 2>/dev/null; then
        print_status "JWT secret handling found"
    fi
}

# Main execution
main() {
    check_tools
    scan_secrets
    scan_sql_injection
    scan_xss
    audit_dependencies
    check_vulnerable_deps
    scan_docker
    scan_network
    scan_auth
    
    echo ""
    echo "🔒 Security scan completed!"
    echo ""
    echo "Recommendations:"
    echo "- Run 'npm audit fix' to fix dependency vulnerabilities"
    echo "- Consider using Snyk for continuous security monitoring"
    echo "- Implement security headers (CSP, HSTS, X-Frame-Options)"
    echo "- Use environment variables for all secrets and API keys"
    echo "- Enable rate limiting on all API endpoints"
    echo "- Implement proper input validation and sanitization"
}

# Run main function
main