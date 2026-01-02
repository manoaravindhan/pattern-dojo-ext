import * as vscode from 'vscode';
import * as ts from 'typescript';
import { PatternProvider, PatternViolation } from '../../types';

/**
 * AST-based Factory pattern detector
 * - Detects classes instantiated many times across a file
 */
export class FactoryPatternProvider implements PatternProvider {
  readonly name = 'Factory Pattern Detector';
  readonly description = 'Detects issues with Factory pattern implementation (AST-based)';
  readonly patternName = 'factory';

  analyze(document: vscode.TextDocument): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const text = document.getText();

    const options: ts.CompilerOptions = { allowJs: true, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.Preserve };
    const program = ts.createProgram([document.fileName], options);
    const sourceFile = program.getSourceFile(document.fileName) || ts.createSourceFile(document.fileName, text, ts.ScriptTarget.Latest, true);
    const checker = program.getTypeChecker();

    const instCount = new Map<string, number>();

    const visit = (node: ts.Node) => {
      if (ts.isNewExpression(node)) {
        const expr = node.expression;
        let name: string | undefined;
        if (ts.isIdentifier(expr) || ts.isPropertyAccessExpression(expr)) {
          const symbol = checker.getSymbolAtLocation(expr);
          if (symbol) {
            const aliased = (symbol.flags & ts.SymbolFlags.Alias) ? checker.getAliasedSymbol(symbol) : symbol;
            name = aliased.getName();
          } else if (ts.isIdentifier(expr)) {
            name = expr.text;
          }
        }
        if (name) instCount.set(name, (instCount.get(name) || 0) + 1);
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Report classes instantiated many times
    for (const [name, count] of instCount.entries()) {
      if (count > 2) {
        const regex = new RegExp(`new\\s+${name}\\s*\\(`, 'g');
        const match = regex.exec(text);
        if (match && match.index !== undefined) {
          const start = match.index;
          const end = start + match[0].length;
          const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
          violations.push({
            range,
            message: `'${name}' is instantiated ${count} times in this file. Consider using a Factory to centralize creation.`,
            severity: vscode.DiagnosticSeverity.Information,
            code: 'factory-multiple-instantiation',
          });
        }
      }
    }

    return violations.slice(0, 5);
  }
}
