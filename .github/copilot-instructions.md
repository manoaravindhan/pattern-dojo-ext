# Pattern Dojo - Custom Instructions

## Project Overview
Pattern Dojo is a scalable VS Code extension that detects design pattern violations and anti-patterns in code. It highlights issues in real-time with configurable severity levels.

## Completed Tasks

- [x] Project scaffolded with TypeScript
- [x] Pattern provider interface and registry created for scalability
- [x] Core analyzer engine implemented
- [x] 8 pattern detectors implemented (Singleton, Factory, Observer, Strategy, Decorator, Adapter, Facade, Proxy)
- [x] VS Code integration with diagnostics and commands
- [x] Configuration support for customizable analysis
- [x] Project compiled successfully
- [x] Example file created demonstrating pattern issues

## Architecture

### Scalable Plugin System
- **PatternProvider Interface**: Extensible interface for adding new pattern detectors
- **PatternRegistry**: Manages dynamic registration and discovery of pattern providers
- **PatternAnalyzer**: Core engine coordinating analysis across all providers

### Built-in Patterns
1. **Singleton**: Detects public constructors and multiple instances
2. **Factory**: Flags multiple instantiation points suggesting factory pattern
3. **Observer**: Identifies event listeners without corresponding cleanup
4. **Strategy**: Detects long switch/if-else chains
5. **Decorator**: Highlights deep inheritance hierarchies
6. **Adapter**: Finds type assertions and interface mismatches
7. **Facade**: Identifies classes with overly complex public interfaces
8. **Proxy**: Detects expensive operations that could be cached

## How to Add New Patterns

Create a file in `src/patterns/implementations/` implementing `PatternProvider`:

```typescript
import { PatternProvider, PatternViolation } from '../../types';

export class MyPatternProvider implements PatternProvider {
  readonly name = 'My Pattern Detector';
  readonly description = 'Detects issues with My pattern';
  readonly patternName = 'mypattern';

  analyze(document: vscode.TextDocument): PatternViolation[] {
    // Your detection logic
    return [];
  }
}
```

Then update `src/patterns/index.ts` to include your provider.

## Next Steps for Enhancement

1. Implement AST-based analysis for better pattern detection
2. Add machine learning for pattern anomaly detection
3. Create pattern fix suggestions with code actions
4. Add telemetry and usage analytics
5. Implement pattern metrics dashboard
6. Add support for more languages (currently: JS, TS, Java, Python, C#)
7. Create configuration presets (strict, moderate, lenient)
8. Add pattern documentation links in diagnostics
