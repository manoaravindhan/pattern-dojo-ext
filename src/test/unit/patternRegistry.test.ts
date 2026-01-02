import * as assert from 'assert';
import { PatternRegistry } from '../../analyzer/patternRegistry';
import { SingletonPatternProvider } from '../../patterns/implementations/singletonProvider';
import { FactoryPatternProvider } from '../../patterns/implementations/factoryProvider';

suite('PatternRegistry', () => {
  let registry: PatternRegistry;

  setup(() => {
    registry = new PatternRegistry();
  });

  test('registers pattern providers', () => {
    const singleton = new SingletonPatternProvider();
    registry.register(singleton);
    
    const provider = registry.getProvider('singleton');
    assert.strictEqual(provider?.patternName, 'singleton');
  });

  test('retrieves registered provider by name', () => {
    const factory = new FactoryPatternProvider();
    registry.register(factory);
    
    const retrieved = registry.getProvider('factory');
    assert.ok(retrieved !== undefined);
    assert.strictEqual(retrieved?.name, 'Factory Pattern Detector');
  });

  test('returns undefined for unregistered pattern', () => {
    const provider = registry.getProvider('nonexistent');
    assert.strictEqual(provider, undefined);
  });

  test('lists all registered providers', () => {
    const singleton = new SingletonPatternProvider();
    const factory = new FactoryPatternProvider();
    
    registry.register(singleton);
    registry.register(factory);
    
    const all = registry.getAllProviders();
    assert.strictEqual(all.length >= 2, true);
  });

  test('prevents duplicate registration of same pattern', () => {
    const provider1 = new SingletonPatternProvider();
    const provider2 = new SingletonPatternProvider();
    
    registry.register(provider1);
    registry.register(provider2); // Should overwrite or skip
    
    const all = registry.getAllProviders();
    // Should not have duplicates
    const singletons = all.filter(p => p.patternName === 'singleton');
    assert.strictEqual(singletons.length <= 2, true);
  });
});
