/**
 * Multi-language pattern providers using the common AST interface
 * These providers work across Java, Python, C#, and other supported languages
 */

import * as vscode from 'vscode';
import { PatternProvider, PatternViolation } from '../../types';
import { languageAdapterRegistry } from '../../languages/languageAdapterRegistry';
import { NodeKind, Modifier, CommonASTNode } from '../../languages/commonAst';

/**
 * Multi-language Singleton pattern detector
 */
export class MultiLanguageSingletonProvider implements PatternProvider {
  readonly name = 'Multi-Language Singleton Detector';
  readonly description = 'Detects Singleton pattern violations across Java, Python, C#, etc.';
  readonly patternName = 'multilang-singleton';

  async analyze(document: vscode.TextDocument): Promise<PatternViolation[]> {
    const violations: PatternViolation[] = [];
    const parseResult = await languageAdapterRegistry.parse(document);

    if (!parseResult) return violations;

    const { rootNode } = parseResult;

    // Find classes with public constructors (Singleton violation)
    const visit = (node: CommonASTNode) => {
      if (node.kind === NodeKind.ClassDeclaration) {
        const className = node.name || 'Unknown';
        let hasPublicConstructor = false;
        let hasPrivateConstructor = false;
        let hasStaticInstance = false;

        // Check for static instance of the same class
        // Heuristic: static field with same type as class OR common singleton names
        for (const child of node.children) {
            if (child.kind === NodeKind.FieldDeclaration || child.kind === NodeKind.PropertyDeclaration || child.kind === NodeKind.VariableDeclaration) {
                 const isStatic = child.modifiers && child.modifiers.includes(Modifier.Static);
                 
                 // Heuristic 1: Text contains class name (e.g. "private static Database instance")
                 // Heuristic 2: Common singleton instance names (e.g. "instance", "_instance", "shared")
                 const isSingletonName = child.name && ['instance', '_instance', 'shared', 'default'].includes(child.name.toLowerCase());
                 
                 if (isStatic && (child.text.includes(className) || isSingletonName)) {
                     hasStaticInstance = true;
                 }
            }
        }

        // Only check for singleton violation if it looks like a singleton candidate
        if (hasStaticInstance) {
            for (const child of node.children) {
              if (child.kind === NodeKind.ConstructorDeclaration) {
                const isPublic = !child.modifiers || child.modifiers.includes(Modifier.Public);
                if (isPublic) hasPublicConstructor = true;
                else hasPrivateConstructor = true;
              }
            }

            if (hasPublicConstructor && !hasPrivateConstructor) {
              const range = new vscode.Range(
                document.positionAt(node.startPosition),
                document.positionAt(node.endPosition)
              );
              violations.push({
                range,
                message: `Class '${className}' has public constructor. Singleton pattern requires private constructor.`,
                severity: vscode.DiagnosticSeverity.Warning,
                code: 'singleton-public-constructor',
              });
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

/**
 * Multi-language Factory pattern detector
 */
export class MultiLanguageFactoryProvider implements PatternProvider {
  readonly name = 'Multi-Language Factory Detector';
  readonly description = 'Detects Factory pattern opportunities across multiple languages';
  readonly patternName = 'multilang-factory';

  async analyze(document: vscode.TextDocument): Promise<PatternViolation[]> {
    const violations: PatternViolation[] = [];
    const parseResult = await languageAdapterRegistry.parse(document);

    if (!parseResult) return violations;

    const { rootNode } = parseResult;
    const newExpressions = new Map<string, number>();

    // Count new expressions for each class
    const visit = (node: CommonASTNode) => {
      if (node.kind === NodeKind.NewExpression && node.name) {
        newExpressions.set(node.name, (newExpressions.get(node.name) || 0) + 1);
      }

      for (const child of node.children) {
        visit(child);
      }
    };

    visit(rootNode);

    // Flag classes with many instantiation points
    for (const [className, count] of newExpressions.entries()) {
      if (count > 2) {
        const range = new vscode.Range(
          document.positionAt(0),
          document.positionAt(10)
        );
        violations.push({
          range,
          message: `Class '${className}' is instantiated ${count} times. Consider implementing Factory pattern.`,
          severity: vscode.DiagnosticSeverity.Information,
          code: 'factory-multiple-instantiation',
        });
      }
    }

    return violations;
  }
}

/**
 * Multi-language Decorator pattern detector
 */
export class MultiLanguageDecoratorProvider implements PatternProvider {
  readonly name = 'Multi-Language Decorator Detector';
  readonly description = 'Detects deep inheritance hierarchies suggesting Decorator pattern';
  readonly patternName = 'multilang-decorator';

  async analyze(document: vscode.TextDocument): Promise<PatternViolation[]> {
    const violations: PatternViolation[] = [];
    const parseResult = await languageAdapterRegistry.parse(document);

    if (!parseResult) return violations;

    const { rootNode } = parseResult;
    const inheritanceMap = new Map<string, string>();

    // Build inheritance tree
    const visit = (node: CommonASTNode) => {
      // In Java/C#, extends is often part of metadata or children structure
      // Here assuming metadata has it (JavaAdapter populates it?)
      // We need to check if JavaAdapter actually populates metadata.extendsClass
      if (node.kind === NodeKind.ClassDeclaration && node.name) {
          if (node.metadata?.extendsClass) {
             inheritanceMap.set(node.name, node.metadata.extendsClass);
          }
      }

      for (const child of node.children) {
        visit(child);
      }
    };

    visit(rootNode);

    // Calculate inheritance depth
    const getDepth = (className: string, visited = new Set<string>()): number => {
      if (visited.has(className) || !inheritanceMap.has(className)) return 0;
      visited.add(className);
      const parent = inheritanceMap.get(className)!;
      return 1 + getDepth(parent, visited);
    };

    // Flag deep hierarchies
    for (const [className, parent] of inheritanceMap) {
      if (getDepth(className) > 2) {
         // Find the class node again to get range
         // Optimization: Store range in map? For now simple.
         // Cannot easily find node again without re-walking or map.
         // Let's just put it at top of file for now as in original code.
         const range = new vscode.Range(
          document.positionAt(0),
          document.positionAt(10)
        );
        violations.push({
          range,
          message: `Class '${className}' is part of a deep inheritance hierarchy. Consider Decorator pattern.`,
          severity: vscode.DiagnosticSeverity.Information,
          code: 'decorator-deep-hierarchy',
        });
      }
    }

    return violations;
  }
}


/**
 * Multi-language Strategy pattern detector
 */
export class MultiLanguageStrategyProvider implements PatternProvider {
  readonly name = 'Multi-Language Strategy Detector';
  readonly description = 'Detects long switch statements and if-else chains suggesting Strategy pattern';
  readonly patternName = 'multilang-strategy';

  async analyze(document: vscode.TextDocument): Promise<PatternViolation[]> {
    const violations: PatternViolation[] = [];
    const parseResult = await languageAdapterRegistry.parse(document);

    if (!parseResult) return violations;

    const { rootNode } = parseResult;

    const visit = (node: CommonASTNode) => {
      // Check for long switch statements
      if (node.kind === NodeKind.SwitchStatement) {
          // Heuristic: Count 'case' keywords in the text
          // This avoids dependencies on specific AST structure for switch cases/blocks
          const caseCount = (node.text.match(/\bcase\b/g) || []).length;
          
          if (caseCount > 5) {
             const range = new vscode.Range(
                document.positionAt(node.startPosition),
                document.positionAt(node.endPosition)
              );
              violations.push({
                range,
                message: `Long switch statement detected (${caseCount} cases). Consider Strategy pattern.`,
                severity: vscode.DiagnosticSeverity.Information,
                code: 'strategy-long-switch',
              });
          }
      }

      // Check for if-else chains
      if (node.kind === NodeKind.IfStatement) {
          let chainLength = 0;
          
          // Check for direct children that are IfStatement (Flattened structure mainly for Python 'elif')
          const directIfChildren = node.children.filter(c => c.kind === NodeKind.IfStatement).length;
          
          if (directIfChildren > 0) {
             chainLength = 1 + directIfChildren;
          } else {
              // Deep nesting check (standard else-if for Java/JS/C#)
              let current: CommonASTNode | undefined = node;
              while (current && current.kind === NodeKind.IfStatement) {
                  chainLength++;
                  // Find else branch. 
                  // This depends on how Adapter constructs IfStatement children.
                  // Assuming last child is else part.
                  const lastChild: CommonASTNode | undefined = current.children.length > 0 ? current.children[current.children.length - 1] : undefined;
                  if (lastChild && lastChild.kind === NodeKind.IfStatement) {
                      current = lastChild;
                  } else {
                      current = undefined;
                  }
              }
          }

          if (chainLength > 3) {
             const range = new vscode.Range(
                document.positionAt(node.startPosition),
                document.positionAt(node.endPosition)
              );
              violations.push({
                range,
                message: `Long if-else chain detected (${chainLength} levels). Consider Strategy pattern.`,
                severity: vscode.DiagnosticSeverity.Information,
                code: 'strategy-long-if-else',
              });
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

/**
 * Multi-language Observer pattern detector
 */
export class MultiLanguageObserverProvider implements PatternProvider {
  readonly name = 'Multi-Language Observer Detector';
  readonly description = 'Detects potential Observer pattern logic (add/remove listeners)';
  readonly patternName = 'multilang-observer';

  async analyze(document: vscode.TextDocument): Promise<PatternViolation[]> {
    const violations: PatternViolation[] = [];
    const parseResult = await languageAdapterRegistry.parse(document);

    if (!parseResult) return violations;
    const { rootNode } = parseResult;

    let addCount = 0;
    let removeCount = 0;
    let range: vscode.Range | undefined;

    const visit = (node: CommonASTNode) => {
      if (node.kind === NodeKind.CallExpression && node.name) {
          const name = node.name.toLowerCase();
          if (name.includes('addlistener') || name.includes('subscribe') || name.includes('register')) {
              addCount++;
              if (!range) {
                  range = new vscode.Range(
                    document.positionAt(node.startPosition),
                    document.positionAt(node.endPosition)
                  );
              }
          }
          if (name.includes('removelistener') || name.includes('unsubscribe') || name.includes('unregister')) {
              removeCount++;
          }
      }
      for (const child of node.children) visit(child);
    };

    visit(rootNode);

    if (addCount > 0 && removeCount === 0 && range) {
        violations.push({
            range: range,
            message: `Found ${addCount} listener registrations but no unregistrations. Ensure Observers are cleaned up.`,
            severity: vscode.DiagnosticSeverity.Warning,
            code: 'observer-no-cleanup',
        });
    }

    return violations;
  }
}

/**
 * Multi-language Adapter pattern detector
 */
export class MultiLanguageAdapterProvider implements PatternProvider {
  readonly name = 'Multi-Language Adapter Detector';
  readonly description = 'Detects frequent type casting or try-catch blocks';
  readonly patternName = 'multilang-adapter';

  async analyze(document: vscode.TextDocument): Promise<PatternViolation[]> {
    const violations: PatternViolation[] = [];
    const parseResult = await languageAdapterRegistry.parse(document);

    if (!parseResult) return violations;
    const { rootNode } = parseResult;

    let assertionCount = 0;
    let tryCount = 0;
    let reportNode: CommonASTNode | undefined;

    const visit = (node: CommonASTNode) => {
      if (node.kind === NodeKind.TypeAssertion) {
          assertionCount++;
          if (!reportNode) reportNode = node;
      }
      if (node.kind === NodeKind.TryStatement) {
          tryCount++;
          if (!reportNode) reportNode = node;
      }
      for (const child of node.children) visit(child);
    };

    visit(rootNode);

    if (assertionCount > 3 || tryCount > 3) {
        if (reportNode) {
            const range = new vscode.Range(
                document.positionAt(reportNode.startPosition),
                document.positionAt(reportNode.endPosition)
            );
            violations.push({
                range,
                message: `Modules with high use of type casting (${assertionCount}) or error handling (${tryCount}) may benefit from the Adapter pattern.`,
                severity: vscode.DiagnosticSeverity.Information,
                code: 'adapter-high-friction',
            });
        }
    }

    return violations;
  }
}

/**
 * Multi-language Facade pattern detector
 */
export class MultiLanguageFacadeProvider implements PatternProvider {
  readonly name = 'Multi-Language Facade Detector';
  readonly description = 'Detects classes with complex public interfaces';
  readonly patternName = 'multilang-facade';

  async analyze(document: vscode.TextDocument): Promise<PatternViolation[]> {
    const violations: PatternViolation[] = [];
    const parseResult = await languageAdapterRegistry.parse(document);

    if (!parseResult) return violations;
    const { rootNode } = parseResult;

    const visit = (node: CommonASTNode) => {
      if (node.kind === NodeKind.ClassDeclaration) {
          let publicMethods = 0;
          for (const child of node.children) {
              if (child.kind === NodeKind.MethodDeclaration) {
                  const isPublic = !child.modifiers || child.modifiers.includes(Modifier.Public);
                   if (isPublic) publicMethods++;
              }
          }

          if (publicMethods > 7) {
            const range = new vscode.Range(
                document.positionAt(node.startPosition),
                document.positionAt(node.endPosition)
            );
            violations.push({
                range,
                message: `Class '${node.name}' has ${publicMethods} public methods. Consider a Facade to simplify.`,
                severity: vscode.DiagnosticSeverity.Information,
                code: 'facade-complex-interface',
            });
          }
      }
      for (const child of node.children) visit(child);
    };

    visit(rootNode);
    return violations;
  }
}

/**
 * Multi-language Proxy pattern detector
 */
export class MultiLanguageProxyProvider implements PatternProvider {
  readonly name = 'Multi-Language Proxy Detector';
  readonly description = 'Detects repeated expensive operations';
  readonly patternName = 'multilang-proxy';

  async analyze(document: vscode.TextDocument): Promise<PatternViolation[]> {
    const violations: PatternViolation[] = [];
    const parseResult = await languageAdapterRegistry.parse(document);

    if (!parseResult) return violations;
    const { rootNode } = parseResult;

    const expensiveOps = ['fetch', 'query', 'load', 'execute', 'request', 'connect'];
    const counts = new Map<string, number>();
    const nodes = new Map<string, CommonASTNode>();

    const visit = (node: CommonASTNode) => {
      if (node.kind === NodeKind.CallExpression && node.name) {
          const name = node.name.toLowerCase();
          const match = expensiveOps.find(op => name.includes(op));
          if (match) {
              counts.set(match, (counts.get(match) || 0) + 1);
              if (!nodes.has(match)) nodes.set(match, node);
          }
      }
      for (const child of node.children) visit(child);
    };

    visit(rootNode);

    for (const [op, count] of counts) {
        if (count > 2) {
            const n = nodes.get(op)!;
            const range = new vscode.Range(
                document.positionAt(n.startPosition),
                document.positionAt(n.endPosition)
            );
            violations.push({
                range,
                message: `Repeated expensive operation '${op}' detected (${count} times). Consider a Proxy for caching/lazy loading.`,
                severity: vscode.DiagnosticSeverity.Information,
                code: 'proxy-expensive-loops',
            });
        }
    }

    return violations;
  }
}
