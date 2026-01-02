import * as vscode from 'vscode';
import * as ts from 'typescript';
import { PatternProvider, PatternViolation } from '../../types';

/**
 * AST-based Observer pattern detector
 * - Detects event listeners without corresponding removals
 * - Detects subscribe/unsubscribe mismatches
 */
export class ObserverPatternProvider implements PatternProvider {
  readonly name = 'Observer Pattern Detector';
  readonly description = 'Detects issues with Observer pattern implementation (AST-based)';
  readonly patternName = 'observer';

  analyze(document: vscode.TextDocument): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const text = document.getText();
    const options: ts.CompilerOptions = { allowJs: true, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS };
    const program = ts.createProgram([document.fileName], options);
    const sourceFile = program.getSourceFile(document.fileName) || ts.createSourceFile(document.fileName, text, ts.ScriptTarget.Latest, true);
    const checker = program.getTypeChecker();

    let addListenerCount = 0;
    let removeListenerCount = 0;
    let subscribeCount = 0;
    let unsubscribeCount = 0;

    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const expr = node.expression;
        let name: string | undefined;
        if (ts.isPropertyAccessExpression(expr)) name = expr.name.text;
        else if (ts.isIdentifier(expr)) {
          const sym = checker.getSymbolAtLocation(expr);
          name = sym ? (sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym).getName() : sym.getName()) : expr.text;
        }
        if (name === 'addEventListener') addListenerCount++;
        if (name === 'removeEventListener') removeListenerCount++;
        if (name === 'subscribe') subscribeCount++;
        if (name === 'unsubscribe') unsubscribeCount++;
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    if (addListenerCount > 0 && removeListenerCount === 0) {
      const idx = text.indexOf('addEventListener');
      if (idx >= 0) {
        const range = new vscode.Range(document.positionAt(idx), document.positionAt(idx + 'addEventListener'.length));
        violations.push({
          range,
          message: 'Event listener added but no corresponding removeEventListener found. This may cause memory leaks.',
          severity: vscode.DiagnosticSeverity.Warning,
          code: 'observer-unsubscribed',
        });
      }
    }

    if (subscribeCount > 0 && subscribeCount > unsubscribeCount) {
      const idx = text.indexOf('subscribe(');
      if (idx >= 0) {
        const range = new vscode.Range(document.positionAt(idx), document.positionAt(Math.min(text.length, idx + 10)));
        violations.push({
          range,
          message: 'Subscriptions without matching unsubscribe detected. Ensure all subscriptions are cleaned up.',
          severity: vscode.DiagnosticSeverity.Information,
          code: 'observer-subscription',
        });
      }
    }

    return violations;
  }
}
