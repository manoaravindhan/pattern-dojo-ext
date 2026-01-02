/**
 * Pattern Dojo - Example Code Demonstrating Design Pattern Issues
 * 
 * This file contains various code patterns that Pattern Dojo will detect and highlight.
 * Open this file in VS Code with the Pattern Dojo extension enabled to see the detection in action.
 */

// ============================================================================
// SINGLETON PATTERN - Issues
// ============================================================================

class Database {
  static instance = new Database();
  
  // ERROR: Public constructor violates singleton pattern
  public constructor() {
    console.log('Database instance created');
  }

  static getInstance() {
    return Database.instance;
  }
}

// ============================================================================
// FACTORY PATTERN - Issues  
// ============================================================================

class Animal {
  constructor(public name: string) {}
}

class Dog extends Animal {
  bark() {
    console.log('Woof!');
  }
}

class Cat extends Animal {
  meow() {
    console.log('Meow!');
  }
}

// Creating instances in multiple places - could use factory
class AnimalTrainer {
  private animals: Animal[] = [];

  addDog(name: string) {
    this.animals.push(new Dog(name)); // Instance 1
  }

  addCat(name: string) {
    this.animals.push(new Cat(name)); // Instance 2
  }

  createRandomAnimal(name: string) {
    if (Math.random() > 0.5) {
      this.animals.push(new Dog(name)); // Instance 3
    } else {
      this.animals.push(new Cat(name)); // Instance 4
    }
  }
}

// ============================================================================
// OBSERVER PATTERN - Issues
// ============================================================================

class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
    // WARNING: No corresponding unsubscribe mechanism shown
  }

  addEventListener(eventType: string, handler: (e: Event) => void) {
    // Event listener added but might not be removed
    window.addEventListener(eventType, handler);
  }

  subscribe(callback: (data: any) => void) {
    // Subscription without unsubscribe pattern
    return callback;
  }
}

// ============================================================================
// STRATEGY PATTERN - Issues
// ============================================================================

class ReportGenerator {
  generateReport(format: string, data: any) {
    if (format === 'pdf') {
      // Generate PDF
      console.log('Generating PDF report');
    } else if (format === 'excel') {
      // Generate Excel
      console.log('Generating Excel report');
    } else if (format === 'json') {
      // Generate JSON
      console.log('Generating JSON report');
    } else if (format === 'csv') {
      // Generate CSV
      console.log('Generating CSV report');
    }
    // WARNING: Long switch-like structure - consider Strategy pattern
  }
}

// ============================================================================
// DECORATOR PATTERN - Issues
// ============================================================================

class Vehicle {
  describe() {
    return 'Vehicle';
  }
}

class Car extends Vehicle {
  describe() {
    return 'Car';
  }
}

class SportsCar extends Car {
  describe() {
    return 'Sports ' + super.describe();
  }
}

class LuxurySportsCar extends SportsCar {
  describe() {
    return 'Luxury ' + super.describe();
  }
}

class TurboLuxurySportsCar extends LuxurySportsCar {
  describe() {
    return 'Turbo ' + super.describe();
  }
}
// WARNING: Deep inheritance hierarchy - consider Decorator pattern

// ============================================================================
// ADAPTER PATTERN - Issues
// ============================================================================

class LegacySystem {
  getOldData(): string {
    return 'legacy_data';
  }
}

class ModernAPI {
  processData(data: { id: string; value: any }) {
    console.log('Processing:', data);
  }
}

class DataAdapter {
  constructor(private legacy: LegacySystem) {}

  adapt() {
    const oldData = this.legacy.getOldData();
    // Type assertion to bridge incompatible interfaces
    const adapted = oldData as any as { id: string; value: any };
    return adapted;
  }

  connect() {
    try {
      const data = this.adapt();
      console.log(data);
    } catch (e) {
      // Multiple try-catch blocks may indicate interface incompatibility
      console.error('Adaptation failed');
    }
  }
}

// ============================================================================
// FACADE PATTERN - Issues
// ============================================================================

class ComplexSystem {
  public initializeDatabase() {
    console.log('Initializing database');
  }

  public loadConfiguration() {
    console.log('Loading configuration');
  }

  public setupCache() {
    console.log('Setting up cache');
  }

  public validateSettings() {
    console.log('Validating settings');
  }

  public startServices() {
    console.log('Starting services');
  }

  public establishConnections() {
    console.log('Establishing connections');
  }

  public warmupCache() {
    console.log('Warming up cache');
  }

  public registerHandlers() {
    console.log('Registering handlers');
  }

  public startMonitoring() {
    console.log('Starting monitoring');
  }
}
// WARNING: Many public methods - consider Facade pattern

// ============================================================================
// PROXY PATTERN - Issues
// ============================================================================

class DataService {
  fetch(url: string) {
    console.log('Fetching from', url);
    return { data: 'result' };
  }

  query(sql: string) {
    console.log('Executing query:', sql);
    return [];
  }

  load(resource: string) {
    console.log('Loading', resource);
    return null;
  }

  parse(content: string) {
    console.log('Parsing content');
    return {};
  }

  compile(code: string) {
    console.log('Compiling code');
    return null;
  }

  render(template: string) {
    console.log('Rendering template');
    return '<html></html>';
  }
}

class ReportService {
  constructor(private data: DataService) {}

  generateReport() {
    // Multiple expensive operations called repeatedly
    const result1 = this.data.fetch('https://api.example.com/data');
    const result2 = this.data.query('SELECT * FROM reports');
    const result3 = this.data.parse(JSON.stringify(result1));
    const result4 = this.data.fetch('https://api.example.com/metrics');
    
    return result1;
  }
}
// WARNING: Expensive operations called multiple times - consider Proxy pattern for caching

console.log('Pattern Dojo Demo - Check the problems panel for detected issues!');
