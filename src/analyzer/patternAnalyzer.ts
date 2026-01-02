import * as vscode from 'vscode';
import { PatternProvider, PatternViolation, AnalysisConfig } from '../types';
import { PatternRegistry } from './patternRegistry';

/**
 * Main analyzer engine that coordinates pattern detection
 */
export class PatternAnalyzer {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private config: AnalysisConfig;
  private registry: PatternRegistry;

  constructor(registry: PatternRegistry) {
    this.registry = registry;
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('pattern-dojo');
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from VS Code settings
   */
  private loadConfig(): AnalysisConfig {
    const workspaceConfig = vscode.workspace.getConfiguration('pattern-dojo');
    return {
      enabled: workspaceConfig.get<boolean>('enabled') ?? true,
      patterns: workspaceConfig.get<string[]>('patterns') ?? [
        'singleton',
        'factory',
        'observer',
        'strategy',
        'decorator',
        'adapter',
        'facade',
        'proxy',
      ],
      severity: (workspaceConfig.get<string>('severity') as 'error' | 'warning' | 'information') ?? 'warning',
    };
  }

  /**
   * Reload configuration from settings
   */
  reloadConfig(): void {
    this.config = this.loadConfig();
  }

  /**
   * Analyze a single document
   */
  async analyzeDocument(document: vscode.TextDocument): Promise<void> {
    if (!this.config.enabled) {
      this.diagnosticCollection.delete(document.uri);
      return;
    }

    // Only analyze code files
    if (!this.isSupportedLanguage(document.languageId)) {
      return;
    }

    try {
      const providers = this.registry.getProviders(this.config.patterns);
      let violations = this.registry.analyze(document, providers);

      // Filter based on ignore globs (basic filename match)
      if (this.config.ignore && this.config.ignore.length > 0) {
        const fileName = document.fileName;
        const isIgnored = this.config.ignore.some(g => fileName.includes(g));
        if (isIgnored) {
          this.diagnosticCollection.delete(document.uri);
          return;
        }
      }

      // Remove violations suppressed by inline comments
      violations = violations.filter(v => !this.isSuppressed(document, v));

      // Apply per-pattern severity overrides
      for (const v of violations) {
        const codeStr = typeof v.code === 'string' ? v.code : String(v.code);
        const override = this.config.patternSeverities && this.config.patternSeverities[codeStr];
        if (override) {
          v.severity = override === 'error' ? vscode.DiagnosticSeverity.Error : override === 'warning' ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Information;
        }
      }

      const diagnostics = this.violationsToDiagnostics(violations);
      this.diagnosticCollection.set(document.uri, diagnostics);
    } catch (error) {
      console.error('Error analyzing document:', error);
    }
  }

  /**
   * Convert violations to VS Code diagnostics
   */
  private violationsToDiagnostics(violations: PatternViolation[]): vscode.Diagnostic[] {
    return violations.map(violation => {
      const severity = this.getSeverity(violation.severity);
      const diagnostic = new vscode.Diagnostic(
        violation.range,
        violation.message,
        severity
      );
      diagnostic.code = violation.code ?? 'pattern-dojo';
      diagnostic.source = 'Pattern Dojo';
      if (violation.relatedInformation) {
        diagnostic.relatedInformation = violation.relatedInformation;
      }
      return diagnostic;
    });
  }

  /**
   * Map violation severity to diagnostic severity
   */
  private getSeverity(severity: vscode.DiagnosticSeverity): vscode.DiagnosticSeverity {
    return severity;
  }

  /**
   * Detect suppression annotations in the source code.
   * Supports:
   *  - // pattern-dojo-disable-next-line
   *  - // pattern-dojo-disable <code>
   */
  private isSuppressed(document: vscode.TextDocument, violation: PatternViolation): boolean {
    try {
      const startLine = violation.range.start.line;
      // Check previous line for disable-next-line
      if (startLine > 0) {
        const prevLineText = document.lineAt(startLine - 1).text;
        if (/pattern-dojo-disable-next-line/.test(prevLineText)) return true;
      }

      // Check same line for inline disable
      const lineText = document.lineAt(startLine).text;
      if (/pattern-dojo-disable/.test(lineText)) return true;

      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if language is supported
   */
  private isSupportedLanguage(languageId: string): boolean {
    const supportedLanguages = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'java', 'python', 'csharp'];
    return supportedLanguages.includes(languageId);
  }

  /**
   * Analyze all open documents
   */
  async analyzeAllDocuments(): Promise<void> {
    for (const document of vscode.workspace.textDocuments) {
      await this.analyzeDocument(document);
    }
  }

  /**
   * Clear all diagnostics
   */
  clear(): void {
    this.diagnosticCollection.clear();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.diagnosticCollection.dispose();
  }

  /**
   * Get current config
   */
  getConfig(): AnalysisConfig {
    return this.config;
  }
}
