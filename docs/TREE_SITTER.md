# Tree-Sitter Language Adapter System

## Overview

The Tree-Sitter base layer provides a unified architecture for supporting pattern detection across multiple programming languages. It abstracts away language-specific parsing details through a common AST interface.

## Architecture

### Components

1. **CommonAST Interface** (`src/languages/commonAst.ts`)
   - Defines a language-agnostic AST node structure
   - Supports all major language constructs (classes, methods, fields, statements, expressions)
   - Maps to `NodeKind` enum for type-safe node identification
   - Tracks symbols and their usages across code

2. **LanguageAdapter Interface** (`src/languages/languageAdapter.ts`)
   - Abstract interface for language-specific parsers
   - Each adapter implements parsing and symbol resolution for a specific language
   - Converts language-specific AST to CommonAST format

3. **Language Adapters** (`src/languages/adapters/`)
   - Each adapter translates that language's syntax to CommonAST nodes

4. **LanguageAdapterRegistry** (`src/languages/languageAdapterRegistry.ts`)
   - Central registry for all language adapters
   - Resolves appropriate adapter for a given file
   - Provides parse functionality with automatic language detection

5. **Multi-Language Providers** (`src/patterns/implementations/multiLanguageProviders.ts`)
   - Pattern implementations that work across all supported languages
   - Use CommonAST interface instead of language-specific APIs
   - Currently includes:
     - `MultiLanguageSingletonProvider`
     - `MultiLanguageFactoryProvider`
     - `MultiLanguageDecoratorProvider`

## How It Works

### Parsing Flow

```
Document (e.g., MyClass.ts)
       ↓
LanguageAdapterRegistry (detects file type)
       ↓
TypeScriptLanguageAdapter (language-specific parsing)
       ↓
CommonAST (unified format)
       ↓
Pattern Providers (pattern detection)
       ↓
Diagnostics
```

### Example: Detecting Singleton in TypeScript

```typescript
// Detector code works for TypeScript and JavaScript
class SingletonPatternProvider implements PatternProvider {
  analyze(document: vscode.TextDocument): PatternViolation[] {
    const parseResult = languageAdapterRegistry.parse(document);
    const { rootNode } = parseResult;
    
    // Walk CommonAST (language-agnostic)
    // Check for public constructors in classes
    // Return violations
  }
}

// Automatically works for:
// - TypeScript: export class Singleton { public constructor() {} }
// - JavaScript: export class Singleton { constructor() {} }
// - TSX/JSX: Fully supported with React components
```

## Adding a New Language

### Step 1: Create Language Adapter

```typescript
// src/languages/adapters/goAdapter.ts
import { LanguageAdapter } from '../languageAdapter';
import { CommonASTNode, NodeKind } from '../commonAst';

export class GoLanguageAdapter implements LanguageAdapter {
  readonly extensions = ['.go'];
  readonly languageName = 'Go';

  supports(filePath: string): boolean {
    return filePath.endsWith('.go');
  }

  parse(filePath: string, sourceCode: string): ParseResult {
    // 1. Parse Go code (using tree-sitter-go or similar)
    // 2. Convert to CommonAST nodes
    // 3. Build symbol table
    // 4. Return ParseResult
  }
}
```

### Step 2: Register in Registry

```typescript
// In LanguageAdapterRegistry constructor
this.registerAdapter(new GoLanguageAdapter());
```

### Step 3: Use with Existing Providers

All pattern providers automatically work with the new language!

## Current Implementation

The current implementation is focused on TypeScript and JavaScript:

1. **Real Tree-Sitter parsing** with `web-tree-sitter` and `tree-sitter-typescript`
2. **Single-file symbol resolution** with type information extraction
3. **CommonAST interface** for pattern provider compatibility

## Next Steps

1. **Cross-file symbol resolution** via workspace symbol index
2. **Type inference integration** with TypeScript compiler API
3. **Scope analysis** for variable visibility detection
4. **Performance optimization** via caching and incremental analysis
5. **Support for additional languages** (Go, Rust, etc.) via new adapters

## Example: TypeScript Tree-Sitter Integration

```typescript
import Parser from 'web-tree-sitter';
import TypeScript from 'tree-sitter-typescript';

export class TypeScriptLanguageAdapter implements LanguageAdapter {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(TypeScript.language);
  }

  parse(filePath: string, sourceCode: string): ParseResult {
    const tree = this.parser.parse(sourceCode);
    return this.convertToCommonAST(tree.rootNode, sourceCode);
  }

  private convertToCommonAST(node: Parser.SyntaxNode, source: string): CommonASTNode {
    // Recursively convert Tree-Sitter nodes to CommonAST
    // Handle TypeScript-specific node types (class_declaration, method_definition, etc.)
    // Extract metadata and build symbol table
  }
}
```

## Benefits

✅ **Unified Pattern Implementation**: Pattern logic works across supported languages
✅ **Extensible**: Add new languages without modifying pattern detection logic
✅ **Type-Safe**: CommonAST interface prevents language-specific bugs
✅ **Scalable**: Adapters can be upgraded (regex → Tree-Sitter → Language Server)
✅ **Focused**: Currently optimized for TypeScript/JavaScript ecosystem

## References

- [Tree-Sitter Documentation](https://tree-sitter.github.io)
- [Tree-Sitter TypeScript](https://github.com/tree-sitter/tree-sitter-typescript)
