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

  analyze(document: vscode.TextDocument): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const parseResult = languageAdapterRegistry.parse(document);

    if (!parseResult) return violations;

    const { rootNode, symbols } = parseResult;

    // Find classes with public constructors (Singleton violation)
    const visit = (node: CommonASTNode) => {
      if (node.kind === NodeKind.ClassDeclaration) {
        const className = node.name || 'Unknown';
        let hasPublicConstructor = false;
        let hasPrivateConstructor = false;

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

  analyze(document: vscode.TextDocument): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const parseResult = languageAdapterRegistry.parse(document);

    if (!parseResult) return violations;

    const { rootNode, symbols } = parseResult;
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

  analyze(document: vscode.TextDocument): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const parseResult = languageAdapterRegistry.parse(document);

    if (!parseResult) return violations;

    const { rootNode, symbols } = parseResult;
    const inheritanceMap = new Map<string, string>();

    // Build inheritance tree
    const visit = (node: CommonASTNode) => {
      if (node.kind === NodeKind.ClassDeclaration && node.name && node.metadata?.extendsClass) {
        inheritanceMap.set(node.name, node.metadata.extendsClass);
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
    for (const [className, depth] of inheritanceMap) {
      const calculatedDepth = getDepth(className);
      if (calculatedDepth > 2) {
        const range = new vscode.Range(
          document.positionAt(0),
          document.positionAt(10)
        );
        violations.push({
          range,
          message: `Class '${className}' is part of a deep inheritance hierarchy (depth: ${calculatedDepth}). Consider Decorator pattern.`,
          severity: vscode.DiagnosticSeverity.Information,
          code: 'decorator-deep-hierarchy',
        });
      }
    }

    return violations;
  }
}
