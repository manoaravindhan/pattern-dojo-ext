// examples/ts/example.ts

// Singleton with public constructor
class Database {
  static instance = new Database();
  public constructor() { }
}

// Multiple instantiations (factory suggestion)
class Worker { }
const w1 = new Worker();
const w2 = new Worker();
const w3 = new Worker();

// Observer without cleanup
window.addEventListener('resize', () => console.log('resized'));

// Long if-else (strategy suggestion)
function formatOutput(kind: string) {
  if (kind === 'json') { return '{}'; }
  else if (kind === 'xml') { return '<xml/>'; }
  else if (kind === 'csv') { return ','; }
  else if (kind === 'yaml') { return '---'; }
  else if (kind === 'text') { return 'txt'; }
  return '';
}

// Facade-ish: many public methods
class Service {
  public a() {}
  public b() {}
  public c() {}
  public d() {}
  public e() {}
  public f() {}
  public g() {}
  public h() {}
}

// Proxy-ish: repeated expensive calls
function expensive() { console.log('expensive'); }
expensive(); expensive(); expensive();
