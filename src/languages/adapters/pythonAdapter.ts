/**
 * Tree-Sitter based adapter for Python pattern detection
 * Uses real Tree-Sitter parser for accurate AST parsing
 */

import Parser from 'web-tree-sitter';
import * as Python from 'tree-sitter-python';
import { CommonASTNode, NodeKind, ParseResult, Modifier, CommonSymbol } from '../commonAst';
import { LanguageAdapter } from '../languageAdapter';

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
    await (Parser as any).init();
    this.parser = new (Parser as any)();
    this.parser.setLanguage(Python);
    return this.parser;
  }

  supports(filePath: string): boolean {
    return filePath.endsWith('.py');
  }

  parse(filePath: string, sourceCode: string): ParseResult {
    try {
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
    const node: CommonASTNode = {
      kind: this.mapNodeKind(tsNode.type),
      name: this.extractName(tsNode, sourceCode),
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

    for (let i = 0; i < tsNode.childCount; i++) {
      const child = tsNode.child(i);
      if (child) {
        node.children.push(this.convertToCommonAST(child, sourceCode));
      }
    }

    return node;
  }

  private mapNodeKind(type: string): NodeKind {
    const kindMap: Record<string, NodeKind> = {
      class_definition: NodeKind.ClassDeclaration,
      function_definition: NodeKind.MethodDeclaration,
      if_statement: NodeKind.IfStatement,
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
          const argText = sourceCode.substring(child.startIndex, child.endIndex);
          metadata.extendsClass = argText.replace(/[()]/g, '').trim();
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
