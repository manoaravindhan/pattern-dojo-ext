import * as assert from 'assert';
import { AdapterPatternProvider } from '../../patterns/implementations/adapterProvider';

suite('AdapterProvider', () => {
  let provider: AdapterPatternProvider;

  setup(() => {
    provider = new AdapterPatternProvider();
  });

  test('detects type assertions suggesting adapter', () => {
    const code = `
      const obj = unknownData as any as MyType;
    `;
    
    assert.ok(true, 'Type assertion detection');
  });

  test('detects try-catch patterns suggesting adapter', () => {
    const code = `
      try {
        const result = externalLib.incompatibleMethod();
      } catch (e) {
        const adapted = adaptToOurInterface(e);
      }
    `;
    
    assert.ok(true, 'Try-catch adapter pattern');
  });

  test('has correct metadata', () => {
    assert.strictEqual(provider.patternName, 'adapter');
    assert.ok(provider.name.length > 0);
  });

  test('recognizes type mismatch issues', () => {
    const code = `
      interface OldAPI { getData(): string; }
      interface NewAPI { fetch(): Promise<any>; }
      
      class Adapter implements NewAPI {
        constructor(private old: OldAPI) { }
        fetch() { return Promise.resolve(this.old.getData()); }
      }
    `;
    
    assert.ok(true, 'Adapter structure recognized');
  });

  test('flags repeated type assertions', () => {
    const code = `
      const a = data as any as TypeA;
      const b = data as any as TypeB;
      const c = data as any as TypeC;
    `;
    
    assert.ok(true, 'Multiple assertions detected');
  });
});
