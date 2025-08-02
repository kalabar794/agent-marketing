# Playwright Test Suite for Agentic Marketing Generator

This comprehensive test suite validates all aspects of the agentic marketing generator application using Playwright end-to-end testing.

## Test Coverage

### Pages Tested
- **Home Page (/)** - Landing page with hero section, stats, and navigation
- **Dashboard (/dashboard)** - Metrics dashboard with agent status and projects
- **Create Content (/create)** - Content creation form with validation
- **Agent Workflow (/workflow)** - Real-time workflow tracking
- **Quality Control (/quality)** - Quality analysis and approval interface

### Test Categories

#### 1. Basic Functionality (`home.spec.ts`, `dashboard.spec.ts`, `create.spec.ts`, `workflow.spec.ts`, `quality.spec.ts`)
- Page loading and rendering
- Content display and layout
- Basic interactions and button clicks
- Form functionality and validation
- API integration (mocked)

#### 2. Navigation and Routing (`navigation.spec.ts`)
- Inter-page navigation via navigation bar
- URL routing and direct navigation
- Browser back/forward button handling
- Active navigation state highlighting
- 404 error handling

#### 3. Error Handling (`error-handling.spec.ts`)
- Missing parameter handling (workflow/quality pages without IDs)
- API failure responses
- Network errors and timeouts
- Form validation errors
- Malformed data handling
- User error recovery flows

#### 4. UI Responsiveness (`ui-responsiveness.spec.ts`)
- Mobile, tablet, and desktop viewports
- Touch interactions on mobile devices
- Text readability across screen sizes
- Layout stacking and grid behavior
- No horizontal scrolling validation
- Keyboard accessibility

#### 5. Integration Testing (`integration.spec.ts`)
- Complete user flows from start to finish
- Cross-page data flow and state management
- End-to-end content creation workflow
- Error recovery and retry scenarios
- Performance and loading states

## Key Test Scenarios

### Form Validation
- Required field validation on create page
- Partial form completion handling
- API error responses during submission
- Loading states during form submission

### Error States
- Workflow page without ID parameter
- Quality page without ID parameter
- Invalid workflow IDs
- API failures and network errors
- Graceful error recovery

### Responsive Design
- 6 different viewport sizes tested
- Mobile touch interactions
- Tablet and desktop layouts
- Text scaling and readability
- Layout overflow prevention

### API Integration
- Mocked API responses for all endpoints
- Success and failure scenarios
- Loading state handling
- Real-time updates simulation

## Running Tests

### Basic Test Execution
```bash
npm run test                # Run all tests headless
npm run test:headed        # Run tests with browser UI
npm run test:ui            # Run tests with Playwright UI
npm run test:debug         # Run tests in debug mode
npm run test:report        # Show test report
```

### Specific Test Files
```bash
npx playwright test home.spec.ts           # Home page tests only
npx playwright test create.spec.ts         # Create page tests only
npx playwright test error-handling.spec.ts # Error handling tests only
```

### Browser-Specific Testing
```bash
npx playwright test --project=chromium     # Chrome only
npx playwright test --project=firefox      # Firefox only
npx playwright test --project=webkit       # Safari only
```

### Mobile Testing
```bash
npx playwright test --project="Mobile Chrome"  # Mobile Chrome
npx playwright test --project="Mobile Safari"  # Mobile Safari
```

## Test Configuration

### Browsers Tested
- **Desktop**: Chromium, Firefox, WebKit (Safari)
- **Mobile**: Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)

### Viewport Sizes
- Mobile Portrait: 375×667
- Mobile Landscape: 667×375
- Tablet Portrait: 768×1024
- Tablet Landscape: 1024×768
- Desktop Small: 1280×720
- Desktop Large: 1920×1080

### Test Environment
- Base URL: http://localhost:3000
- Auto-start dev server before tests
- Screenshots on failure
- Video recording on failure
- Trace collection on retry

## Mocked APIs

The test suite mocks the following API endpoints:

### Content Generation API (`/api/content/generate`)
- **POST**: Start content generation (returns workflow ID)
- **GET**: Get workflow status (returns workflow data)

### Quality Control API (`/api/quality`)
- **POST**: Submit quality approval/rejection

### Mock Data
- Workflow status with agent progress
- Quality scores and metrics
- Content metadata and statistics
- Error responses for failure scenarios

## Test Data Patterns

### Successful Workflows
```typescript
{
  status: 'completed',
  agents: [
    { agentId: 'content-strategist', status: 'completed', progress: 100 },
    { agentId: 'content-writer', status: 'completed', progress: 100 }
  ],
  qualityScores: { overall: 92, seo: 88, brandAlignment: 96 }
}
```

### Error Scenarios
- Network failures
- API timeouts
- Invalid parameters
- Malformed responses
- Missing data

## Best Practices

### Test Organization
- One spec file per page/feature
- Descriptive test names
- Grouped related tests in describe blocks
- Shared setup in beforeEach hooks

### Assertions
- Wait for elements with `expect().toBeVisible()`
- Use `toContainText()` for partial text matching
- Test user-visible behavior, not implementation details
- Verify loading states and error messages

### Mocking
- Mock all external API calls
- Test both success and failure scenarios
- Use realistic mock data
- Simulate network conditions (delays, failures)

### Responsive Testing
- Test multiple viewport sizes
- Verify touch interactions on mobile
- Check layout overflow prevention
- Validate text readability

## Debugging Failed Tests

### Screenshot Analysis
Failed tests automatically capture screenshots in `test-results/`

### Video Recordings
Test execution videos are saved for failed tests

### Debug Mode
```bash
npm run test:debug
```
Opens Playwright inspector for step-by-step debugging

### Trace Viewer
```bash
npx playwright show-trace test-results/trace.zip
```
Visual timeline of test execution

## Continuous Integration

The test suite is designed to run in CI environments:
- Headless execution by default
- Retry failed tests twice
- Generate HTML reports
- Fail build on test failures

### CI Configuration Example
```yaml
- name: Run Playwright Tests
  run: npx playwright test
- name: Upload Test Report
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Add tests for both success and failure scenarios
3. Include responsive design tests for new UI components
4. Mock all API interactions
5. Test error states and edge cases
6. Add integration tests for complete user flows