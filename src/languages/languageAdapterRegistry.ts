/**
 * Language adapter registry and resolver
 * Manages multiple language adapters and resolves the appropriate one for a file
 */

import { LanguageAdapter } from './languageAdapter';
import { JavaLanguageAdapter } from './adapters/javaAdapter';
import { PythonLanguageAdapter } from './adapters/pythonAdapter';
import { CSharpLanguageAdapter } from './adapters/csharpAdapter';
import { ParseResult } from './commonAst';
import * as vscode from 'vscode';

export class LanguageAdapterRegistry {
  private adapters: LanguageAdapter[] = [];

  constructor() {
    this.registerAdapter(new JavaLanguageAdapter());
    this.registerAdapter(new PythonLanguageAdapter());
    this.registerAdapter(new CSharpLanguageAdapter());
  }

  /**
   * Register a new language adapter
   */
  registerAdapter(adapter: LanguageAdapter): void {
    // Remove any existing adapter for the same language
    this.adapters = this.adapters.filter(a => a.languageName !== adapter.languageName);
    this.adapters.push(adapter);
  }

  /**
   * Get adapter for a file
   */
  getAdapter(filePath: string): LanguageAdapter | undefined {
    return this.adapters.find(a => a.supports(filePath));
  }

  /**
   * Get adapter by language name
   */
  getAdapterByLanguage(languageName: string): LanguageAdapter | undefined {
    return this.adapters.find(a => a.languageName === languageName);
  }

  /**
   * Parse a document with the appropriate adapter
   */
  parse(document: vscode.TextDocument): ParseResult | undefined {
    const adapter = this.getAdapter(document.fileName);
    if (!adapter) return undefined;

    return adapter.parse(document.fileName, document.getText());
  }

  /**
   * Get list of supported file extensions
   */
  getSupportedExtensions(): string[] {
    const extensions = new Set<string>();
    this.adapters.forEach(a => a.extensions.forEach(ext => extensions.add(ext)));
    return Array.from(extensions);
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): string[] {
    return this.adapters.map(a => a.languageName);
  }
}

// Global registry instance
export const languageAdapterRegistry = new LanguageAdapterRegistry();
