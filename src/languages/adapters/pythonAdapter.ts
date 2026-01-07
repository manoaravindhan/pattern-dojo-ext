/**
 * Tree-Sitter based adapter for Python pattern detection
 * Uses real Tree-Sitter parser for accurate AST parsing
 */

import Parser from 'web-tree-sitter';
import { CommonASTNode, NodeKind, ParseResult, Modifier, CommonSymbol } from '../commonAst';
import { LanguageAdapter } from '../languageAdapter';
import * as path from 'path';

export class PythonLanguageAdapter implements LanguageAdapter {
  readonly extensions = ['.py'];
  readonly languageName = 'Python';
  private parser: any = null;
  private parserReady: Promise<any>;

  constructor() {
    this.parserReady = this.initParser();
  }

  private async initParser(): Promise<any> {
    if (this.parser) return this.parser;
    
    // Load main Tree-Sitter WASM
    const mainWasmPath = path.resolve(__dirname, '..', '..', '..', 'wasm', 'tree-sitter.wasm');
    await (Parser as any).init({
        locateFile: () => mainWasmPath
    });

    this.parser = new (Parser as any)();
    
    // Load Language WASM
    const langWasmPath = path.resolve(__dirname, '..', '..', '..', 'wasm', 'tree-sitter-python.wasm');
    const lang = await (Parser as any).Language.load(langWasmPath);
    
    this.parser.setLanguage(lang);
    return this.parser;
  }

  supports(filePath: string): boolean {
    return filePath.endsWith('.py');
  }

  async parse(filePath: string, sourceCode: string): Promise<ParseResult> {
    try {
      if (!this.parser) {
        await this.parserReady;
      }

      if (!this.parser) {
        return this.createEmptyResult(sourceCode);
      }

      const tree = this.parser.parse(sourceCode);
      const rootNode = this.convertToCommonAST(tree.rootNode, sourceCode);
      const symbols = this.extractSymbols(rootNode, filePath, sourceCode);

      return {
        rootNode,
        symbols,
        diagnostics: [],
      };
    } catch (error) {
      console.error(`Error parsing Python file ${filePath}:`, error);
      return this.createEmptyResult(sourceCode);
    }
  }

  private convertToCommonAST(
    tsNode: any,
    sourceCode: string
  ): CommonASTNode {
    let kind = this.mapNodeKind(tsNode.type);
    const name = this.extractName(tsNode, sourceCode);

    // Python-specific adjustments
    if (kind === NodeKind.MethodDeclaration && name === '__init__') {
      kind = NodeKind.ConstructorDeclaration;
    }

    // Map function calls to NewExpression if they look like class instantiation (PascalCase)
    if (kind === NodeKind.CallExpression && name && /^[A-Z][a-zA-Z0-9]*$/.test(name)) {
        kind = NodeKind.NewExpression;
    }

    // Map class-level assignments to FieldDeclaration for static/instance fields
    if (kind === NodeKind.AssignmentExpression) {
        // Check if parent is class definition (this requires passing parent or inferring context)
        // Since we are recursing down, we don't have easy access to parent here in isolation unless we pass it.
        // However, we can check basic structure or rely on the fact that this is AST conversion.
        // But `convertToCommonAST` doesn't take parent.
        // Simplification: We will patch this AFTER children are processed or handle it by heuristics later?
        // Actually, better to do it here if possible. 
        // For now, let's just allow AssignmentExpression to remain, but update MethodDeclaration for __init__.
        // But wait, SingleProvider looks for FieldDeclaration!
        
        // Let's rely on the container. If this is a child of ClassDeclaration, the provider will see children.
        // The provider might need to check for AssignmentExpression too.
        // OR we can change it here.
        // A class variable in Python looks like: `x = 1` inside class.
        // The `convertToCommonAST` is called recursively. 
        // We can pass `parentKind` context? No, signature is fixed.
    }

    const node: CommonASTNode = {
      kind,
      name,
      startPosition: tsNode.startIndex,
      endPosition: tsNode.endIndex,
      startLine: tsNode.startPosition.row + 1,
      startColumn: tsNode.startPosition.column,
      endLine: tsNode.endPosition.row + 1,
      endColumn: tsNode.endPosition.column,
      text: sourceCode.substring(tsNode.startIndex, tsNode.endIndex),
      children: [],
      modifiers: this.extractModifiers(tsNode, sourceCode),
      metadata: this.extractMetadata(tsNode, sourceCode),
    };

    // Special handling for class variables:
    // If we are essentially looking at an assignment, and we can't easily tell the parent, 
    // we might just leave it as AssignmentExpression.
    // However, we can check if it looks like a variable declaration?
    
    for (let i = 0; i < tsNode.childCount; i++) {
      const child = tsNode.child(i);
      if (child) {
        const childNode = this.convertToCommonAST(child, sourceCode);
        
        // Post-processing child for context-aware adjustments
        if (kind === NodeKind.ClassDeclaration && childNode.kind === NodeKind.AssignmentExpression) {
           childNode.kind = NodeKind.FieldDeclaration;
           childNode.modifiers = childNode.modifiers || [];
           childNode.modifiers.push(Modifier.Static); // Python class attributes are implicitly static
           
           // We also want to extract the "name" from the assignment target
           // In Python: `instance = ...` -> left side is target.
           // Assignment child[0] is usually left hand side.
           if (child.childCount > 0) {
              const lhs = child.child(0);
              const lhsCode = sourceCode.substring(lhs.startIndex, lhs.endIndex);
              childNode.name = lhsCode;
           }
        }

        node.children.push(childNode);
      }
    }

    return node;
  }

  private mapNodeKind(type: string): NodeKind {
    const kindMap: Record<string, NodeKind> = {
      class_definition: NodeKind.ClassDeclaration,
      function_definition: NodeKind.MethodDeclaration,
      if_statement: NodeKind.IfStatement,
      elif_clause: NodeKind.IfStatement,
      match_statement: NodeKind.SwitchStatement,
      try_statement: NodeKind.TryStatement,
      for_statement: NodeKind.ForStatement,
      while_statement: NodeKind.WhileStatement,
      call: NodeKind.CallExpression,
      assignment: NodeKind.AssignmentExpression,
      type_annotation: NodeKind.TypeAssertion,
      identifier: NodeKind.Identifier,
      attribute: NodeKind.MemberAccess,
      binary_operator: NodeKind.BinaryExpression,
      parameters: NodeKind.ParameterDeclaration,
    };
    return kindMap[type] || NodeKind.Unknown;
  }

  private extractName(node: any, sourceCode: string): string | undefined {
    // For class and function definitions, the name is typically a child identifier
    if (node.type === 'class_definition' || node.type === 'function_definition') {
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child && child.type === 'identifier') {
          return sourceCode.substring(child.startIndex, child.endIndex);
        }
      }
    }

    if (node.type === 'attribute') {
      // For attribute access, try to get the member name
      const lastChild = node.child(node.childCount - 1);
      if (lastChild && lastChild.type === 'identifier') {
        return sourceCode.substring(lastChild.startIndex, lastChild.endIndex);
      }
    }

    if (node.type === 'call') {
      const funcNode = node.childForFieldName('function');
      if (funcNode) {
          if (funcNode.type === 'identifier') {
              return sourceCode.substring(funcNode.startIndex, funcNode.endIndex);
          } else if (funcNode.type === 'attribute') {
               // For obj.method(), we might want 'method' or 'obj.method'. 
               // For NewExpression detection (PascalCase), we usually want the last part.
               // e.g. models.Database() -> Database
               const lastChild = funcNode.child(funcNode.childCount - 1);
               if (lastChild && lastChild.type === 'identifier') {
                   return sourceCode.substring(lastChild.startIndex, lastChild.endIndex);
               }
          }
      }
    }

    return undefined;
  }

  private extractModifiers(node: any, sourceCode: string): Modifier[] {
    const modifiers: Modifier[] = [];

    // Python uses decorators instead of modifiers
    if (node.type === 'function_definition' || node.type === 'class_definition') {
      let prevSibling = node.previousSibling;
      while (prevSibling) {
        if (prevSibling.type === 'decorated_definition') {
          // Check for @staticmethod, @classmethod, etc.
          const text = sourceCode.substring(prevSibling.startIndex, prevSibling.endIndex);
          if (text.includes('@staticmethod')) modifiers.push(Modifier.Static);
          break;
        }
        prevSibling = prevSibling.previousSibling;
      }
    }

    return modifiers;
  }

  private extractMetadata(node: any, sourceCode: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    if (node.type === 'class_definition') {
      // Look for superclass in argument list
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child && child.type === 'argument_list') {
            // argument_list children include parens, identifiers, commas
            for (let j = 0; j < child.childCount; j++) {
                const arg = child.child(j);
                if (arg.type === 'identifier' || arg.type === 'attribute') {
                    metadata.extendsClass = sourceCode.substring(arg.startIndex, arg.endIndex);
                    break; // Take first base class
                }
            }
            break;
        }
      }
    }

    return metadata;
  }

  private extractSymbols(
    node: CommonASTNode,
    filePath: string,
    sourceCode: string
  ): Map<string, CommonSymbol> {
    const symbols = new Map<string, CommonSymbol>();

    const visit = (n: CommonASTNode) => {
      if (
        (n.kind === NodeKind.ClassDeclaration || n.kind === NodeKind.MethodDeclaration) &&
        n.name
      ) {
        const existing = symbols.get(n.name);
        if (existing) {
          existing.declarations.push(n);
        } else {
          symbols.set(n.name, {
            name: n.name,
            kind: n.kind,
            location: { file: filePath, line: n.startLine, column: n.startColumn },
            declarations: [n],
            usages: [],
          });
        }
      }

      for (const child of n.children) {
        visit(child);
      }
    };

    visit(node);
    return symbols;
  }

  private createEmptyResult(sourceCode: string): ParseResult {
    return {
      rootNode: {
        kind: NodeKind.Unknown,
        startPosition: 0,
        endPosition: sourceCode.length,
        startLine: 1,
        startColumn: 0,
        endLine: sourceCode.split('\n').length,
        endColumn: 0,
        text: sourceCode,
        children: [],
      },
      symbols: new Map(),
      diagnostics: [],
    };
  }

  findSymbol(name: string, filePath: string): CommonASTNode | undefined {
    return undefined;
  }

  findUsages(symbolName: string, filePath: string): CommonASTNode[] {
    return [];
  }
}
