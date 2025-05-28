# Frontend Testing Setup

This directory contains test files for the frontend components and integration tests.

## Types of Tests

1. **Component Tests**: Test individual React components in isolation
2. **Integration Tests**: Test interactions between multiple components
3. **API Mock Tests**: Test frontend interaction with mocked backend APIs

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific tests
npm test -- Login

# Run tests in watch mode (useful during development)
npm test -- --watch
```

## Test File Naming Convention

- `*.test.js`: Unit test files
- `*.spec.js`: Integration test files
- `__tests__/`: Directory containing test files

## Testing Libraries

- Jest: Test runner and assertion library
- React Testing Library: Testing React components
- msw: Mock Service Worker for API mocking
