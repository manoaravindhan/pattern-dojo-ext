/**
 * Pattern Lens - Example Code Demonstrating Design Pattern Issues (JavaScript)
 * 
 * This file contains various code patterns that Pattern Lens will detect and highlight.
 * Open this file in VS Code with the Pattern Lens extension enabled to see the detection in action.
 */

// ============================================================================
// SINGLETON PATTERN - Issues
// ============================================================================

class Database {
  static instance = new Database();
  
  // Issue: Constructor should be private (or accessible only via getInstance)
  // In JS, we can't easily enforce private constructors, but Pattern Lens checks structure
  constructor() {
    console.log('Database instance created');
  }

  static getInstance() {
    return Database.instance;
  }
}

// Usage that violates singleton principle
const db1 = new Database();
const db2 = new Database();

// ============================================================================
// FACTORY PATTERN - Issues  
// ============================================================================

class Dog {
  constructor(name) {
    this.name = name;
  }
}

class Cat {
  constructor(name) {
    this.name = name;
  }
}

// Creating instances in multiple places - could use factory
class AnimalTrainer {
  constructor() {
    this.animals = [];
  }

  addDog(name) {
    this.animals.push(new Dog(name)); // Instance creation
  }

  addCat(name) {
    this.animals.push(new Cat(name)); // Instance creation
  }

  createRandomAnimal(name) {
    if (Math.random() > 0.5) {
      this.animals.push(new Dog(name)); // Repeated instantiation
    } else {
      this.animals.push(new Cat(name)); // Repeated instantiation
    }
  }
}

// ============================================================================
// OBSERVER PATTERN - Issues
// ============================================================================

class EventManager {
  constructor() {
    this.listeners = new Map();
  }

  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
    // WARNING: No corresponding unsubscribe mechanism shown or returned
  }

  setupDOMListeners() {
    // Event listener added but not tracked for removal
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize);
    }
  }

  handleResize(e) {
    console.log('Resizing...', e);
  }
}

// ============================================================================
// STRATEGY PATTERN - Issues
// ============================================================================

class OrderProcessor {
  processOrder(orderType, amount) {
    // Long conditional chain - candidate for Strategy pattern
    if (orderType === 'credit_card') {
      console.log('Processing credit card payment');
      return amount * 1.02;
    } else if (orderType === 'paypal') {
      console.log('Processing PayPal payment');
      return amount * 1.03;
    } else if (orderType === 'crypto') {
      console.log('Processing Crypto payment');
      return amount * 1.0;
    } else if (orderType === 'bank_transfer') {
      console.log('Processing Bank Transfer');
      return amount * 1.01;
    } else if (orderType === 'cash') {
      console.log('Processing Cash');
      return amount; 
    } else {
      console.log('Unknown payment method');
      return amount;
    }
  }
}

// ============================================================================
// FACADE PATTERN - Issues
// ============================================================================

class ComplexSystem {
  // Too many public methods - simple interface needed?
  initialize() { console.log('Init'); }
  loadConfig() { console.log('Loading'); }
  connectDB() { console.log('Connecting DB'); }
  connectCache() { console.log('Connecting Cache'); }
  startServer() { console.log('Starting Server'); }
  setupRoutes() { console.log('Routes'); }
  setupMiddleware() { console.log('Middleware'); }
  startCronJobs() { console.log('Cron'); }
  warmupCache() { console.log('Warmup'); }
  monitorHealth() { console.log('Monitoring'); }
  logAccess() { console.log('Logging'); }
  optimize() { console.log('Optimizing'); }
  backup() { console.log('Backup'); }
}

// ============================================================================
// PROXY PATTERN - Issues
// ============================================================================

class DataFetcher {
  fetchData(url) {
    // Expensive operation called directly every time
    // Should use Proxy to cache results
    console.log(`Fetching data from ${url} (Expensive Operation)`);
    // Imagine a generic synchronous network request here
    const start = Date.now();
    while (Date.now() - start < 100) {} // Simulating delay
    return { data: 'Sample Data', timestamp: Date.now() };
  }
}

const fetcher = new DataFetcher();
// Called multiple times with same args - candidate for caching proxy
fetcher.fetchData('https://api.example.com/data');
fetcher.fetchData('https://api.example.com/data');
fetcher.fetchData('https://api.example.com/data');
