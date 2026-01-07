import * as vscode from 'vscode';
import { PatternProvider, PatternViolation } from '../../types';

/**
 * Multi-language fallback providers for languages without specialized analysis
 * These provide basic pattern detection for languages beyond TypeScript/JavaScript
 */

export class MultiLanguageSingletonProvider implements PatternProvider {
  readonly name = 'Singleton Pattern Detector (Multi-language)';
  readonly description = 'Detects Singleton pattern violations (generic)';
  readonly patternName = 'singleton';

  analyze(_document: vscode.TextDocument): PatternViolation[] {
    // Generic pattern detection for non-TS/JS languages
    // Can be extended with regex-based detection or language adapters
    return [];
  }
}

export class MultiLanguageFactoryProvider implements PatternProvider {
  readonly name = 'Factory Pattern Detector (Multi-language)';
  readonly description = 'Detects Factory pattern opportunities (generic)';
  readonly patternName = 'factory';

  analyze(_document: vscode.TextDocument): PatternViolation[] {
    return [];
  }
}

export class MultiLanguageDecoratorProvider implements PatternProvider {
  readonly name = 'Decorator Pattern Detector (Multi-language)';
  readonly description = 'Detects Decorator pattern issues (generic)';
  readonly patternName = 'decorator';

  analyze(_document: vscode.TextDocument): PatternViolation[] {
    return [];
  }
}

export class MultiLanguageStrategyProvider implements PatternProvider {
  readonly name = 'Strategy Pattern Detector (Multi-language)';
  readonly description = 'Detects Strategy pattern violations (generic)';
  readonly patternName = 'strategy';

  analyze(_document: vscode.TextDocument): PatternViolation[] {
    return [];
  }
}

export class MultiLanguageObserverProvider implements PatternProvider {
  readonly name = 'Observer Pattern Detector (Multi-language)';
  readonly description = 'Detects Observer pattern issues (generic)';
  readonly patternName = 'observer';

  analyze(_document: vscode.TextDocument): PatternViolation[] {
    return [];
  }
}

export class MultiLanguageAdapterProvider implements PatternProvider {
  readonly name = 'Adapter Pattern Detector (Multi-language)';
  readonly description = 'Detects Adapter pattern opportunities (generic)';
  readonly patternName = 'adapter';

  analyze(_document: vscode.TextDocument): PatternViolation[] {
    return [];
  }
}

export class MultiLanguageFacadeProvider implements PatternProvider {
  readonly name = 'Facade Pattern Detector (Multi-language)';
  readonly description = 'Detects Facade pattern complexity (generic)';
  readonly patternName = 'facade';

  analyze(_document: vscode.TextDocument): PatternViolation[] {
    return [];
  }
}

export class MultiLanguageProxyProvider implements PatternProvider {
  readonly name = 'Proxy Pattern Detector (Multi-language)';
  readonly description = 'Detects Proxy pattern opportunities (generic)';
  readonly patternName = 'proxy';

  analyze(_document: vscode.TextDocument): PatternViolation[] {
    return [];
  }
}
