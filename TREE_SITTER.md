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
   - **JavaAdapter**: Supports `.java` files
   - **PythonAdapter**: Supports `.py` files
   - **CSharpAdapter**: Supports `.cs` files
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
Document (e.g., MyClass.java)
       ↓
LanguageAdapterRegistry (detects file type)
       ↓
JavaLanguageAdapter (language-specific parsing)
       ↓
CommonAST (unified format)
       ↓
Multi-Language Providers (pattern detection)
       ↓
Diagnostics
```

### Example: Detecting Singleton in Java and Python

```typescript
// Same detector code works for both languages
class MultiLanguageSingletonProvider implements PatternProvider {
  analyze(document: vscode.TextDocument): PatternViolation[] {
    const parseResult = languageAdapterRegistry.parse(document);
    const { rootNode } = parseResult;
    
    // Walk CommonAST (language-agnostic)
    // Check for public constructors in classes
    // Return violations
  }
}

// Automatically works for:
// - Java: public class Singleton { public Singleton() {} }
// - Python: class Singleton: def __init__(self): pass
// - C#: public class Singleton { public Singleton() {} }
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

All multi-language providers automatically work with the new language!

## Current Limitations

The current implementation uses regex-based fallback parsing for demonstration. For production use:

1. **Integrate real Tree-Sitter parsers**:
   - Install: `npm install web-tree-sitter tree-sitter-java tree-sitter-python tree-sitter-c-sharp`
   - Replace regex patterns with proper AST traversal

2. **Symbol Resolution**:
   - Current: Single-file only
   - Production: Cross-file symbol table, type inference, scope resolution

3. **Type Information**:
   - Current: Basic metadata extraction
   - Production: Full type checker integration per language

## Next Steps

1. **Replace regex fallbacks with real Tree-Sitter parsers**
2. **Implement cross-file symbol resolution**
3. **Add type inference for each language**
4. **Expand multi-language providers** (Observer, Strategy, Facade, Proxy, Adapter)
5. **Create language-specific provider templates** for plugin authors
6. **Performance optimization** via caching and incremental analysis

## Example: Full Tree-Sitter Integration

```typescript
import Parser from 'web-tree-sitter';
import Java from 'web-tree-sitter-java';

export class JavaLanguageAdapter implements LanguageAdapter {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Java);
  }

  parse(filePath: string, sourceCode: string): ParseResult {
    const tree = this.parser.parse(sourceCode);
    return this.convertToCommonAST(tree.rootNode, sourceCode);
  }

  private convertToCommonAST(node: Parser.SyntaxNode, source: string): CommonASTNode {
    // Recursively convert Tree-Sitter nodes to CommonAST
    // Handle Java-specific node types (class_declaration, method_declaration, etc.)
    // Extract metadata and build symbol table
  }
}
```

## Benefits

✅ **Single Pattern Implementation**: Write once, run on all languages
✅ **Extensible**: Add new languages without modifying pattern logic
✅ **Type-Safe**: CommonAST interface prevents language-specific bugs
✅ **Scalable**: Adapters can be swapped (regex → Tree-Sitter → Language Server)
✅ **Backward Compatible**: Coexists with language-specific TypeScript providers

## References

- [Tree-Sitter Documentation](https://tree-sitter.github.io)
- [Available Languages](https://tree-sitter.github.io/tree-sitter/creating-parsers#list-of-languages)
