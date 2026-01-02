/**
 * Common AST interface for normalizing different language parsers
 * Allows pattern detectors to work across multiple languages
 */

export enum NodeKind {
  // Class & Interface declarations
  ClassDeclaration = 'ClassDeclaration',
  InterfaceDeclaration = 'InterfaceDeclaration',
  StructDeclaration = 'StructDeclaration',

  // Method & Function declarations
  MethodDeclaration = 'MethodDeclaration',
  FunctionDeclaration = 'FunctionDeclaration',
  ConstructorDeclaration = 'ConstructorDeclaration',

  // Property & Field declarations
  PropertyDeclaration = 'PropertyDeclaration',
  FieldDeclaration = 'FieldDeclaration',

  // Statements
  IfStatement = 'IfStatement',
  SwitchStatement = 'SwitchStatement',
  TryStatement = 'TryStatement',
  ForStatement = 'ForStatement',
  WhileStatement = 'WhileStatement',

  // Expressions
  CallExpression = 'CallExpression',
  NewExpression = 'NewExpression',
  AssignmentExpression = 'AssignmentExpression',
  TypeAssertion = 'TypeAssertion',
  MemberAccess = 'MemberAccess',
  Identifier = 'Identifier',
  BinaryExpression = 'BinaryExpression',

  // Other
  ParameterDeclaration = 'ParameterDeclaration',
  VariableDeclaration = 'VariableDeclaration',
  Unknown = 'Unknown',
}

export interface CommonASTNode {
  kind: NodeKind;
  name?: string;
  startPosition: number;
  endPosition: number;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  text: string;
  children: CommonASTNode[];
  modifiers?: Modifier[];
  parent?: CommonASTNode;
  metadata?: Record<string, any>;
}

export enum Modifier {
  Public = 'public',
  Private = 'private',
  Protected = 'protected',
  Static = 'static',
  Abstract = 'abstract',
  Final = 'final',
  Readonly = 'readonly',
  Async = 'async',
  Synchronized = 'synchronized',
}

export interface CommonSymbol {
  name: string;
  kind: NodeKind;
  location: {
    file: string;
    line: number;
    column: number;
  };
  declarations: CommonASTNode[];
  usages: CommonASTNode[];
}

export interface ParseResult {
  rootNode: CommonASTNode;
  symbols: Map<string, CommonSymbol>;
  diagnostics: ParseDiagnostic[];
}

export interface ParseDiagnostic {
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
}
