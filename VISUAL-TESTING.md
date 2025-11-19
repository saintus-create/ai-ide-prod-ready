# Visual Regression Testing Configuration

## Overview

Visual regression testing ensures that UI components and pages maintain consistent appearance across different environments, browsers, and viewports. This document outlines the visual testing setup for the AI-IDE.

## Configuration Files

### 1. Playwright Visual Tests
- **File**: `frontend/e2e/visual.spec.ts`
- **Purpose**: Automated screenshot capture and comparison
- **Coverage**: All major UI states and components

### 2. Lighthouse CI Configuration
- **File**: `frontend/lighthouserc.js`
- **Purpose**: Performance and accessibility visual testing
- **Metrics**: Core Web Vitals, accessibility scores

### 3. Performance Budget Configuration
- **File**: `frontend/perf-budget.config.json`
- **Purpose**: Define size and performance thresholds
- **Monitoring**: Bundle sizes, loading times, visual stability

## Test Coverage

### Component States
- ✅ Default (dark theme)
- ✅ Light theme
- ✅ Error boundary state
- ✅ Loading states
- ✅ Mobile responsive
- ✅ Tablet responsive
- ✅ High contrast mode
- ✅ Reduced motion

### UI Components
- ✅ Settings modal (all tabs)
- ✅ File explorer
- ✅ Code editor
- ✅ Git panel
- ✅ Toast notifications
- ✅ Mobile hamburger menu

### Cross-Browser Testing
- ✅ Chrome (Desktop)
- ✅ Firefox (Desktop)
- ✅ Safari (Desktop)
- ✅ Mobile Chrome (Android)
- ✅ Mobile Safari (iOS)

## Visual Testing Commands

```bash
# Run visual regression tests
cd frontend
npx playwright test visual.spec.ts

# Run with debugging
npx playwright test visual.spec.ts --debug

# Generate new baselines
npx playwright test visual.spec.ts --update-snapshots

# Run specific test
npx playwright test visual.spec.ts -g "Homepage layout"

# Run with different viewport
npx playwright test visual.spec.ts --project="Mobile Chrome"
```

## Baseline Management

### Creating New Baselines
1. Run tests on clean environment
2. Screenshots saved to `test-results/`
3. Update baselines when intentionally changing UI

### Updating Baselines
```bash
# Update all baselines
npx playwright test --update-snapshots

# Update specific test
npx playwright test visual.spec.ts -g "Settings modal" --update-snapshots
```

### Baseline Storage
- **Local**: `frontend/test-results/`
- **CI/CD**: Uploaded as artifacts
- **Version Control**: Git LFS for binary files

## Threshold Configuration

### Screenshot Comparison
```typescript
await expect(page).toHaveScreenshot('component.png', {
  animations: 'disabled',
  fullPage: false,
  maxDiffPixelRatio: 0.01, // 1% pixel difference threshold
});
```

### Performance Thresholds
- **LCP**: < 2.5s
- **FID**: < 100ms  
- **CLS**: < 0.1
- **Performance Score**: > 90
- **Accessibility Score**: > 90

## CI/CD Integration

### GitHub Actions Integration
```yaml
Visual Regression:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npx playwright install
    - run: npm run build
    - run: npx playwright test visual.spec.ts
    - uses: actions/upload-artifact@v4
      with:
        name: visual-regression-results
        path: frontend/test-results/
```

### Failure Handling
- **Automatic Retries**: 2 retries for flaky tests
- **Artifact Upload**: Screenshots and diffs saved
- **Notifications**: Slack/email on visual failures
- **Baseline Updates**: PR comments with visual diffs

## Best Practices

### Writing Visual Tests
1. **Disable animations**: Consistent screenshots
2. **Use specific selectors**: Stable element targeting
3. **Set consistent viewport**: Standardize screen sizes
4. **Mock external dependencies**: Consistent data

### Example Test Pattern
```typescript
test('Component state', async ({ page }) => {
  await page.goto('/component');
  
  // Set consistent viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // Disable animations
  await page.addStyleTag({
    content: '* { animation: none !important; transition: none !important; }'
  });
  
  // Wait for dynamic content
  await page.waitForSelector('[data-testid="content-loaded"]');
  
  // Take screenshot
  await expect(page).toHaveScreenshot('component.png', {
    animations: 'disabled',
    fullPage: false,
    maxDiffPixelRatio: 0.01,
  });
});
```

## Troubleshooting

### Common Issues

#### Flaky Tests
- **Cause**: Timing issues, animations, network calls
- **Solution**: Wait for specific conditions, disable animations

#### False Positives
- **Cause**: Fonts, images, dynamic content
- **Solution**: Use consistent data, mock external services

#### Performance Issues
- **Cause**: Large screenshots, complex pages
- **Solution**: Optimize selectors, use viewport-specific tests

### Debug Commands
```bash
# Debug visual test
npx playwright test visual.spec.ts -g "Homepage layout" --debug

# View test results
npx playwright show-trace trace.zip

# Compare screenshots
npx playwright test visual.spec.ts --reporter=list
```

## Metrics Dashboard

### Visual Regression Metrics
- **Pass Rate**: Percentage of tests passing
- **False Positives**: Incorrect failure rate
- **Build Time**: Time to complete visual tests
- **Coverage**: Components tested

### Performance Visual Metrics
- **Core Web Vitals**: LCP, FID, CLS trends
- **Bundle Size**: Size over time
- **Loading Performance**: Page load metrics
- **Accessibility**: Score trends

This visual regression testing setup ensures the AI-IDE maintains consistent, high-quality visual appearance across all deployment environments and user interactions.