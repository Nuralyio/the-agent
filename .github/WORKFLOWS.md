# GitHub Actions Workflows

This repository uses GitHub Actions for continuous integration and testing.
Here's an overview of our workflows:

## 🔄 Continuous Integration Workflows

### 1. **CI Tests** (`ci.yml`)

- **Triggers**: Push to `main`/`develop`, Pull Requests
- **Purpose**: Core validation with multiple browser/adapter combinations
- **Matrix**: Node.js 18.x & 20.x × Chrome & Firefox × Playwright & Puppeteer
- **Features**:
  - ESLint code quality checks
  - TypeScript compilation validation
  - Cross-browser test execution
  - Artifact collection on failure

### 2. **Test Coverage** (`test-coverage.yml`)

- **Triggers**: Push to `main`, PRs, Daily at 2 AM UTC
- **Purpose**: Comprehensive test suite coverage
- **Jobs**:
  - **Quick Tests**: Fast validation (Chrome + Playwright)
  - **Comprehensive Matrix**: All test suites × browsers × adapters
  - **Parallel Execution**: Scheduled parallel test runs
- **Artifacts**: Execution logs and screenshots on failure

### 3. **Pull Request Validation** (`pr-validation.yml`)

- **Triggers**: PR opened/updated
- **Purpose**: Code quality and basic functionality validation
- **Features**:
  - Code formatting verification
  - Linting and TypeScript checks
  - Core test execution
  - Automated PR comments with results
  - Security scanning with TruffleHog
  - npm audit for dependency vulnerabilities

### 4. **Release** (`release.yml`)

- **Triggers**: Release published, version tags
- **Purpose**: Release validation and distribution
- **Features**:
  - Full test suite execution
  - Build verification
  - Cross-platform compatibility testing (Ubuntu, Windows, macOS)
  - Build artifact creation
  - npm publish preparation

## 🎯 Test Execution Strategy

### Matrix Testing

```yaml
Browser Support: [chrome, firefox]
Adapters: [playwright, puppeteer]
Node.js: [18.x, 20.x]
Test Suites:
  - Navigation Tests
  - Screenshot Tests
  - Form Filling Tests
  - Interaction Tests
  - Dynamic Planning Tests
```

### Environment Variables

```bash
CI=true
BROWSER_HEADLESS=true
BROWSER_TYPE=chrome|firefox
BROWSER_ADAPTER=playwright|puppeteer
TEST_TIMEOUT=60000
```

## 📊 Status Badges

Add these badges to your README or documentation:

```markdown
[![CI Tests](https://github.com/Nuralyio/Agent/actions/workflows/ci.yml/badge.svg)](https://github.com/Nuralyio/Agent/actions/workflows/ci.yml)
[![Test Coverage](https://github.com/Nuralyio/Agent/actions/workflows/test-coverage.yml/badge.svg)](https://github.com/Nuralyio/Agent/actions/workflows/test-coverage.yml)
[![PR Validation](https://github.com/Nuralyio/Agent/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/Nuralyio/Agent/actions/workflows/pr-validation.yml)
[![Release](https://github.com/Nuralyio/Agent/actions/workflows/release.yml/badge.svg)](https://github.com/Nuralyio/Agent/actions/workflows/release.yml)
```

## 🚀 Local Testing

To run the same tests locally that CI runs:

```bash
# Install dependencies
npm ci
npx playwright install --with-deps

# Run linting and type checking
npm run lint
npm run typecheck

# Run tests (matching CI configuration)
npm test -- --headless --browser chrome --adapter playwright "Navigation Tests"
npm test -- --headless --browser firefox --adapter playwright "Form Filling Tests"
npm test -- --parallel all  # Parallel execution
```

## 🔧 Workflow Configuration

### Secrets Required

- `NPM_TOKEN`: For npm package publishing (optional)

### Branch Protection

Recommended branch protection rules for `main`:

- Require PR reviews: 1
- Require status checks: CI Tests, PR Validation
- Restrict pushes to main branch
- Require up-to-date branches

### Artifact Retention

- Test artifacts: 3-7 days
- Build artifacts: 30 days
- Screenshots: 3 days (failure only)

## 📈 Monitoring & Debugging

### Test Failure Investigation

1. Check the Actions tab for detailed logs
2. Download execution-logs and screenshots artifacts
3. Review console output for specific error messages
4. Run locally with same configuration:
   `npm test -- --headless --browser [browser] --adapter [adapter] "[suite]"`

### Performance Monitoring

- Test execution times tracked per matrix combination
- Artifact sizes monitored for storage optimization
- Daily scheduled runs for regression detection
