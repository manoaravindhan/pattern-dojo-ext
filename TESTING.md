# Testing Pattern Dojo

## Manual Testing

### Test 1: Run the Extension

1. Open the project in VS Code
2. Run `npm install && npm run compile`
3. Press `F5` to launch the extension in a new VS Code window
4. Open the `example.ts` file
5. The Problems panel should show multiple pattern violations

### Test 2: Singleton Pattern

Create a test file with:
```typescript
class Database {
  static instance = new Database();
  public constructor() { }
}
```

**Expected**: Warning about public constructor

### Test 3: Factory Pattern

Create multiple instances in different places:
```typescript
const obj1 = new MyClass();
const obj2 = new MyClass();
const obj3 = new MyClass();
```

**Expected**: Information about multiple instantiations

### Test 4: Observer Pattern

```typescript
addEventListener('click', handler);
// No removeEventListener
```

**Expected**: Warning about missing cleanup

### Test 5: Strategy Pattern

```typescript
if (format === 'pdf') { }
else if (format === 'excel') { }
else if (format === 'json') { }
else if (format === 'csv') { }
```

**Expected**: Information about long if-else chain

### Test 6: Decorator Pattern

```typescript
class A { }
class B extends A { }
class C extends B { }
class D extends C { }
class E extends D { }
```

**Expected**: Information about deep inheritance

### Test 7: Adapter Pattern

```typescript
const data = oldData as any as NewType;
```

**Expected**: Information about type assertions

### Test 8: Facade Pattern

```typescript
class Service {
  public method1() { }
  public method2() { }
  public method3() { }
  public method4() { }
  public method5() { }
  public method6() { }
  public method7() { }
  public method8() { }
}
```

**Expected**: Information about complex public interface

### Test 9: Proxy Pattern

```typescript
service.fetch(url);
service.query(sql);
service.load(file);
service.fetch(url2);
```

**Expected**: Information about repeated expensive operations

## Configuration Testing

### Test 1: Disable Extension

Add to `.vscode/settings.json`:
```json
{ "pattern-dojo.enabled": false }
```

**Expected**: No diagnostics appear

### Test 2: Filter Patterns

```json
{
  "pattern-dojo.patterns": ["singleton"]
}
```

**Expected**: Only singleton violations reported

### Test 3: Change Severity

```json
{
  "pattern-dojo.severity": "error"
}
```

**Expected**: All violations shown as errors (red underlines)

## Command Testing

### Test 1: Refresh Command

1. Open any code file
2. Press Ctrl+Shift+P
3. Type "Refresh Pattern"
4. Press Enter

**Expected**: Analysis completes without error

### Test 2: Report Issue Command

1. Press Ctrl+Shift+P
2. Type "Report Pattern"
3. Select a pattern
4. Enter a message

**Expected**: Dialog closes and message shows

## Language Testing

Test with different file types:

- `.ts` (TypeScript) - ✅ Should analyze
- `.js` (JavaScript) - ✅ Should analyze
- `.java` (Java) - ✅ Should analyze
- `.py` (Python) - ✅ Should analyze
- `.cs` (C#) - ✅ Should analyze
- `.txt` (Text) - ✅ Should ignore
- `.md` (Markdown) - ✅ Should ignore

## Performance Testing

### Test Large Files

1. Create a large TypeScript file (10,000+ lines)
2. Open it in VS Code
3. Check that analysis completes in < 2 seconds

**Expected**: No lag or freezing

### Test Multiple Files

1. Open 10+ code files
2. Edit each one
3. Monitor CPU usage

**Expected**: Smooth analysis without excessive CPU

## Debug Testing

1. Set a breakpoint in `src/patterns/implementations/singletonProvider.ts`
2. Open a file with singleton issues
3. Press F5 to debug
4. Breakpoint should trigger

**Expected**: Code stops at breakpoint, variables inspectable

## Automated Testing

Run the test suite:

```bash
npm test
```

**Expected**: Tests pass without errors

## Cleanup Testing

1. Run the extension
2. Close VS Code window
3. Check that cleanup happens properly

**Expected**: No memory leaks or hanging processes

## Troubleshooting Tests

### Issue: No diagnostics appearing

- [ ] Verify `pattern-dojo.enabled: true`
- [ ] Check file is supported language
- [ ] Run "Refresh Pattern Analysis" command
- [ ] Check Output panel for errors

### Issue: Too many false positives

- [ ] Filter patterns in settings
- [ ] Change severity to "information"
- [ ] Disable extension temporarily

### Issue: Extension won't start

- [ ] Run `npm install`
- [ ] Run `npm run compile`
- [ ] Check for TypeScript errors
- [ ] Check Debug Console for runtime errors

## Sign-off Checklist

- [ ] All 8 patterns detect correctly
- [ ] Configuration options work
- [ ] Commands function properly
- [ ] Multiple languages supported
- [ ] No errors in debug console
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Example file demonstrates all patterns

## Example-based Tests

Use the `examples/` folder to run manual scenario tests. Steps:

```bash
npm install
npm run compile
# Press F5 in VS Code, open an example file and observe Problems panel
```

Files:

- `examples/ts/example.ts`
- `examples/java/Example.java`
- `examples/python/example.py`
- `examples/csharp/Example.cs`
