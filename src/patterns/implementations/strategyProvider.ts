import * as vscode from 'vscode';
import * as ts from 'typescript';
import { PatternProvider, PatternViolation } from '../../types';

/**
 * AST-based Strategy pattern detector
 * - Detects long switch statements and long if-else chains
 */
export class StrategyPatternProvider implements PatternProvider {
  readonly name = 'Strategy Pattern Detector';
  readonly description = 'Detects issues with Strategy pattern implementation (AST-based)';
  readonly patternName = 'strategy';

  analyze(document: vscode.TextDocument): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const text = document.getText();
    const options: ts.CompilerOptions = { allowJs: true, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS };
    const program = ts.createProgram([document.fileName], options);
    const sourceFile = program.getSourceFile(document.fileName) || ts.createSourceFile(document.fileName, text, ts.ScriptTarget.Latest, true);

    const visit = (node: ts.Node) => {
      if (ts.isSwitchStatement(node)) {
        const caseCount = node.caseBlock.clauses.length;
        if (caseCount > 3) {
          const start = node.getStart(sourceFile);
          const end = node.getEnd();
          const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
          violations.push({
            range,
            message: `Long switch statement with ${caseCount} cases detected. Consider using Strategy pattern.`,
            severity: vscode.DiagnosticSeverity.Information,
            code: 'strategy-long-switch',
          });
        }
      }

      if (ts.isIfStatement(node)) {
        // Count chained else-if depth
        let depth = 0;
        let current: ts.IfStatement | undefined = node;
        while (current) {
          if (current.elseStatement && ts.isIfStatement(current.elseStatement)) {
            depth++;
            current = current.elseStatement;
          } else {
            break;
          }
        }
        if (depth >= 2) {
          const start = node.getStart(sourceFile);
          const end = node.getEnd();
          const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
          violations.push({
            range,
            message: `Long if-else chain detected (depth ${depth}). Consider Strategy pattern.`,
            severity: vscode.DiagnosticSeverity.Information,
            code: 'strategy-long-ifelse',
          });
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return violations;
  }
}
