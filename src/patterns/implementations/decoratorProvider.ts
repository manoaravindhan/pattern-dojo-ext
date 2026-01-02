import * as vscode from 'vscode';
import * as ts from 'typescript';
import { PatternProvider, PatternViolation } from '../../types';

/**
 * AST-based Decorator pattern detector
 * - Detects deep inheritance hierarchies
 */
export class DecoratorPatternProvider implements PatternProvider {
  readonly name = 'Decorator Pattern Detector';
  readonly description = 'Detects issues with Decorator pattern implementation (AST-based)';
  readonly patternName = 'decorator';

  analyze(document: vscode.TextDocument): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const text = document.getText();
    const options: ts.CompilerOptions = { allowJs: true, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS };
    const program = ts.createProgram([document.fileName], options);
    const sourceFile = program.getSourceFile(document.fileName) || ts.createSourceFile(document.fileName, text, ts.ScriptTarget.Latest, true);
    const checker = program.getTypeChecker();

    const parentMap = new Map<string, string>();

    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        const className = node.name.text;
        if (node.heritageClauses) {
          for (const hc of node.heritageClauses) {
            if (hc.token === ts.SyntaxKind.ExtendsKeyword) {
              const type = hc.types[0];
              if (type) {
                const expr = type.expression;
                const sym = checker.getSymbolAtLocation(expr);
                const parentName = sym ? (sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym).getName() : sym.getName()) : (ts.isIdentifier(expr) ? expr.getText(sourceFile) : undefined);
                if (parentName) parentMap.set(className, parentName);
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    const depthCache = new Map<string, number>();

    const getDepth = (name: string): number => {
      if (!parentMap.has(name)) return 0;
      if (depthCache.has(name)) return depthCache.get(name)!;
      let depth = 1;
      let current = parentMap.get(name)!;
      while (parentMap.has(current)) {
        depth++;
        current = parentMap.get(current)!;
      }
      depthCache.set(name, depth);
      return depth;
    };

    for (const name of parentMap.keys()) {
      const depth = getDepth(name);
      if (depth > 2) {
        const regex = new RegExp(`class\\s+${name}\\s+extends`, 'g');
        const match = regex.exec(text);
        if (match && match.index !== undefined) {
          const range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length));
          violations.push({
            range,
            message: `Class '${name}' is part of a deep inheritance hierarchy (depth: ${depth}). Consider using Decorator pattern.`,
            severity: vscode.DiagnosticSeverity.Information,
            code: 'decorator-deep-hierarchy',
          });
        }
      }
    }

    return violations;
  }
}
