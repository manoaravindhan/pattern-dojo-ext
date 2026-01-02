import * as vscode from 'vscode';

/**
 * Base interface for all pattern providers
 * Implement this to create custom pattern detectors
 */
export interface PatternProvider {
  readonly name: string;
  readonly description: string;
  readonly patternName: string;

  /**
   * Analyze code and return detected pattern violations
   */
  analyze(document: vscode.TextDocument): PatternViolation[];

  /**
   * Optional lifecycle hook called when provider is registered
   */
  initialize?(context?: ProviderContext): Promise<void> | void;

  /**
   * Optional lifecycle hook called when provider is unregistered/disposed
   */
  dispose?(): Promise<void> | void;
}

/**
 * Represents a single pattern violation found in code
 */
export interface PatternViolation {
  range: vscode.Range;
  message: string;
  severity: vscode.DiagnosticSeverity;
  code?: string | number;
  relatedInformation?: vscode.DiagnosticRelatedInformation[];
}

/**
 * Configuration for pattern analysis
 */
export interface AnalysisConfig {
  enabled: boolean;
  patterns: string[];
  severity: 'error' | 'warning' | 'information';
  /** per-pattern severity overrides */
  patternSeverities?: Record<string, 'error' | 'warning' | 'information'>;
  /** files or globs to ignore */
  ignore?: string[];
}

/**
 * Context passed to providers when initialized
 */
export interface ProviderContext {
  /** access to workspace configuration */
  getConfig(): AnalysisConfig;
}

/**
 * Analysis result
 */
export interface AnalysisResult {
  violations: PatternViolation[];
  patternName: string;
}
