# Contributing to FastCheckOut

First off, thank you for considering contributing to FastCheckOut! 🎉

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if relevant**
- **Include your environment details** (OS, Node version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** following our code style
4. **Add tests** for any new functionality
5. **Ensure tests pass**: `npm test`
6. **Run linter**: `npm run lint`
7. **Update documentation** if needed
8. **Commit with clear messages** following conventional commits
9. **Push to your fork** and submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/fastcheckout.git
cd fastcheckout

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your test credentials

# Start development server
npm run dev

# Run tests
npm test
npm run test:e2e
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Provide proper type annotations
- Avoid `any` types
- Use interfaces for public APIs

### Code Style

- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful variable names
- Keep functions small and focused
- Add comments for complex logic

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add PayPal subscription support
fix: resolve checkout abandonment tracking
docs: update API documentation
test: add tests for plugin system
refactor: simplify validation logic
```

### Testing

- Write unit tests for utilities and business logic
- Write integration tests for API routes
- Write E2E tests for critical user flows
- Aim for >80% code coverage

## Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── api/         # API routes
│   └── checkout/    # Checkout pages
├── components/       # React components
├── contexts/         # React contexts
├── lib/             # Utilities and core logic
├── plugins/         # Plugin system
└── types/           # TypeScript type definitions
```

## Plugin Development

When creating plugins:

1. Follow the `Plugin` interface in `src/types/index.ts`
2. Add examples to `src/plugins/examples.ts`
3. Document plugin hooks and usage
4. Include tests for plugin functionality

## Documentation

- Update README.md for user-facing changes
- Update docs/ for API changes
- Add JSDoc comments for public functions
- Include examples in documentation

## Release Process

Maintainers will handle releases:

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create GitHub release
4. Publish Docker image
5. Deploy to production

## Questions?

Feel free to:
- Open a discussion on GitHub
- Join our community Slack
- Email: opensource@fastcheckout.dev

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to FastCheckOut!** 💙
