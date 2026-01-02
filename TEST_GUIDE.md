# Unit Tests

## Overview

Pattern Dojo includes a comprehensive test suite using **Mocha** and **Node.js assert** module. Tests cover:

- All 8 pattern detectors (Singleton, Factory, Observer, Strategy, Decorator, Adapter, Facade, Proxy)
- Pattern registry functionality
- Pattern analyzer configuration and behavior

## Running Tests

### Prerequisites

Install dev dependencies:

```bash
npm install
```

### Run Tests

Execute the test suite:

```bash
npm test
```

### Watch Mode (Development)

Compile TypeScript in watch mode and re-run tests:

```bash
npm run watch
```

## Test Structure

Tests are located in `src/test/unit/`:

```
src/test/unit/
├── singletonProvider.test.ts
├── factoryProvider.test.ts
├── observerProvider.test.ts
├── strategyProvider.test.ts
├── decoratorProvider.test.ts
├── adapterProvider.test.ts
├── facadeProvider.test.ts
├── proxyProvider.test.ts
├── patternRegistry.test.ts
└── patternAnalyzer.test.ts
```

## Test Cases

### Singleton Provider Tests

- Detects public constructors in singleton classes
- Detects multiple static instances
- Ignores properly implemented singletons
- Validates provider metadata

### Factory Provider Tests

- Detects multiple instantiations
- Suggests factory pattern for repeated `new` expressions
- Validates provider metadata
- Tests threshold triggers (3+ instantiations)

### Observer Provider Tests

- Detects unsubscribed listeners
- Recognizes proper subscription cleanup patterns
- Handles multiple subscriptions
- Validates provider metadata

### Strategy Provider Tests

- Detects long if-else chains
- Detects long switch statements
- Ignores short conditionals
- Tests branch threshold (4+ branches)

### Decorator Provider Tests

- Detects deep inheritance hierarchies
- Flags excessive inheritance depth (4+ levels)
- Recognizes decorator pattern structures
- Accepts appropriate hierarchy depths

### Adapter Provider Tests

- Detects type assertions suggesting adapters
- Detects try-catch patterns
- Recognizes type mismatch issues
- Flags repeated type assertions

### Facade Provider Tests

- Detects overly complex public interfaces (7+ methods)
- Suggests facade pattern for complex subsystems
- Ignores reasonable public interface sizes
- Recognizes facade pattern structures

### Proxy Provider Tests

- Detects repeated expensive operations
- Suggests caching opportunities
- Recognizes proxy caching patterns
- Ignores single operation calls
- Detects expensive API calls (queries, requests)

### Pattern Registry Tests

- Registers pattern providers
- Retrieves providers by name
- Returns undefined for unregistered patterns
- Lists all registered providers
- Prevents duplicate registrations

### Pattern Analyzer Tests

- Handles empty documents
- Respects enabled/disabled settings
- Filters patterns based on configuration
- Validates severity levels
- Handles configuration changes
- Supports suppression comments
- Respects ignore glob patterns

## Example Test

```typescript
import * as assert from 'assert';
import { SingletonPatternProvider } from '../../patterns/implementations/singletonProvider';

suite('SingletonProvider', () => {
  let provider: SingletonPatternProvider;

  setup(() => {
    provider = new SingletonPatternProvider();
  });

  test('provider has correct metadata', () => {
    assert.strictEqual(provider.name, 'Singleton Pattern Detector');
    assert.strictEqual(provider.patternName, 'singleton');
    assert.ok(provider.description.length > 0);
  });
});
```

## Writing New Tests

1. Create a test file in `src/test/unit/` following the naming pattern: `[feature].test.ts`
2. Import `assert` and the class being tested
3. Use Mocha's `suite()`, `setup()`, and `test()` functions
4. Run tests with `npm test`

## Continuous Integration

Tests can be integrated into CI/CD pipelines:

```bash
# In CI environment
npm install
npm run compile
npm test
```

## Debugging Tests

Run with Node inspector:

```bash
node --inspect-brk ./node_modules/.bin/mocha
```

Then open `chrome://inspect` in Chrome to debug.

## Test Coverage

Current test suite covers:

- ✅ All 8 pattern providers
- ✅ Pattern registry (registration, retrieval, listing)
- ✅ Analyzer configuration (enabled, patterns, severity)
- ✅ Metadata validation for each provider

## Future Test Enhancements

- [ ] Full document parsing integration tests
- [ ] Code action tests
- [ ] Webview component tests
- [ ] Performance benchmarks
- [ ] End-to-end extension tests

## Contributing Tests

When adding new patterns or features:

1. Write unit tests for the feature
2. Ensure all tests pass: `npm test`
3. Add to this documentation
4. Commit tests alongside code

