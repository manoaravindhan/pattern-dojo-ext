# Pattern Dojo Development

## Build

```bash
npm install
npm run compile
```

## Debug

Press `F5` to start debugging the extension in VS Code.

## Watch Mode

```bash
npm run watch
```

Then run the extension with `F5`.

## Test

```bash
npm test
```

## Project Structure

```
src/
├── extension.ts              # Main extension entry point
├── types.ts                  # TypeScript interfaces
├── analyzer/
│   ├── patternAnalyzer.ts   # Core analysis engine
│   └── patternRegistry.ts   # Pattern provider registry
└── patterns/
    ├── index.ts             # Pattern provider factory
    └── implementations/
        ├── singletonProvider.ts
        ├── factoryProvider.ts
        ├── observerProvider.ts
        ├── strategyProvider.ts
        ├── decoratorProvider.ts
        ├── adapterProvider.ts
        ├── facadeProvider.ts
        └── proxyProvider.ts
```

## Adding New Patterns

To add a new pattern detector:

1. Create a new file in `src/patterns/implementations/` implementing `PatternProvider`
2. Add it to the exports in `src/patterns/index.ts`
3. Update `createBuiltInProviders()` to include your new provider

Example:

```typescript
import { PatternProvider, PatternViolation } from '../../types';

export class MyPatternProvider implements PatternProvider {
  readonly name = 'My Pattern Detector';
  readonly description = 'Detects issues with My pattern';
  readonly patternName = 'mypattern';

  analyze(document: vscode.TextDocument): PatternViolation[] {
    // Your detection logic here
    return [];
  }
}
```

## Configuration

The extension supports the following settings:

- `pattern-dojo.enabled` - Enable/disable analysis
- `pattern-dojo.patterns` - Array of patterns to analyze
- `pattern-dojo.severity` - Severity level (error/warning/information)

## Examples

Example projects live in the `examples/` folder. Use these when developing or testing detectors:

```bash
npm install
npm run compile
# Open VS Code and press F5 to run the extension; open an example file under examples/ to validate diagnostics
```
