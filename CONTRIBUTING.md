# Contributing to TheWebAgent

Thank you for your interest in contributing to TheWebAgent! This document provides guidelines and information for contributors.

## 🚀 Quick Start for Contributors

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/TheWebAgent.git
   cd TheWebAgent
   ```
3. **Install dependencies**:
   ```bash
   npm install
   npm run install:browsers
   ```
4. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Guidelines

### Code Standards

- **TypeScript**: Use strict TypeScript with proper types
- **ESLint**: Follow the project's ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **Naming**: Use descriptive names for variables, functions, and classes

### Testing Requirements

- **Unit Tests**: Write tests for new functionality
- **Integration Tests**: Add integration tests for complex features
- **Coverage**: Maintain test coverage above 80%
- **Browser Tests**: Test across Chrome and Firefox when applicable

### Commit Guidelines

Follow conventional commits format:

```
type(scope): description

feat(core): add new browser adapter
fix(api): resolve WebSocket connection issue
docs(readme): update installation instructions
test(cli): add integration tests
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🔧 Development Workflow

### Before Making Changes

```bash
# Ensure you're on latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature

# Run tests to ensure everything works
npm test
```

### During Development

```bash
# Run development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Check code quality
npm run lint
npm run typecheck
```

### Before Submitting

```bash
# Run full test suite
npm test

# Check formatting
npm run format:check

# Build project
npm run build
```

## 📝 Pull Request Process

### PR Requirements

- [ ] Clear description of changes
- [ ] Tests pass (CI must be green)
- [ ] Code follows project standards
- [ ] Documentation updated if needed
- [ ] No merge conflicts with main

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues
2. Try latest version
3. Reproduce consistently

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the issue.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Environment:**
- OS: [e.g. macOS 12.0]
- Node.js: [e.g. 18.17.0]
- Browser: [e.g. Chrome 115]
- Package version: [e.g. 1.0.0]

**Additional context**
Screenshots, logs, or other context.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem.

**Describe the solution you'd like**
Clear description of desired solution.

**Describe alternatives considered**
Other solutions you've considered.

**Additional context**
Screenshots, mockups, or examples.
```

## 🏗️ Architecture Guidelines

### Package Structure

- **Core**: Browser automation logic
- **API**: HTTP server and WebSocket handling
- **Web UI**: React-based dashboard
- **CLI**: Command-line interface

### Design Principles

- **Modularity**: Keep packages focused and independent
- **Testability**: Write testable, mockable code
- **Performance**: Optimize for speed and memory usage
- **Compatibility**: Support multiple browsers and adapters

## 📖 Documentation

### Documentation Types

- **API Docs**: JSDoc comments for public APIs
- **README**: Setup and usage instructions
- **Examples**: Working code examples
- **Architecture**: Design decisions and patterns

### Writing Guidelines

- Use clear, concise language
- Include working code examples
- Keep documentation up-to-date with code changes
- Use proper Markdown formatting

## 🚀 Release Process

### Version Bumping

```bash
# Patch release (bug fixes)
npm version patch

# Minor release (new features)
npm version minor

# Major release (breaking changes)
npm version major
```

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped appropriately
- [ ] Git tag created
- [ ] GitHub release created

## 🆘 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and community discussion
- **Documentation**: Check package READMEs and docs/

## 🎯 Good First Issues

Look for issues labeled:
- `good first issue`: Perfect for new contributors
- `help wanted`: Community help needed
- `documentation`: Documentation improvements
- `testing`: Test coverage improvements

Thank you for contributing to TheWebAgent! 🚀
