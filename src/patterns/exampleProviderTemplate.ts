import * as vscode from 'vscode';
import { PatternProvider, PatternViolation } from '../types';

export class ExamplePatternProvider implements PatternProvider {
  readonly name = 'Example Provider';
  readonly description = 'Template provider demonstrating plugin API';
  readonly patternName = 'example';

  analyze(document: vscode.TextDocument): PatternViolation[] {
    const violations: PatternViolation[] = [];
    // Example: flag TODO comments as informational pattern violations
    const text = document.getText();
    let idx = text.indexOf('TODO');
    while (idx >= 0) {
      const range = new vscode.Range(document.positionAt(idx), document.positionAt(idx + 4));
      violations.push({ range, message: 'Found TODO - consider addressing', severity: vscode.DiagnosticSeverity.Information, code: 'example-todo' });
      idx = text.indexOf('TODO', idx + 4);
    }
    return violations;
  }
}
