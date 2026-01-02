/**
 * Tree-Sitter based adapter for Java pattern detection
 * Uses real Tree-Sitter parser for accurate AST parsing
 */

import Parser from 'web-tree-sitter';
import * as Java from 'tree-sitter-java';
import { CommonASTNode, NodeKind, ParseResult, Modifier, CommonSymbol } from '../commonAst';
import { LanguageAdapter } from '../languageAdapter';

export class JavaLanguageAdapter implements LanguageAdapter {
  readonly extensions = ['.java'];
  readonly languageName = 'Java';
  private parser: any = null;
  private parserReady: Promise<any>;

  constructor() {
    this.parserReady = this.initParser();
  }

  private async initParser(): Promise<any> {
    if (this.parser) return this.parser;
    await (Parser as any).init();
    this.parser = new (Parser as any)();
    this.parser.setLanguage(Java);
    return this.parser;
  }

  supports(filePath: string): boolean {
    return filePath.endsWith('.java');
  }

  parse(filePath: string, sourceCode: string): ParseResult {
    try {
      // For synchronous parsing, we use cached parser if available
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
      console.error(`Error parsing Java file ${filePath}:`, error);
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
      class_declaration: NodeKind.ClassDeclaration,
      interface_declaration: NodeKind.InterfaceDeclaration,
      method_declaration: NodeKind.MethodDeclaration,
      constructor_declaration: NodeKind.ConstructorDeclaration,
      field_declaration: NodeKind.FieldDeclaration,
      variable_declaration: NodeKind.VariableDeclaration,
      if_statement: NodeKind.IfStatement,
      switch_statement: NodeKind.SwitchStatement,
      try_statement: NodeKind.TryStatement,
      for_statement: NodeKind.ForStatement,
      while_statement: NodeKind.WhileStatement,
      object_creation_expression: NodeKind.NewExpression,
      method_invocation: NodeKind.CallExpression,
      assignment: NodeKind.AssignmentExpression,
      cast_expression: NodeKind.TypeAssertion,
      identifier: NodeKind.Identifier,
      member_access: NodeKind.MemberAccess,
      binary_expression: NodeKind.BinaryExpression,
      parameter_declaration: NodeKind.ParameterDeclaration,
    };
    return kindMap[type] || NodeKind.Unknown;
  }

  private extractName(node: any, sourceCode: string): string | undefined {
    // For declarations, look for identifier child
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'identifier') {
        return sourceCode.substring(child.startIndex, child.endIndex);
      }
    }
    return undefined;
  }

  private extractModifiers(node: any, sourceCode: string): Modifier[] {
    const modifiers: Modifier[] = [];
    const modifierKeywordMap: Record<string, Modifier> = {
      public: Modifier.Public,
      private: Modifier.Private,
      protected: Modifier.Protected,
      static: Modifier.Static,
      abstract: Modifier.Abstract,
      final: Modifier.Final,
      synchronized: Modifier.Synchronized,
    };

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && child.type === 'modifier') {
        const modifierText = sourceCode.substring(child.startIndex, child.endIndex).toLowerCase();
        const mod = modifierKeywordMap[modifierText];
        if (mod) modifiers.push(mod);
      }
    }

    return modifiers;
  }

  private extractMetadata(node: any, sourceCode: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    if (node.type === 'class_declaration' || node.type === 'interface_declaration') {
      // Look for superclass
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child && child.type === 'superclass') {
          const superclassText = sourceCode.substring(child.startIndex, child.endIndex);
          metadata.extendsClass = superclassText.replace(/^extends\s+/, '').trim();
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
    // Placeholder: Would maintain cross-file symbol index
    return undefined;
  }

  findUsages(symbolName: string, filePath: string): CommonASTNode[] {
    // Placeholder: Would track usages across the codebase
    return [];
  }
}
