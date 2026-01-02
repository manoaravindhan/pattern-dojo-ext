import * as vscode from 'vscode';
import * as ts from 'typescript';
import { PatternProvider, PatternViolation } from '../../types';

/**
 * AST-based Facade pattern detector
 * - Detects classes with many public methods
 */
export class FacadePatternProvider implements PatternProvider {
  readonly name = 'Facade Pattern Detector';
  readonly description = 'Detects issues with Facade pattern implementation (AST-based)';
  readonly patternName = 'facade';

  analyze(document: vscode.TextDocument): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const text = document.getText();
    const options: ts.CompilerOptions = { allowJs: true, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS };
    const program = ts.createProgram([document.fileName], options);
    const sourceFile = program.getSourceFile(document.fileName) || ts.createSourceFile(document.fileName, text, ts.ScriptTarget.Latest, true);
    const checker = program.getTypeChecker();

    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        const className = node.name.text;
        let publicMethods = 0;
        for (const member of node.members) {
          if (ts.isMethodDeclaration(member)) {
            const isPrivate = (member.modifiers || []).some(m => m.kind === ts.SyntaxKind.PrivateKeyword);
            if (!isPrivate) publicMethods++;
          }
        }
        if (publicMethods > 7) {
          const start = node.getStart(sourceFile);
          const end = node.getEnd();
          const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
          violations.push({
            range,
            message: `Class '${className}' has ${publicMethods} public methods. Consider using Facade pattern to simplify the interface.`,
            severity: vscode.DiagnosticSeverity.Information,
            code: 'facade-complex-interface',
          });
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return violations;
  }
}
