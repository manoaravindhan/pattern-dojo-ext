import * as vscode from 'vscode';
import { PatternViolation, AnalysisConfig } from '../types';
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
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('pattern-lens');
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from VS Code settings
   */
  private loadConfig(): AnalysisConfig {
    const workspaceConfig = vscode.workspace.getConfiguration('pattern-lens');
    
    // Default patterns map
    const defaultPatterns: Record<string, boolean> = {
        singleton: true, factory: true, observer: true, strategy: true,
        decorator: true, adapter: true, facade: true, proxy: true
    };
    
    // Default severity map
    const defaultSeverity: Record<string, 'error' | 'warning' | 'information'> = {
        singleton: 'warning', factory: 'information', observer: 'warning',
        strategy: 'information', decorator: 'information', adapter: 'information',
        facade: 'information', proxy: 'information'
    };

    // Robustly handle config types (in case of legacy/mixed settings)
    const patternsConfig = workspaceConfig.get('patterns');
    const severityConfig = workspaceConfig.get('severity');

    let patterns = defaultPatterns;
    if (patternsConfig && typeof patternsConfig === 'object' && !Array.isArray(patternsConfig)) {
        patterns = { ...defaultPatterns, ...patternsConfig };
    } else if (Array.isArray(patternsConfig)) {
        // Legacy array support: map array items to true
        patterns = { ...defaultPatterns }; // Start with defaults
        // Reset defaults to false? No, usually legacy array implied "only these are enabled" or "these are added to default"?
        // Usually array list replaces defaults.
        // Let's assume if array is provided, we disable all defaults and enable only present ones? 
        // Or better, just enable what's in array.
        Object.keys(patterns).forEach(k => patterns[k] = false);
        patternsConfig.forEach((p: string) => { if(typeof p === 'string') patterns[p] = true; });
    }

    let severity = defaultSeverity;
    if (severityConfig && typeof severityConfig === 'object') {
        severity = { ...defaultSeverity, ...severityConfig };
    } else if (typeof severityConfig === 'string') {
        // Legacy string support: apply to all
        const level = severityConfig as 'error' | 'warning' | 'information';
        Object.keys(severity).forEach(k => severity[k] = level);
    }

    return {
      enabled: workspaceConfig.get<boolean>('enabled') ?? true,
      patterns,
      severity,
      ignore: workspaceConfig.get<string[]>('ignore')
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
      const enabledPatterns = Object.keys(this.config.patterns).filter(k => this.config.patterns[k]);
      const providers = this.registry.getProviders(enabledPatterns);
      
      let violations: PatternViolation[] = [];

      // Analyze per provider to apply specific configuration
      for (const provider of providers) {
          try {
              const result = provider.analyze(document);
              const providerViolations = result instanceof Promise ? await result : result;

              // Apply severity from config
              // provider.patternName corresponds to config keys (e.g. 'singleton')
              const severitySetting = this.config.severity[provider.patternName] || 'warning';
              const severityEnum = severitySetting === 'error' ? vscode.DiagnosticSeverity.Error : 
                                   severitySetting === 'information' ? vscode.DiagnosticSeverity.Information : 
                                   vscode.DiagnosticSeverity.Warning;
              
              providerViolations.forEach(v => { v.severity = severityEnum; });
              
              violations.push(...providerViolations);
          } catch (e) {
              console.error(`Error in provider ${provider.patternName}:`, e);
          }
      }

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
      diagnostic.code = violation.code ?? 'pattern-lens';
      diagnostic.source = 'Pattern Lens';
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
   *  - // pattern-lens-disable-next-line
   *  - // pattern-lens-disable <code>
   */
  private isSuppressed(document: vscode.TextDocument, violation: PatternViolation): boolean {
    try {
      const startLine = violation.range.start.line;
      // Check previous line for disable-next-line
      if (startLine > 0) {
        const prevLineText = document.lineAt(startLine - 1).text;
        if (/pattern-lens-disable-next-line/.test(prevLineText)) return true;
      }

      // Check same line for inline disable
      const lineText = document.lineAt(startLine).text;
      if (/pattern-lens-disable/.test(lineText)) return true;

      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get diagnostics for a URI
   */
  getDiagnostics(uri: vscode.Uri): readonly vscode.Diagnostic[] | undefined {
    return this.diagnosticCollection.get(uri);
  }

  /**
   * Check if language is supported
   */
  isSupportedLanguage(languageId: string): boolean {
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
