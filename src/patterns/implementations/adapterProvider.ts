import * as vscode from 'vscode';
import * as ts from 'typescript';
import { PatternProvider, PatternViolation } from '../../types';

/**
 * AST-based Adapter pattern detector
 * - Detects type assertions and frequent try/catch indicating interface mismatches
 */
export class AdapterPatternProvider implements PatternProvider {
  readonly name = 'Adapter Pattern Detector';
  readonly description = 'Detects issues with Adapter pattern implementation (AST-based)';
  readonly patternName = 'adapter';

  analyze(document: vscode.TextDocument): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const text = document.getText();
    const options: ts.CompilerOptions = { allowJs: true, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS };
    const program = ts.createProgram([document.fileName], options);
    const sourceFile = program.getSourceFile(document.fileName) || ts.createSourceFile(document.fileName, text, ts.ScriptTarget.Latest, true);
    const checker = program.getTypeChecker();

    let assertionCount = 0;
    let tryCatchCount = 0;
    const assertionNodes: ts.Node[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
        assertionCount++;
        assertionNodes.push(node);
      }
      if (ts.isTryStatement(node)) {
        tryCatchCount++;
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    if (assertionCount > 3 && assertionNodes.length > 0) {
      const node = assertionNodes[0];
      const start = node.getStart(sourceFile);
      const end = node.getEnd();
      const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
      violations.push({
        range,
        message: 'Multiple type assertions detected. Consider using an Adapter to bridge incompatible interfaces.',
        severity: vscode.DiagnosticSeverity.Information,
        code: 'adapter-type-assertion',
      });
    }

    if (tryCatchCount > 2) {
      const idx = text.indexOf('try {');
      if (idx >= 0) {
        const range = new vscode.Range(document.positionAt(idx), document.positionAt(Math.min(text.length, idx + 5)));
        violations.push({
          range,
          message: 'Multiple try-catch blocks detected. Consider using an Adapter to handle interface incompatibilities gracefully.',
          severity: vscode.DiagnosticSeverity.Information,
          code: 'adapter-try-catch',
        });
      }
    }

    return violations;
  }
}
