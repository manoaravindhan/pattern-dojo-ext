/**
 * Base adapter interface for language-specific parsers
 * Implements parsing and symbol resolution for a specific language
 */

import { CommonASTNode, ParseResult } from './commonAst';

export interface LanguageAdapter {
  /**
   * Supported file extensions (e.g., ['.java', '.kt'])
   */
  readonly extensions: string[];

  /**
   * Language name (e.g., 'Java', 'Python', 'CSharp')
   */
  readonly languageName: string;

  /**
   * Parse source code and return common AST
   */
  parse(filePath: string, sourceCode: string): ParseResult;

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
