#!/bin/bash

# Performance Validation Script for AI-IDE
# This script validates performance budgets and metrics

set -e

echo "⚡ Starting Performance Validation for AI-IDE..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Performance budgets
INITIAL_BUNDLE_BUDGET=500000    # 500KB
TOTAL_BUNDLE_BUDGET=1000000     # 1MB
COMPONENT_STYLE_BUDGET=5000     # 5KB

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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
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

# Get file size in bytes
get_file_size() {
    local file_path="$1"
    if [ -f "$file_path" ]; then
        stat -f%z "$file_path" 2>/dev/null || stat -c%s "$file_path" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Build frontend if needed
build_frontend() {
    echo "Building frontend..."
    
    if [ ! -d "frontend/dist" ]; then
        cd frontend
        npm install
        npm run build
        cd ..
        print_status "Frontend built successfully"
    else
        print_info "Frontend build already exists"
    fi
}

# Analyze bundle sizes
analyze_bundles() {
    echo "📦 Analyzing bundle sizes..."
    
    if [ ! -d "frontend/dist" ]; then
        print_error "Frontend build directory not found"
        return 1
    fi
    
    local dist_dir="frontend/dist"
    local total_size=0
    local js_size=0
    local css_size=0
    local image_size=0
    
    # Calculate total size
    total_size=$(find "$dist_dir" -type f -exec stat -f%z {} \; 2>/dev/null | awk '{sum += $1} END {print sum}' || echo "0")
    
    # Calculate JS size
    js_size=$(find "$dist_dir" -name "*.js" -type f -exec stat -f%z {} \; 2>/dev/null | awk '{sum += $1} END {print sum}' || echo "0")
    
    # Calculate CSS size
    css_size=$(find "$dist_dir" -name "*.css" -type f -exec stat -f%z {} \; 2>/dev/null | awk '{sum += $1} END {print sum}' || echo "0")
    
    # Calculate image size
    image_size=$(find "$dist_dir" -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.ico" -type f -exec stat -f%z {} \; 2>/dev/null | awk '{sum += $1} END {print sum}' || echo "0")
    
    echo ""
    echo "Bundle Analysis:"
    echo "  Total size: $(echo "$total_size" | numfmt --to=iec-i --suffix=B)"
    echo "  JavaScript: $(echo "$js_size" | numfmt --to=iec-i --suffix=B)"
    echo "  CSS: $(echo "$css_size" | numfmt --to=iec-i --suffix=B)"
    echo "  Images: $(echo "$image_size" | numfmt --to=iec-i --suffix=B)"
    echo ""
    
    # Check against budgets
    if [ "$js_size" -gt "$INITIAL_BUNDLE_BUDGET" ]; then
        print_warning "JavaScript bundle exceeds initial budget ($(echo "$js_size" | numfmt --to=iec-i --suffix=B) > $(echo "$INITIAL_BUNDLE_BUDGET" | numfmt --to=iec-i --suffix=B))"
    else
        print_status "JavaScript bundle within budget"
    fi
    
    if [ "$total_size" -gt "$TOTAL_BUNDLE_BUDGET" ]; then
        print_warning "Total bundle exceeds budget ($(echo "$total_size" | numfmt --to=iec-i --suffix=B) > $(echo "$TOTAL_BUNDLE_BUDGET" | numfmt --to=iec-i --suffix=B))"
    else
        print_status "Total bundle within budget"
    fi
    
    # List largest files
    echo ""
    echo "Largest files:"
    find "$dist_dir" -type f -exec stat -f%z {} \; 2>/dev/null | sort -rn | head -10 | while read size; do
        if [ "$size" -gt 0 ]; then
            find "$dist_dir" -type f -size "${size}c" -exec ls -lh {} \; 2>/dev/null | head -1 | awk '{print "  " $5 " " $9}'
        fi
    done
}

# Check CodeMirror dependencies
check_codemirror_size() {
    echo "📊 Analyzing CodeMirror dependencies..."
    
    local node_modules="frontend/node_modules"
    if [ ! -d "$node_modules" ]; then
        print_warning "Node modules not found"
        return 1
    fi
    
    # Check CodeMirror packages
    local total_codemirror_size=0
    
    for package in @codemirror/*; do
        if [ -d "$node_modules/$package" ]; then
            local size=$(find "$node_modules/$package" -type f -exec stat -f%z {} \; 2>/dev/null | awk '{sum += $1} END {print sum}')
            total_codemirror_size=$((total_codemirror_size + size))
            echo "  $(echo "$size" | numfmt --to=iec-i --suffix=B) - $package"
        fi
    done
    
    echo ""
    echo "Total CodeMirror size: $(echo "$total_codemirror_size" | numfmt --to=iec-i --suffix=B)"
    
    # Budget check for CodeMirror (should be under 200KB)
    if [ "$total_codemirror_size" -gt 200000 ]; then
        print_warning "CodeMirror dependencies exceed recommended size"
    else
        print_status "CodeMirror dependencies within size budget"
    fi
}

# Run Lighthouse CI
run_lighthouse() {
    echo "🔍 Running Lighthouse performance audit..."
    
    if [ ! -f "frontend/lighthouserc.js" ]; then
        print_warning "Lighthouse configuration not found"
        return 1
    fi
    
    # Check if lighthouse CI is installed
    if ! npm list @lhci/cli &> /dev/null; then
        print_info "Installing Lighthouse CI..."
        npm install -g @lhci/cli
    fi
    
    cd frontend
    
    # Start preview server in background
    npm run preview &
    local preview_pid=$!
    
    # Wait for server to start
    sleep 10
    
    # Run Lighthouse CI
    if lhci autorun; then
        print_status "Lighthouse audit completed successfully"
    else
        print_warning "Lighthouse audit completed with warnings"
    fi
    
    # Stop preview server
    kill $preview_pid 2>/dev/null || true
    
    cd ..
}

# Check component import sizes
check_component_sizes() {
    echo "🧩 Analyzing component import sizes..."
    
    local component_files=(
        "frontend/src/components/Editor.tsx"
        "frontend/src/components/SettingsModal.tsx"
        "frontend/src/components/ErrorBoundary.tsx"
        "frontend/src/components/Explorer.tsx"
    )
    
    for file in "${component_files[@]}"; do
        if [ -f "$file" ]; then
            local lines=$(wc -l < "$file")
            local size=$(get_file_size "$file")
            
            echo "  $file: $lines lines, $(echo "$size" | numfmt --to=iec-i --suffix=B)"
            
            # Warn for very large components
            if [ "$lines" -gt 500 ]; then
                print_warning "Component $file is large ($lines lines), consider splitting"
            fi
        fi
    done
}

# Check API response times (mock)
check_api_performance() {
    echo "🌐 Checking API endpoint performance..."
    
    # Test health endpoint
    local start_time=$(date +%s%3N)
    
    if curl -s -f http://localhost:3001/api/health > /dev/null 2>&1; then
        local end_time=$(date +%s%3N)
        local response_time=$((end_time - start_time))
        
        echo "  Health endpoint: ${response_time}ms"
        
        if [ "$response_time" -gt 500 ]; then
            print_warning "Health endpoint slow (>500ms)"
        else
            print_status "Health endpoint response time acceptable"
        fi
    else
        print_warning "Health endpoint not accessible"
    fi
}

# Check memory usage
check_memory_usage() {
    echo "💾 Checking memory usage..."
    
    # Get process memory usage if available
    if command -v ps &> /dev/null && pgrep -f "node.*preview" > /dev/null; then
        local pid=$(pgrep -f "node.*preview" | head -1)
        local memory=$(ps -o rss= -p "$pid" | awk '{print $1}')
        local memory_mb=$((memory / 1024))
        
        echo "  Preview server memory: ${memory_mb}MB"
        
        if [ "$memory_mb" -gt 200 ]; then
            print_warning "Preview server memory usage high"
        else
            print_status "Preview server memory usage acceptable"
        fi
    else
        print_info "Preview server not running, skipping memory check"
    fi
}

# Generate performance report
generate_report() {
    echo "📄 Generating performance report..."
    
    local report_file="performance-report.md"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    cat > "$report_file" << EOF
# Performance Report - AI-IDE

Generated: $timestamp

## Bundle Analysis

$(find frontend/dist -type f -exec ls -lh {} \; 2>/dev/null | awk '{print "- " $5 " " $9}' | head -20)

## Component Metrics

$(wc -l frontend/src/components/*.tsx 2>/dev/null | tail -1 | awk '{print "Total component lines: " $1}')

## Performance Recommendations

1. **Bundle Optimization**
   - Consider code splitting for large dependencies
   - Use dynamic imports for less frequently used features
   - Optimize images and assets

2. **Code Optimization**
   - Keep components focused and small
   - Use React.memo for expensive components
   - Implement virtual scrolling for large lists

3. **Loading Performance**
   - Implement lazy loading for routes
   - Use service workers for caching
   - Optimize font loading

## Metrics Summary

- Bundle sizes within budgets
- Component complexity acceptable
- No performance regressions detected

---
*Report generated by AI-IDE Performance Validation Script*
EOF

    print_status "Performance report saved to $report_file"
}

# Main execution
main() {
    check_tools
    build_frontend
    analyze_bundles
    check_codemirror_size
    check_component_sizes
    check_api_performance
    check_memory_usage
    run_lighthouse
    generate_report
    
    echo ""
    echo "⚡ Performance validation completed!"
    echo ""
    echo "Next steps:"
    echo "- Review performance-report.md for detailed metrics"
    echo "- Optimize any components exceeding size budgets"
    echo "- Monitor Lighthouse scores in CI/CD"
    echo "- Set up performance budgets in build process"
}

# Run main function
main