# Pattern Dojo Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    VS CODE EXTENSION                         │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              extension.ts (Main Entry)                 │  │
│  │                                                         │  │
│  │  • Activates extension on startup                     │  │
│  │  • Registers all pattern providers                    │  │
│  │  • Listens to document events                         │  │
│  │  • Registers VS Code commands                         │  │
│  └──────────────┬──────────────────────────────────────┬─┘  │
│                 │                                        │    │
│                 ▼                                        ▼    │
│  ┌──────────────────────────┐       ┌─────────────────────┐ │
│  │  PatternAnalyzer         │       │  PatternRegistry    │ │
│  │                          │       │                     │ │
│  │ • Analyzes documents     │       │ • Registers         │ │
│  │ • Reports diagnostics    │       │   providers         │ │
│  │ • Manages config         │◄──────┤ • Lookup providers  │ │
│  │ • Handles VS Code        │       │ • Coordinates       │ │
│  │   integration            │       │   analysis          │ │
│  └──────────────┬───────────┘       └─────────────────────┘ │
│                 │                                             │
│                 ▼                                             │
│  ┌──────────────────────────────────────────────────────┐    │
│  │        PatternProvider Interface (Plugins)            │    │
│  │                                                        │    │
│  │  • name: string                                        │    │
│  │  • description: string                                 │    │
│  │  • patternName: string                                 │    │
│  │  • analyze(document): PatternViolation[]              │    │
│  └──────────────────────────────────────────────────────┘    │
│                          ▲                                     │
│         ┌────────────────┼────────────────┬──────────────┐    │
│         │                │                │              │    │
│         ▼                ▼                ▼              ▼    │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌────────┐  │
│  │ Singleton  │ │  Factory   │ │  Observer    │ │Strategy│  │
│  │  Provider  │ │  Provider  │ │  Provider    │ │Provider│  │
│  └────────────┘ └────────────┘ └──────────────┘ └────────┘  │
│                                                                │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌────────┐  │
│  │ Decorator  │ │  Adapter   │ │  Facade      │ │ Proxy  │  │
│  │  Provider  │ │  Provider  │ │  Provider    │ │Provider│  │
│  └────────────┘ └────────────┘ └──────────────┘ └────────┘  │
│                                                                │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
         ┌──────────────────────────────────┐
         │   VS Code Diagnostic API         │
         │   (Problems Panel Display)        │
         └──────────────────────────────────┘
```

## Data Flow

```
1. INITIALIZATION
   ┌──────────────┐
   │ Extension    │
   │ Activation   │
   └──────┬───────┘
          │
          ▼
   ┌────────────────────┐
   │ Register All       │
   │ Pattern Providers  │
   └──────┬─────────────┘
          │
          ▼
   ┌────────────────────┐
   │ Create Analyzer    │
   │ Instance           │
   └──────┬─────────────┘
          │
          ▼
   ┌────────────────────┐
   │ Listen for Events  │
   │ (onOpen, onChange) │
   └────────────────────┘

2. DOCUMENT ANALYSIS
   ┌──────────────────┐
   │ Document Event   │
   │ Triggered        │
   └──────┬───────────┘
          │
          ▼
   ┌──────────────────────────┐
   │ Check if Supported       │
   │ Language                 │
   └──────┬───────────────────┘
          │
      Yes │
          ▼
   ┌──────────────────────────┐
   │ Get Enabled Patterns     │
   │ from Config              │
   └──────┬───────────────────┘
          │
          ▼
   ┌──────────────────────────┐
   │ Get Providers from       │
   │ Registry                 │
   └──────┬───────────────────┘
          │
          ▼
   ┌──────────────────────────┐
   │ Run Analyze on Each      │
   │ Provider                 │
   └──────┬───────────────────┘
          │
          ▼
   ┌──────────────────────────┐
   │ Collect All Violations   │
   └──────┬───────────────────┘
          │
          ▼
   ┌──────────────────────────┐
   │ Convert to Diagnostics   │
   │ Objects                  │
   └──────┬───────────────────┘
          │
          ▼
   ┌──────────────────────────┐
   │ Report to VS Code        │
   │ Diagnostics API          │
   └──────────────────────────┘
```

## Pattern Detection Flow

```
PatternProvider.analyze(document)
         │
         ▼
    ┌─────────────────────────┐
    │ Get document text       │
    └──────┬──────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ Use regex/text matching      │
    │ to find pattern violations   │
    └──────┬───────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ For each match:              │
    │ • Get position in doc        │
    │ • Create range              │
    │ • Create violation object    │
    └──────┬───────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ Return array of violations   │
    └──────────────────────────────┘
           │
           ▼
    ┌──────────────────────────────┐
    │ Analyzer collects results    │
    │ from all providers           │
    └──────────────────────────────┘
```

## Class Relationships

```
┌────────────────────────────────────┐
│      PatternProvider (IF)          │ ◄─── All patterns implement this
│                                    │
│ + name: string                     │
│ + description: string              │
│ + patternName: string              │
│ + analyze(doc): Violation[]        │
└────────────────────────────────────┘
         ▲
         │ implements
         │
    ┌────┴─────┬──────────┬──────────┐
    │           │          │          │
    ▼           ▼          ▼          ▼
Singleton  Factory  Observer  Strategy
Provider   Provider  Provider  Provider
    │           │          │          │
    └────┬─────┴──────────┴──────────┘
         │
         ▼
    ┌──────────────────┐
    │ PatternRegistry  │
    │                  │
    │ - providers Map  │ ◄─── Stores all providers
    │ + register()     │
    │ + getProvider()  │
    │ + analyze()      │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────┐
    │ PatternAnalyzer      │
    │                      │
    │ - registry           │ ◄─── Uses registry
    │ + analyzeDocument()  │
    │ + analyzeAllDocs()   │
    └──────────────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ extension.ts         │
    │                      │
    │ - analyzer           │ ◄─── Uses analyzer
    │ + activate()         │
    │ + deactivate()       │
    └──────────────────────┘
```

## Configuration & Event Flow

```
┌──────────────────────────────────┐
│    VS Code Settings              │
│ (.vscode/settings.json or user)  │
└─────────────┬────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│ configuration.get('pattern-dojo')│
└─────────────┬────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│ PatternAnalyzer.loadConfig()     │
└─────────────┬────────────────────┘
              │
        ┌─────┴─────┬──────────┐
        │            │          │
        ▼            ▼          ▼
     enabled     patterns    severity
        │            │          │
        └────────┬───┴──────┬───┘
                 │          │
                 ▼          ▼
        ┌──────────────────────┐
        │   AnalysisConfig     │
        └──────┬───────────────┘
               │
         ┌─────┴──────────┐
         │                │
         ▼                ▼
    Analyze if      Filter patterns
    enabled = true  by name
         │                │
         └────────┬───────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Generate Issues  │
         │ with configured  │
         │ severity level   │
         └──────────────────┘

EVENT LISTENERS:
━━━━━━━━━━━━━━━━
onDidOpenTextDocument    ──► analyzeDocument()
onDidChangeTextDocument  ──► analyzeDocument() [debounced 500ms]
onDidChangeConfiguration ──► reloadConfig() + analyzeAllDocuments()
onDidCloseTextDocument   ──► [auto cleanup]
```

## Extension Lifecycle

```
ACTIVATION:
───────────
1. activate() called
2. Create & register providers
3. Create analyzer
4. Register commands
5. Listen for events
6. Analyze open docs

RUNNING:
────────
1. Listen for document events
2. Debounce changes (500ms)
3. Analyze document
4. Report violations
5. Update diagnostics

DEACTIVATION:
──────────────
1. deactivate() called
2. Dispose analyzer
3. Clear diagnostics
4. Dispose all listeners
5. Clean up resources
```

## Plugin Architecture Pattern

```
Core (Immutable)
├── PatternProvider Interface
│   └── Simple contract: analyze(doc) -> violations[]
│
├── PatternRegistry
│   └── Manages provider lifecycle
│
└── PatternAnalyzer
    └── Coordinates all providers

Plugins (Extensible)
├── SingletonPatternProvider
├── FactoryPatternProvider
├── ObserverPatternProvider
├── StrategyPatternProvider
├── DecoratorPatternProvider
├── AdapterPatternProvider
├── FacadePatternProvider
└── ProxyPatternProvider

Adding New Pattern:
1. Create class implementing PatternProvider
2. Add to createBuiltInProviders()
3. Done! No core changes needed
```

## Performance Characteristics

```
Analysis Timing:
┌──────────────────────────────────┐
│ Event triggered                  │
└─────────────┬────────────────────┘
              │
              ▼
        [debounce 500ms]
              │
              ▼
┌──────────────────────────────────┐
│ Check language (instant)         │
└─────────────┬────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│ Run all providers (parallel-ish) │
│ • Regex matching: ~10-50ms       │
│ • Total: ~50-200ms               │
└─────────────┬────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│ Report diagnostics (instant)     │
└──────────────────────────────────┘

Overall: 500ms debounce + 50-200ms analysis
Result: ~500-700ms total from change to display
```

This architecture enables:
- ✅ Scalability (add patterns easily)
- ✅ Maintainability (clear separation)
- ✅ Testability (mockable components)
- ✅ Performance (debounced, lazy)
- ✅ Extensibility (plugin interface)
