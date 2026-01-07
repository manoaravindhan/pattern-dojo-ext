import * as vscode from 'vscode';
import { PatternProvider } from '../types';
import { CompositePatternProvider } from './compositeProvider';
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
  MultiLanguageStrategyProvider,
  MultiLanguageObserverProvider,
  MultiLanguageAdapterProvider,
  MultiLanguageFacadeProvider,
  MultiLanguageProxyProvider,
} from './implementations/multiLanguageProviders';

/**
 * Factory function to create all built-in pattern providers
 * Includes both TypeScript-specific and multi-language providers
 */
export function createBuiltInProviders(): PatternProvider[] {
  const tsLangs = ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'];
  
  return [
    // Singleton
    new CompositePatternProvider(
      'Singleton Pattern Detector',
      'Detects Singleton pattern violations',
      'singleton',
      [{ language: tsLangs, provider: new SingletonPatternProvider() }],
      new MultiLanguageSingletonProvider() // Default for other languages
    ),

    // Factory
    new CompositePatternProvider(
      'Factory Pattern Detector',
      'Detects Factory pattern opportunities',
      'factory',
      [{ language: tsLangs, provider: new FactoryPatternProvider() }],
      new MultiLanguageFactoryProvider()
    ),

    // Decorator
    new CompositePatternProvider(
      'Decorator Pattern Detector',
      'Detects deep inheritance hierarchies',
      'decorator',
      [{ language: tsLangs, provider: new DecoratorPatternProvider() }],
      new MultiLanguageDecoratorProvider()
    ),

    // Observer
    new CompositePatternProvider(
      'Observer Pattern Detector',
      'Detects potential Observer pattern logic (add/remove listeners)',
      'observer',
      [{ language: tsLangs, provider: new ObserverPatternProvider() }],
      new MultiLanguageObserverProvider()
    ),
    
    // Strategy
    new CompositePatternProvider(
      'Strategy Pattern Detector',
      'Detects issues with Strategy pattern implementation',
      'strategy',
      [{ language: tsLangs, provider: new StrategyPatternProvider() }],
      new MultiLanguageStrategyProvider()
    ),

    // Adapter
    new CompositePatternProvider(
      'Adapter Pattern Detector',
      'Detects frequent type casting or try-catch blocks',
      'adapter',
      [{ language: tsLangs, provider: new AdapterPatternProvider() }],
      new MultiLanguageAdapterProvider()
    ),

    // Facade
    new CompositePatternProvider(
      'Facade Pattern Detector',
      'Detects classes with complex public interfaces',
      'facade',
      [{ language: tsLangs, provider: new FacadePatternProvider() }],
      new MultiLanguageFacadeProvider()
    ),

    // Proxy
    new CompositePatternProvider(
      'Proxy Pattern Detector',
      'Detects repeated expensive operations',
      'proxy',
      [{ language: tsLangs, provider: new ProxyPatternProvider() }],
      new MultiLanguageProxyProvider()
    ),
  ];
}

/**
 * Export all providers for external use
 */
export {
  CompositePatternProvider,
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
  MultiLanguageStrategyProvider,
  MultiLanguageObserverProvider,
  MultiLanguageAdapterProvider,
  MultiLanguageFacadeProvider,
  MultiLanguageProxyProvider,
};
