/**
 * Base adapter interface for language-specific parsers
 * Implements parsing and symbol resolution for a specific language
 * 
 * Future implementation: Create adapters for additional languages.
 * Each adapter must implement this interface to work with the registry.
 */

import { CommonASTNode, ParseResult } from './commonAst';

export interface LanguageAdapter {
  /**
   * Supported file extensions (e.g., ['.ts', '.js'])
   */
  readonly extensions: string[];

  /**
   * Language name (e.g., 'TypeScript', 'JavaScript')
   */
  readonly languageName: string;

  /**
   * Parse source code and return common AST
   */
  parse(filePath: string, sourceCode: string): Promise<ParseResult> | ParseResult;

  /**
   * Initialize underlying parser(s) if asynchronous setup is required.
   * Implementations should resolve when ready to parse.
   */
  init(): Promise<void> | void;

  /**
   * Find symbol definitions by name (for cross-file resolution)
   */
  findSymbol(name: string, filePath: string): CommonASTNode | undefined;

  /**
   * Get all usages of a symbol in a file
   */
  findUsages(symbolName: string, filePath: string): CommonASTNode[];

  /**
   * Check if a file is supported by this adapter
   */
  supports(filePath: string): boolean;
}

