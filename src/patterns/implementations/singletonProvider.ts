import * as vscode from 'vscode';
import * as ts from 'typescript';
import { PatternProvider, PatternViolation } from '../../types';

/**
 * AST-based Singleton pattern detector for TS/JS
 * - Detects public constructors on classes with static instance
 * - Detects multiple static instances for the same class
 */
export class SingletonPatternProvider implements PatternProvider {
  readonly name = 'Singleton Pattern Detector';
  readonly description = 'Detects issues with Singleton pattern implementation (AST-based)';
  readonly patternName = 'singleton';

  analyze(document: vscode.TextDocument): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const text = document.getText();

    // Create a Program and TypeChecker for richer type information
    const options: ts.CompilerOptions = { allowJs: true, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.Preserve };
    const program = ts.createProgram([document.fileName], options);
    const sourceFile = program.getSourceFile(document.fileName) || ts.createSourceFile(document.fileName, text, ts.ScriptTarget.Latest, true);
    const checker = program.getTypeChecker();

    // Map to count static 'new' initializers per class
    const staticNewCount = new Map<string, number>();

    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        const className = node.name.text;
        const classSymbol = checker.getSymbolAtLocation(node.name);

        // Find constructor
        const ctor = node.members.find(m => ts.isConstructorDeclaration(m)) as ts.ConstructorDeclaration | undefined;
        // Find static properties initialized with `new ClassName(...)`
        let hasStaticInstance = false;

        for (const member of node.members) {
          if (ts.isPropertyDeclaration(member)) {
            const isStatic = (member.modifiers || []).some(mod => mod.kind === ts.SyntaxKind.StaticKeyword);
            if (isStatic && member.initializer && ts.isNewExpression(member.initializer)) {
              const initExpr = member.initializer.expression;
              const initSymbol = checker.getSymbolAtLocation(initExpr);
              const initName = initSymbol ? (initSymbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(initSymbol).getName() : initSymbol.getName()) : (ts.isIdentifier(initExpr) ? initExpr.text : undefined);
              const classSymName = classSymbol ? classSymbol.getName() : undefined;
              if (classSymName && initName === classSymName) {
                hasStaticInstance = true;
                staticNewCount.set(className, (staticNewCount.get(className) || 0) + 1);
              }
            }
          }
        }

        // If class has a static instance, check constructor visibility
        if (hasStaticInstance) {
          if (ctor) {
            const isPrivate = (ctor.modifiers || []).some(mod => mod.kind === ts.SyntaxKind.PrivateKeyword);
            if (!isPrivate) {
              const start = ctor.getStart(sourceFile);
              const end = ctor.getEnd();
              const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
              violations.push({
                range,
                message: `Singleton '${className}' has a non-private constructor. Consider making it private or protected.`,
                severity: vscode.DiagnosticSeverity.Warning,
                code: 'singleton-non-private-constructor',
              });
            }
          } else {
            // No explicit constructor - public by default; report on class declaration
            const start = node.getStart(sourceFile);
            const end = node.name.getEnd();
            const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
            violations.push({
              range,
              message: `Singleton '${className}' may have implicit public constructor. Consider adding a private constructor.`,
              severity: vscode.DiagnosticSeverity.Warning,
              code: 'singleton-implicit-public-constructor',
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Report classes with multiple static instances
    for (const [className, count] of staticNewCount.entries()) {
      if (count > 1) {
        // Find first occurrence to report location
        const regex = new RegExp(`static\\s+\\w+\\s*=\\s*new\\s+${className}\\s*\\(`, 'g');
        const match = regex.exec(text);
        if (match && match.index !== undefined) {
          const start = match.index;
          const end = start + match[0].length;
          const range = new vscode.Range(document.positionAt(start), document.positionAt(end));
          violations.push({
            range,
            message: `Singleton '${className}' has multiple static instances (${count}). This violates the singleton pattern.`,
            severity: vscode.DiagnosticSeverity.Error,
            code: 'singleton-multiple-instances',
          });
        }
      }
    }

    return violations;
  }
}
