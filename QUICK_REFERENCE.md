# Pattern Dojo - Quick Reference

## Installation & Running

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run in debug mode
# Press F5 in VS Code

# Watch mode for development
npm run watch
```

## Configuration (settings.json)

```json
{
  "pattern-dojo.enabled": true,
  "pattern-dojo.patterns": [
    "singleton", "factory", "observer", "strategy",
    "decorator", "adapter", "facade", "proxy"
  ],
  "pattern-dojo.severity": "warning"
}
```

## Commands

| Command | Action |
|---------|--------|
| `Pattern Dojo: Refresh` | Re-analyze current file |
| `Pattern Dojo: Report Issue` | Report false positive |

## Pattern Detectors

| Pattern | Detects |
|---------|---------|
| **Singleton** | Public constructors, multiple instances |
| **Factory** | Multiple instantiation points |
| **Observer** | Missing cleanup in event listeners |
| **Strategy** | Long switch/if-else chains |
| **Decorator** | Deep inheritance hierarchies |
| **Adapter** | Type assertions, interface mismatches |
| **Facade** | Classes with too many public methods |
| **Proxy** | Expensive operations without caching |

## File Structure

```
src/
├── extension.ts           # Main entry point
├── types.ts              # Interfaces
├── analyzer/
│   ├── patternAnalyzer.ts
│   └── patternRegistry.ts
└── patterns/
    ├── index.ts
    └── implementations/
        ├── adapterProvider.ts
        ├── decoratorProvider.ts
        ├── facadeProvider.ts
        ├── factoryProvider.ts
        ├── observerProvider.ts
        ├── proxyProvider.ts
        ├── singletonProvider.ts
        └── strategyProvider.ts
```

## Add Custom Pattern

1. Create `src/patterns/implementations/myPattern.ts`:
```typescript
import { PatternProvider, PatternViolation } from '../../types';

export class MyPatternProvider implements PatternProvider {
  readonly name = 'My Pattern';
  readonly patternName = 'mypattern';
  
  analyze(document) {
    // Detection logic
    return violations;
  }
}
```

2. Update `src/patterns/index.ts`:
```typescript
import { MyPatternProvider } from './implementations/myPattern';

export function createBuiltInProviders() {
  return [
    // ... existing
    new MyPatternProvider(),
  ];
}
```

## Key Classes

### PatternAnalyzer
- Analyzes documents
- Reports diagnostics
- Manages configuration

### PatternRegistry
- Registers providers
- Looks up providers by name
- Coordinates analysis

### PatternProvider (Interface)
```typescript
interface PatternProvider {
  name: string;
  description: string;
  patternName: string;
  analyze(doc: TextDocument): PatternViolation[];
}
```

## Debugging

1. Set breakpoints in VS Code
2. Press F5 to start debug session
3. Trigger patterns by editing files
4. Step through code

## Build & Publish

```bash
# Compile
npm run compile

# Create .vsix package (requires vsce)
npm install -g @vscode/vsce
vsce package

# Publish to marketplace (requires account)
vsce publish
```

## Performance Tips

- Patterns analyzed on save (debounced 500ms)
- Only analyzes supported languages
- Can disable patterns for performance
- Set severity to reduce noise

## Supported Languages

- JavaScript (.js)
- TypeScript (.ts, .tsx)
- Java (.java)
- Python (.py)
- C# (.cs)

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Diagnostics](https://code.visualstudio.com/api/references/vscode-api#Diagnostic)
- [Design Patterns](https://refactoring.guru/design-patterns)

## Examples

Open `examples/ts/example.ts`, `examples/java/Example.java`, `examples/python/example.py`, or `examples/csharp/Example.cs` to see quick pattern demos. To compile and run the extension locally:

```bash
npm install
npm run compile
# Press F5 in VS Code and open an example file
```
