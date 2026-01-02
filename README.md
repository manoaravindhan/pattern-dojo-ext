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

- **Configurable**: Customize which patterns to analyze and severity levels

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

## License

MIT
