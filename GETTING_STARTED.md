# Pattern Dojo - Getting Started

Pattern Dojo is a VS Code extension that detects design pattern violations and anti-patterns in your code.

## Quick Start

### Installation

1. **Clone or download** the repository to your local machine
2. **Open** the folder in VS Code
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Compile the TypeScript**:
   ```bash
   npm run compile
   ```
5. **Run the extension** by pressing `F5` or running the "Run Extension" debug configuration

### Using the Extension

Once the extension is running:

1. **Open any code file** (JavaScript, TypeScript, Java, Python, or C#)
2. **Check the Problems panel** (View → Problems) to see detected pattern violations
3. **Hover over** underlined code to see the issue description
4. **Adjust settings** to customize which patterns to analyze

### Example

Open the included `example.ts` file to see various pattern violations detected:

- Singleton with public constructor
- Multiple instantiations suggesting factory pattern
- Observer pattern without cleanup
- Long switch statements suggesting strategy pattern
- Deep inheritance hierarchies suggesting decorator pattern
- Type assertions suggesting adapter pattern
- Classes with too many public methods suggesting facade pattern
- Expensive operations called repeatedly suggesting proxy pattern

## Configuration

Configure Pattern Dojo in your VS Code settings (`.vscode/settings.json` or user settings):

```json
{
  "pattern-dojo.enabled": true,
  "pattern-dojo.patterns": [
    "singleton",
    "factory",
    "observer",
    "strategy",
    "decorator",
    "adapter",
    "facade",
    "proxy"
  ],
  "pattern-dojo.severity": "warning"
}
```

### Configuration Options

- **`pattern-dojo.enabled`** (boolean)
  - Enable or disable the extension
  - Default: `true`

- **`pattern-dojo.patterns`** (array)
  - Which patterns to analyze
  - Available: `singleton`, `factory`, `observer`, `strategy`, `decorator`, `adapter`, `facade`, `proxy`
  - Default: All patterns enabled

- **`pattern-dojo.severity`** (string)
  - Severity level for violations: `error`, `warning`, or `information`
  - Default: `warning`

## Commands

The extension provides two main commands:

- **Pattern Dojo: Refresh Pattern Analysis** - Re-analyze the current file
- **Pattern Dojo: Report Pattern Issue** - Report a false positive or suggest improvements

You can access these through the Command Palette (Ctrl+Shift+P).

## Development

### Watch Mode

For development, use watch mode to automatically compile TypeScript:

```bash
npm run watch
```

Then press `F5` to debug with the latest changes.

### Testing

Run the test suite:

```bash
npm test
```

### Project Structure

```
pattern-dojo/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── types.ts                  # TypeScript interfaces
│   ├── analyzer/
│   │   ├── patternAnalyzer.ts   # Core analysis engine
│   │   └── patternRegistry.ts   # Pattern provider registry
│   └── patterns/
│       ├── index.ts             # Pattern provider factory
│       └── implementations/
│           ├── singletonProvider.ts
│           ├── factoryProvider.ts
│           ├── observerProvider.ts
│           ├── strategyProvider.ts
│           ├── decoratorProvider.ts
│           ├── adapterProvider.ts
│           ├── facadeProvider.ts
│           └── proxyProvider.ts
├── .vscode/
│   ├── launch.json              # Debug configuration
│   ├── tasks.json               # Build tasks
│   ├── settings.json            # Extension settings
│   └── extensions.json          # Recommended extensions
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
└── example.ts                   # Example code showing pattern issues
```

## How to Add Custom Patterns

The extension uses a scalable plugin architecture. To add a new pattern detector:

1. **Create a new file** in `src/patterns/implementations/`:

```typescript
import * as vscode from 'vscode';
import { PatternProvider, PatternViolation } from '../../types';

export class MyPatternProvider implements PatternProvider {
  readonly name = 'My Pattern Detector';
  readonly description = 'Detects My pattern issues';
  readonly patternName = 'mypattern';

  analyze(document: vscode.TextDocument): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const text = document.getText();

    // Your detection logic here
    // Return array of PatternViolation objects

    return violations;
  }
}
```

2. **Update** `src/patterns/index.ts`:

```typescript
import { MyPatternProvider } from './implementations/myPatternProvider';

export function createBuiltInProviders(): PatternProvider[] {
  return [
    // ... existing providers
    new MyPatternProvider(),
  ];
}
```

3. **Compile** and test:

```bash
npm run compile
```

4. Press `F5` to debug with your new pattern.

## Troubleshooting

### Extension not detecting issues?

1. Ensure the file is a **supported language** (JavaScript, TypeScript, Java, Python, C#)
2. Check that the pattern is **enabled** in settings
3. Run **Pattern Dojo: Refresh Pattern Analysis** command
4. Check that `pattern-dojo.enabled` is `true`

### Too many false positives?

1. Adjust `pattern-dojo.severity` to `information` to reduce noise
2. Disable specific patterns in `pattern-dojo.patterns` setting
3. File an issue with an example of the false positive

### Want to disable the extension?

Set `pattern-dojo.enabled: false` in your settings, or uninstall the extension.

## Contributing

To contribute improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes and test them
4. Submit a pull request

## Support

For issues, feature requests, or questions, please open an issue on the GitHub repository.

## License

MIT

## Examples

Open the language-specific examples under the `examples/` folder to see pattern violations in action. Recommended files:

- `examples/ts/example.ts` — TypeScript examples covering singleton, factory, observer, strategy
- `examples/java/Example.java` — Java examples
- `examples/python/example.py` — Python examples
- `examples/csharp/Example.cs` — C# examples

To run locally:

```bash
npm install
npm run compile
# Press F5 in VS Code to run the extension and open one of the example files
```
