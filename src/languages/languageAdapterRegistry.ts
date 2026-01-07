/**
 * Language adapter registry and resolver
 * Manages multiple language adapters and resolves the appropriate one for a file
 */

import { LanguageAdapter } from './languageAdapter';
import { ParseResult } from './commonAst';
import * as vscode from 'vscode';

/**
 * Language adapter registry for managing multi-language parsing.
 * 
 * Currently focused on TypeScript/JavaScript analysis.
 * 
 * Future language support can be added by:
 * 1. Creating new adapter classes implementing LanguageAdapter interface
 * 2. Registering them in the constructor: this.registerAdapter(new MyLanguageAdapter())
 * 3. Adding activation events and language IDs to package.json
 * 
 * Example: Adding additional language support
   * - Create src/languages/adapters/languageAdapter.ts implementing LanguageAdapter
 * - Register in constructor and update package.json activation events
 */
export class LanguageAdapterRegistry {
  private adapters: LanguageAdapter[] = [];

  constructor() {
    // Currently no language adapters registered - TypeScript/JavaScript analysis only
    // Future adapters can be registered here
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
  async parse(document: vscode.TextDocument): Promise<ParseResult | undefined> {
    const adapter = this.getAdapter(document.fileName);
    if (!adapter) return undefined;

    return Promise.resolve(adapter.parse(document.fileName, document.getText()));
  }

  /**
   * Initialize all registered adapters to ensure parsers are ready.
   */
  async initAll(): Promise<void> {
    await Promise.all(this.adapters.map(a => Promise.resolve(a.init?.() as Promise<void>)));
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
