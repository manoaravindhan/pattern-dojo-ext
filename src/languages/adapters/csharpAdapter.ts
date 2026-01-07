/**
 * Tree-Sitter based adapter for C# pattern detection
 * Uses real Tree-Sitter parser for accurate AST parsing
 */

import Parser from 'web-tree-sitter';
import { CommonASTNode, NodeKind, ParseResult, Modifier, CommonSymbol } from '../commonAst';
import { LanguageAdapter } from '../languageAdapter';
import * as path from 'path';

export class CSharpLanguageAdapter implements LanguageAdapter {
  readonly extensions = ['.cs'];
  readonly languageName = 'CSharp';
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
    // Note: File name is usually c-sharp or c_sharp. We copied it as c-sharp.
    const langWasmPath = path.resolve(__dirname, '..', '..', '..', 'wasm', 'tree-sitter-c-sharp.wasm');
    const lang = await (Parser as any).Language.load(langWasmPath);

    this.parser.setLanguage(lang);
    return this.parser;
  }

  supports(filePath: string): boolean {
    return filePath.endsWith('.cs');
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
      console.error(`Error parsing C# file ${filePath}:`, error);
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
      struct_declaration: NodeKind.StructDeclaration,
      method_declaration: NodeKind.MethodDeclaration,
      constructor_declaration: NodeKind.ConstructorDeclaration,
      property_declaration: NodeKind.PropertyDeclaration,
      field_declaration: NodeKind.FieldDeclaration,
      variable_declaration: NodeKind.VariableDeclaration,
      if_statement: NodeKind.IfStatement,
      switch_statement: NodeKind.SwitchStatement,
      try_statement: NodeKind.TryStatement,
      for_statement: NodeKind.ForStatement,
      while_statement: NodeKind.WhileStatement,
      object_creation_expression: NodeKind.NewExpression,
      invocation_expression: NodeKind.CallExpression,
      assignment_expression: NodeKind.AssignmentExpression,
      cast_expression: NodeKind.TypeAssertion,
      identifier_name: NodeKind.Identifier,
      member_access_expression: NodeKind.MemberAccess,
      binary_expression: NodeKind.BinaryExpression,
      parameter_list: NodeKind.ParameterDeclaration,
    };
    return kindMap[type] || NodeKind.Unknown;
  }

  private extractName(node: any, sourceCode: string): string | undefined {
    // Handle object creation
    if (node.type === 'object_creation_expression') {
         // child 1 is usually the type (child 0 is 'new')
         for (let i = 0; i < node.childCount; i++) {
             const child = node.child(i);
             // Type is usually 'identifier_name' or 'generic_name'
             if (child.type !== 'new_keyword' && (child.type === 'identifier_name' || child.type === 'generic_name' || child.type === 'qualified_name')) {
                 return sourceCode.substring(child.startIndex, child.endIndex);
             }
         }
    }

    // Handle fields/properties
    if (node.type === 'field_declaration' || node.type === 'variable_declaration') {
         // field_declaration -> variable_declaration -> variable_declarator -> identifier
         // or field_declaration -> variable_declarator (depending on schema version, C# usually has variable_declaration wrapper?)
         // Let's search recursively for variable_declarator
         const current = node; 
         // logic to find children
         for(let i=0; i<node.childCount; i++) {
             const child = node.child(i);
             if (child.type === 'variable_declaration') {
                 // get declarator
                  for(let j=0; j<child.childCount; j++) {
                     const decl = child.child(j);
                     if (decl.type === 'variable_declarator') {
                         const id = decl.child(0); // name is first child
                         if (id) return sourceCode.substring(id.startIndex, id.endIndex);
                     }
                  }
             }
         }
    }
    
    // Fallback: For known declaration types or generic structure, look for identifier
    if (
      node.type === 'class_declaration' ||
      node.type === 'interface_declaration' ||
      node.type === 'struct_declaration' ||
      node.type === 'method_declaration' ||
      node.type === 'constructor_declaration' ||
      node.type === 'property_declaration' ||
      node.type === 'variable_declarator'
    ) {
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child && (child.type === 'identifier_name' || child.type === 'identifier')) {
          return sourceCode.substring(child.startIndex, child.endIndex);
        }
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
      sealed: Modifier.Final,
      readonly: Modifier.Readonly,
      async: Modifier.Async,
    };

    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child && (child.type === 'modifier' || child.type === 'visibility_modifier')) {
        const modifierText = sourceCode.substring(child.startIndex, child.endIndex).toLowerCase();
        const mod = modifierKeywordMap[modifierText];
        if (mod) modifiers.push(mod);
      }
    }

    return modifiers;
  }

  private extractMetadata(node: any, sourceCode: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    if (node.type === 'class_declaration' || node.type === 'struct_declaration') {
      // Look for base list (inheritance). Format: : Base, Iface1
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child && child.type === 'base_list') {
          // Flatten split logic: take the first identifier in the list
          for (let j = 0; j < child.childCount; j++) {
             const baseItem = child.child(j);
             if (baseItem.type === 'identifier_name' || baseItem.type === 'simple_type' || baseItem.type === 'qualified_name') {
                 const name = sourceCode.substring(baseItem.startIndex, baseItem.endIndex);
                 // Usually first one is class if present, or interface. 
                 // Simple clean: assume single inheritance of importance for Decorator depth check
                 metadata.extendsClass = name;
                 break;
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
        (n.kind === NodeKind.ClassDeclaration ||
          n.kind === NodeKind.InterfaceDeclaration ||
          n.kind === NodeKind.MethodDeclaration) &&
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
