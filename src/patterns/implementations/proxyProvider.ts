import * as vscode from 'vscode';
import * as ts from 'typescript';
import { PatternProvider, PatternViolation } from '../../types';

/**
 * AST-based Proxy pattern detector
 * - Detects repeated expensive operations (fetch, query, load, parse, compile, render)
 */
export class ProxyPatternProvider implements PatternProvider {
  readonly name = 'Proxy Pattern Detector';
  readonly description = 'Detects issues with Proxy pattern implementation (AST-based)';
  readonly patternName = 'proxy';

  analyze(document: vscode.TextDocument): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const text = document.getText();
    const options: ts.CompilerOptions = { allowJs: true, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS };
    const program = ts.createProgram([document.fileName], options);
    const sourceFile = program.getSourceFile(document.fileName) || ts.createSourceFile(document.fileName, text, ts.ScriptTarget.Latest, true);
    const checker = program.getTypeChecker();

    const expensiveOperations = new Set(['fetch', 'query', 'load', 'parse', 'compile', 'render']);
    const counts = new Map<string, number>();
    const callNodes = new Map<string, ts.CallExpression[]>();

    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const expr = node.expression;
        let name: string | undefined;
        if (ts.isIdentifier(expr)) {
          name = expr.text;
        } else if (ts.isPropertyAccessExpression(expr)) {
          name = expr.name.text;
        }
        if (name && expensiveOperations.has(name)) {
          counts.set(name, (counts.get(name) || 0) + 1);
          if (!callNodes.has(name)) callNodes.set(name, []);
          callNodes.get(name)!.push(node);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    for (const [op, count] of counts.entries()) {
      if (count > 2 && callNodes.has(op)) {
        const callNode = callNodes.get(op)![0];
        const start = callNode.getStart(sourceFile);
        const end = callNode.getEnd();
        const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
        violations.push({
          range,
          message: `Expensive operation '${op}' called ${count} times. Consider Proxy pattern (lazy loading/caching).`,
          severity: vscode.DiagnosticSeverity.Information,
          code: 'proxy-expensive-operation',
        });
      }
    }

    return violations;
  }
}
