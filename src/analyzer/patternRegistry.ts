import * as vscode from 'vscode';
import { PatternProvider, PatternViolation, AnalysisConfig } from '../types';

/**
 * Registry to manage pattern providers
 * Supports dynamic registration and lookup of pattern detectors
 */
export class PatternRegistry {
  private providers: Map<string, PatternProvider> = new Map();

  /**
   * Register a pattern provider
   */
  register(provider: PatternProvider): void {
    this.providers.set(provider.patternName.toLowerCase(), provider);
  }

  /**
   * Get a provider by pattern name
   */
  getProvider(patternName: string): PatternProvider | undefined {
    return this.providers.get(patternName.toLowerCase());
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): PatternProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get providers for specified pattern names
   */
  getProviders(patternNames: string[]): PatternProvider[] {
    return patternNames
      .map(name => this.getProvider(name))
      .filter((provider): provider is PatternProvider => provider !== undefined);
  }

  /**
   * Analyze document with specified providers
   */
  analyze(document: vscode.TextDocument, providers: PatternProvider[]): PatternViolation[] {
    const violations: PatternViolation[] = [];

    for (const provider of providers) {
      try {
        const providerViolations = provider.analyze(document);
        violations.push(...providerViolations);
      } catch (error) {
        console.error(`Error analyzing pattern ${provider.patternName}:`, error);
      }
    }

    return violations;
  }

  /**
   * Get list of available pattern names
   */
  getAvailablePatterns(): string[] {
    return Array.from(this.providers.keys()).map(key => 
      key.charAt(0).toUpperCase() + key.slice(1)
    );
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
  }
}

// Export singleton instance
export const patternRegistry = new PatternRegistry();
