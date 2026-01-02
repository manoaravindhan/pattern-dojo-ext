import * as vscode from 'vscode';
import { PatternProvider } from '../types';
import { SingletonPatternProvider } from './implementations/singletonProvider';
import { FactoryPatternProvider } from './implementations/factoryProvider';
import { ObserverPatternProvider } from './implementations/observerProvider';
import { StrategyPatternProvider } from './implementations/strategyProvider';
import { DecoratorPatternProvider } from './implementations/decoratorProvider';
import { AdapterPatternProvider } from './implementations/adapterProvider';
import { FacadePatternProvider } from './implementations/facadeProvider';
import { ProxyPatternProvider } from './implementations/proxyProvider';
import {
  MultiLanguageSingletonProvider,
  MultiLanguageFactoryProvider,
  MultiLanguageDecoratorProvider,
} from './implementations/multiLanguageProviders';

/**
 * Factory function to create all built-in pattern providers
 * Includes both TypeScript-specific and multi-language providers
 */
export function createBuiltInProviders(): PatternProvider[] {
  return [
    // TypeScript/JavaScript specific providers (high accuracy)
    new SingletonPatternProvider(),
    new FactoryPatternProvider(),
    new ObserverPatternProvider(),
    new StrategyPatternProvider(),
    new DecoratorPatternProvider(),
    new AdapterPatternProvider(),
    new FacadePatternProvider(),
    new ProxyPatternProvider(),
    // Multi-language providers (for Java, Python, C#, etc.)
    new MultiLanguageSingletonProvider(),
    new MultiLanguageFactoryProvider(),
    new MultiLanguageDecoratorProvider(),
  ];
}

/**
 * Export all providers for external use
 */
export {
  SingletonPatternProvider,
  FactoryPatternProvider,
  ObserverPatternProvider,
  StrategyPatternProvider,
  DecoratorPatternProvider,
  AdapterPatternProvider,
  FacadePatternProvider,
  ProxyPatternProvider,
  MultiLanguageSingletonProvider,
  MultiLanguageFactoryProvider,
  MultiLanguageDecoratorProvider,
};
