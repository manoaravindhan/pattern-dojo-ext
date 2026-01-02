# Pattern Dojo - Design Pattern Issue Detector

Pattern Dojo is a scalable VS Code extension that detects common design pattern violations and anti-patterns in your code, highlighting them for easy identification and refactoring.

## Features

- **Pattern Detection**: Automatically detects violations of common design patterns including:
  - Singleton
  - Factory
  - Observer
  - Strategy
  - Decorator
  - Adapter
  - Facade
  - Proxy

- **Real-time Highlighting**: Issues are highlighted as you type with configurable severity levels

- **Scalable Architecture**: Plugin-based system allows easy addition of new pattern detectors

- **Configurable**: Customize which patterns to analyze and severity levels

## Installation

Install the extension from the VS Code marketplace or from the `.vsix` file.

## Usage

The extension automatically analyzes your code when you open or edit files. Pattern violations are highlighted with underlines or squiggles based on the configured severity level.

### Commands

- **Pattern Dojo: Refresh Pattern Analysis** - Manually refresh the analysis for the current file
- **Pattern Dojo: Report Pattern Issue** - Report a false positive or suggest a new pattern

## Configuration

Configure Pattern Dojo in your VS Code settings:

```json
{
  "pattern-dojo.enabled": true,
  "pattern-dojo.patterns": ["singleton", "factory", "observer"],
  "pattern-dojo.severity": "warning"
}
```

## Architecture

The extension uses a scalable plugin-based architecture:

- **Pattern Providers**: Each pattern has its own provider module that implements the detection logic
- **Analyzer Engine**: Coordinates pattern detection across all providers
- **VS Code Integration**: Handles diagnostics reporting and highlighting

### Adding New Patterns

To add a new pattern detector:

1. Create a new file in `src/patterns/` implementing the `PatternProvider` interface
2. Register the provider in `src/analyzer/patternRegistry.ts`
3. The analyzer automatically uses the new provider

## Development

### Build

```bash
npm install
npm run compile
```

### Watch Mode

```bash
npm run watch
```

### Test

```bash
npm test
```

## License

MIT

## Examples

- Try the examples in the `examples/` folder for quick demos:
  - JavaScript/TypeScript: examples/ts/example.ts
  - Java: examples/java/Example.java
  - Python: examples/python/example.py
  - C#: examples/csharp/Example.cs

Run the example flow locally:

```bash
npm install
npm run compile
# Open the project in VS Code and press F5 to run the extension; open an example file to see diagnostics
```
