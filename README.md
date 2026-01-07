# Pattern Lens - Design Pattern Issue Detector

Pattern Lens is a scalable VS Code extension that detects common design pattern violations and anti-patterns in your code, highlighting them for easy identification and refactoring.


![VS Code window displaying Pattern Lens extension detecting design pattern violations in TypeScript code. The editor shows a Database class with a singleton pattern issue highlighted in yellow. The Problems panel at the bottom lists seven pattern violations including singleton non-private constructor, observer unsubscribed event listener, and multiple strategy pattern long if-else chains. The interface demonstrates real-time code analysis with diagnostic messages and pattern suggestions.](images/demo.gif)


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

- **Configurable**: Customize which patterns to analyze and severity levels

## Supported Languages

- JavaScript (.js)
- TypeScript (.ts, .tsx)

## Extensibility

Support for additional languages can be added through the extension's architecture.

## Usage

The extension automatically analyzes your code when you open or edit files. Pattern violations are highlighted with underlines or squiggles based on the configured severity level.

### Commands

- **Pattern Lens: Refresh Pattern Analysis** - Manually refresh the analysis for the current file
- **Pattern Lens: Report Pattern Issue** - Report a false positive or suggest a new pattern
- **Pattern Lens: Disable Pattern** - Disable a specific pattern in your settings

## Configuration

Configure Pattern Lens in your VS Code settings:

```json
{
  "pattern-lens.enabled": true,
  "pattern-lens.patterns": {
      "singleton": true,
      "factory": true,
      "observer": true
  },
  "pattern-lens.severity": {
      "singleton": "warning"
  }
}
```

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community guidelines.

## License

MIT
