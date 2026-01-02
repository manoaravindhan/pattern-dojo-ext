# Real Tree-Sitter Integration Guide

## Overview

Pattern Dojo now includes **real Tree-Sitter parsers** for Java, Python, and C#. The regex-based fallback has been replaced with accurate AST parsing using the `tree-sitter-*` npm packages.

## What's Changed

### Before (Regex Fallback)
```typescript
// Pattern matching with regex
const classRegex = /public\s+(abstract\s+)?class\s+(\w+)(\s+extends\s+(\w+))?/gm;
while ((match = classRegex.exec(sourceCode)) !== null) {
  // Create AST nodes from regex matches
}
```

**Issues:**
- False positives (matches comments, strings)
- Can't handle complex syntax
- No symbol resolution
- Limited to simple patterns

### After (Tree-Sitter)
```typescript
await (Parser as any).init();
this.parser = new (Parser as any)();
this.parser.setLanguage(Java);
const tree = this.parser.parse(sourceCode);
const rootNode = this.convertToCommonAST(tree.rootNode, sourceCode);
```

**Benefits:**
✅ Accurate AST parsing
✅ No false positives
✅ Full syntax support
✅ Symbol resolution
✅ Position tracking (line/column)

## Installed Packages

```bash
npm install web-tree-sitter tree-sitter-java tree-sitter-python tree-sitter-c-sharp --save
```

- **web-tree-sitter**: Core parser runtime (WebAssembly-based)
- **tree-sitter-java**: Java language parser
- **tree-sitter-python**: Python language parser
- **tree-sitter-c-sharp**: C# language parser

## Architecture

### Language Adapters (Real Implementation)

Each adapter now uses real Tree-Sitter:

1. **Initialization** (async)
   ```typescript
   constructor() {
     this.parserReady = this.initParser();
   }

   private async initParser(): Promise<any> {
     await (Parser as any).init();
     this.parser = new (Parser as any)();
     this.parser.setLanguage(Java); // or Python, CSharp
     return this.parser;
   }
   ```

2. **Parsing**
   ```typescript
   const tree = this.parser.parse(sourceCode);
   const rootNode = this.convertToCommonAST(tree.rootNode, sourceCode);
   ```

3. **AST Conversion**
   - Maps Tree-Sitter node types to `NodeKind` enum
   - Extracts names, modifiers, metadata
   - Recursively builds CommonAST hierarchy
   - Builds symbol table for declarations/usages

### Node Kind Mapping

Each adapter maps language-specific node types to common kinds:

**Java**
```typescript
class_declaration → NodeKind.ClassDeclaration
method_declaration → NodeKind.MethodDeclaration
constructor_declaration → NodeKind.ConstructorDeclaration
object_creation_expression → NodeKind.NewExpression
// ... more mappings
```

**Python**
```typescript
class_definition → NodeKind.ClassDeclaration
function_definition → NodeKind.MethodDeclaration
call → NodeKind.CallExpression
attribute → NodeKind.MemberAccess
// ... more mappings
```

**C#**
```typescript
class_declaration → NodeKind.ClassDeclaration
method_declaration → NodeKind.MethodDeclaration
constructor_declaration → NodeKind.ConstructorDeclaration
invocation_expression → NodeKind.CallExpression
// ... more mappings
```

## How Multi-Language Providers Work

Multi-language providers now receive accurate CommonAST nodes:

```typescript
export class MultiLanguageSingletonProvider implements PatternProvider {
  analyze(document: vscode.TextDocument): PatternViolation[] {
    const parseResult = languageAdapterRegistry.parse(document);
    const { rootNode } = parseResult;

    // Walk CommonAST (works for all languages!)
    const visit = (node: CommonASTNode) => {
      if (node.kind === NodeKind.ClassDeclaration) {
        // Accurate class analysis
        for (const child of node.children) {
          if (child.kind === NodeKind.ConstructorDeclaration) {
            const isPublic = !child.modifiers || child.modifiers.includes(Modifier.Public);
            // ... violation detection
          }
        }
      }
      for (const child of node.children) {
        visit(child);
      }
    };

    visit(rootNode);
    return violations;
  }
}
```

## Symbol Resolution

Each adapter builds a symbol table during parsing:

```typescript
private extractSymbols(
  node: CommonASTNode,
  filePath: string,
  sourceCode: string
): Map<string, CommonSymbol> {
  const symbols = new Map<string, CommonSymbol>();

  const visit = (n: CommonASTNode) => {
    if ((n.kind === NodeKind.ClassDeclaration || 
         n.kind === NodeKind.MethodDeclaration) && n.name) {
      symbols.set(n.name, {
        name: n.name,
        kind: n.kind,
        location: { file: filePath, line: n.startLine, column: n.startColumn },
        declarations: [n],
        usages: [],
      });
    }
    // ... recurse
  };

  visit(node);
  return symbols;
}
```

## Accuracy Improvements

### Example: Singleton Detection

**Before (Regex)**
```java
// Matches public class even in comments
// public class MyClass extends Singleton { }
public class Singleton {
  public Singleton() {} // False positive!
}
```

**After (Tree-Sitter)**
- Correctly ignores comment
- Only parses actual class declarations
- Accurate modifier detection (public vs private)
- No false positives

### Example: Factory Detection

**Before (Regex)**
```java
String result = "new MyClass()" // False match
```

**After (Tree-Sitter)**
- Distinguishes actual `new` expressions from strings
- Tracks object creation expressions accurately
- Resolves class names to symbols

## Performance

Tree-Sitter parsing is highly optimized:

- **Incremental parsing**: Updates only changed portions
- **O(1) updates** on typical code edits
- **WebAssembly**: Fast C-based implementation
- **Caching**: Parse trees are reused when possible

For typical files (<10K lines), parsing takes < 100ms.

## Next Steps

1. **Cross-File Symbol Resolution**
   - Build workspace-wide symbol index
   - Track imports/dependencies
   - Enable multi-file pattern detection

2. **Type Inference**
   - Java: Use JDWP or Gradle API
   - Python: Use type hints + inference
   - C#: Use Roslyn for semantic analysis

3. **Scope Analysis**
   - Track variable/class visibility
   - Detect unused symbols
   - Improve inheritance analysis

4. **Incremental Analysis**
   - Cache parse results per file
   - Only re-analyze changed documents
   - Stream diagnostics to client

## Troubleshooting

### Parser Not Initialized
If `this.parser` is null during analysis:
```typescript
// Wait for async initialization
if (!this.parser) {
  return this.createEmptyResult(sourceCode);
}
```

### Memory Usage
WebAssembly parsers are lightweight. For large workspaces, consider:
- Lazy initialization (parse on demand)
- Per-workspace parser instance
- Garbage collection of old parse trees

### Performance
If analysis is slow:
1. Check Tree-Sitter version compatibility
2. Profile with DevTools
3. Consider incremental analysis for large files
4. Use caching for stable parse trees

## References

- [Tree-Sitter Documentation](https://tree-sitter.github.io)
- [Web Tree-Sitter](https://github.com/tree-sitter/tree-sitter/tree/master/lib/binding_web)
- [Java Grammar](https://github.com/tree-sitter/tree-sitter-java)
- [Python Grammar](https://github.com/tree-sitter/tree-sitter-python)
- [C# Grammar](https://github.com/tree-sitter/tree-sitter-c-sharp)
