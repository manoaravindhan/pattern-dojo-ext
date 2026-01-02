import { PatternProvider, ProviderContext } from './types';

/**
 * Public plugin API helpers for third-party pattern providers.
 * Export small utilities and a template to make writing providers easy.
 */

export interface PluginRegistration {
  register(provider: PatternProvider): void;
  unregister(patternName: string): void;
}

export function createProviderContext(getConfig: () => any): ProviderContext {
  return {
    getConfig: () => getConfig(),
  };
}

export const exampleProviderTemplate = `// Example pattern provider
import * as vscode from 'vscode';
import { PatternProvider, PatternViolation } from '../types';

export class MyPatternProvider implements PatternProvider {
  readonly name = 'My Pattern Provider';
  readonly description = 'Detects My Pattern';
  readonly patternName = 'my-pattern';

  analyze(document: vscode.TextDocument): PatternViolation[] {
    // Your detection logic here
    return [];
  }
}
`;

export default {
  createProviderContext,
  exampleProviderTemplate,
};
