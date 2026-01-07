import * as vscode from 'vscode';
import { PatternAnalyzer } from './analyzer/patternAnalyzer';
import { patternRegistry } from './analyzer/patternRegistry';
import PatternCodeActionProvider, { PatternCodeActionProvider as PatternCodeActionProviderClass } from './codeActions/patternCodeActions';
import { createBuiltInProviders } from './patterns';
import { WelcomeViewProvider } from './views/welcomeViewProvider';

let analyzer: PatternAnalyzer;
let disposables: vscode.Disposable[] = [];
let statusBarItem: vscode.StatusBarItem;

/**
 * Activate the extension
 */
export async function activate(context: vscode.ExtensionContext) {
  try {
    console.log('Pattern Lens extension is now active!');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'pattern-lens.reportIssue';
    disposables.push(statusBarItem);

    // Register all built-in pattern providers
    const providers = createBuiltInProviders();
    for (const provider of providers) {
      patternRegistry.register(provider);
    }

    // Create analyzer
    analyzer = new PatternAnalyzer(patternRegistry);

    // Ensure analyzers and language parsers are initialized before first analysis
    await analyzer.init();

    // Register code action provider for supported languages (TS/JS only)
    const supported = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'];
    for (const lang of supported) {
      disposables.push(vscode.languages.registerCodeActionsProvider(lang, PatternCodeActionProvider, { providedCodeActionKinds: PatternCodeActionProviderClass.providedCodeActionKinds }));
    }

    // Register commands
    disposables.push(
      vscode.commands.registerCommand('pattern-lens.refresh', refreshAnalysis),
      vscode.commands.registerCommand('pattern-lens.reportIssue', reportIssue),
      vscode.commands.registerCommand('pattern-lens.disablePatternWorkspace', disablePatternWorkspace),
      vscode.commands.registerCommand('pattern-lens.enablePatternWorkspace', enablePatternWorkspace),
      vscode.commands.registerCommand('pattern-lens.setPatternSeverityWorkspace', setPatternSeverityWorkspace),
      vscode.commands.registerCommand('pattern-lens.managePatterns', managePatterns),
      vscode.commands.registerCommand('pattern-lens.toggleExtension', toggleExtension)
    );

    // Analyze current open files after initialization
    await analyzer.analyzeAllDocuments().catch(console.error);

    // Listen for document changes
    disposables.push(
      vscode.workspace.onDidOpenTextDocument(onDocumentOpen),
      vscode.workspace.onDidChangeTextDocument(onDocumentChange),
      vscode.workspace.onDidChangeConfiguration(onConfigurationChange),
      vscode.workspace.onDidCloseTextDocument(onDocumentClose)
    );

    // Add disposables to context
    context.subscriptions.push(...disposables);
  } catch (err) {
    console.error('Failed to activate Pattern Lens:', err);
    vscode.window.showErrorMessage(`Pattern Lens failed to activate: ${err}`);
  }
}

/**
 * Deactivate the extension
 */
export function deactivate() {
  analyzer?.dispose();
  disposables.forEach(d => d.dispose());
  disposables = [];
}

/**
 * Handle document open event
 */
async function onDocumentOpen(document: vscode.TextDocument) {
  await analyzeAndUpdateStatus(document);
}

/**
 * Handle document change event (debounced)
 */
let changeTimeout: NodeJS.Timeout | undefined;
async function onDocumentChange(event: vscode.TextDocumentChangeEvent) {
  if (changeTimeout) {
    clearTimeout(changeTimeout);
  }
  changeTimeout = setTimeout(() => {
    analyzeAndUpdateStatus(event.document).catch(console.error);
  }, 500); // Debounce 500ms
}

/**
 * Handle configuration change event
 */
async function onConfigurationChange() {
  analyzer.reloadConfig();
  await analyzer.analyzeAllDocuments();
  if (vscode.window.activeTextEditor) {
      await analyzeAndUpdateStatus(vscode.window.activeTextEditor.document);
  }
}

/**
 * Analyze document and update status bar
 */
async function analyzeAndUpdateStatus(document: vscode.TextDocument) {
    await analyzer.analyzeDocument(document);
    updateStatusBar(document);
}

/**
 * Update status bar based on diagnostics
 */
function updateStatusBar(document: vscode.TextDocument) {
    const diagnostics = analyzer.getDiagnostics(document.uri);
    if (!diagnostics || diagnostics.length === 0) {
        if (analyzer.isSupportedLanguage(document.languageId)) {
            statusBarItem.text = '$(check) Pattern Lens: Pass';
            statusBarItem.tooltip = 'No design pattern violations detected\n✓ All patterns validated successfully';
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }
    } else {
        const errors = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
        const warnings = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning).length;
        const info = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Information).length;

        const errorIcon = errors > 0 ? '$(error) ' : '';
        const warningIcon = warnings > 0 ? '$(warning) ' : '';
        
        statusBarItem.text = `${errorIcon}${warningIcon}Pattern Lens: ${diagnostics.length}`;
        
        let tooltipText = `Pattern Violations: ${diagnostics.length} issues found\n`;
        if (errors > 0) tooltipText += `  $(error) Errors: ${errors}\n`;
        if (warnings > 0) tooltipText += `  $(warning) Warnings: ${warnings}\n`;
        if (info > 0) tooltipText += `  $(info) Info: ${info}\n`;
        tooltipText += '\n💡 Click to see options';
        
        statusBarItem.tooltip = tooltipText;
        statusBarItem.show();
    }
}


/**
 * Handle document close event
 */
function onDocumentClose(_document: vscode.TextDocument) {
  // Diagnostics are automatically cleaned up
}

/**
 * Command: Refresh analysis
 */
async function refreshAnalysis() {
  if (vscode.window.activeTextEditor) {
    await analyzer.analyzeDocument(vscode.window.activeTextEditor.document);
    vscode.window.showInformationMessage('Pattern analysis refreshed!');
  }
}

/**
 * Command: Report issue
 */
async function reportIssue() {
  const patterns = patternRegistry.getAvailablePatterns();
  const selected = await vscode.window.showQuickPick(
    patterns.map(p => ({ label: p, description: 'Report an issue with this pattern' })),
    {
      placeHolder: '🎯 Select the pattern issue to report',
      matchOnDescription: true,
    }
  );

  if (!selected) return;

  const message = await vscode.window.showInputBox({
    prompt: 'Describe the issue:',
    placeHolder: 'e.g., False positive, incorrect detection, suggestion...',
    validateInput: (value) => {
      if (value.trim().length < 10) {
        return 'Please provide at least 10 characters';
      }
      return '';
    }
  });

  if (!message) return;

  vscode.window.showInformationMessage(
    `✅ Issue reported for "${selected.label}"`,
    'View GitHub',
    'Close'
  ).then(result => {
    if (result === 'View GitHub') {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/manoaravindhan/pattern-dojo-ext/issues'));
    }
  });
}

/**
 * Disable a pattern in workspace settings (patternCode: e.g. 'singleton-non-private-constructor')
 */
async function disablePatternWorkspace(patternCode?: string) {
  try {
    const available = patternRegistry.getAvailablePatterns();
    
    // If patternCode is not provided or invalid, let user select the pattern
    let patternKey = patternCode ? String(patternCode).split('-')[0] : undefined;
    
    if (!patternKey || !available.includes(patternKey)) {
      const selected = await vscode.window.showQuickPick(available, {
        placeHolder: 'Select pattern to disable',
      });
      
      if (!selected) return;
      patternKey = selected;
    }
    
    const cfg = vscode.workspace.getConfiguration('pattern-lens');
    const patterns = cfg.get<Record<string, boolean>>('patterns') || {};
    
    // Set to false in object
    const updated = { ...patterns };
    if (updated[patternKey] !== undefined) updated[patternKey] = false;
    
    await cfg.update('patterns', updated, vscode.ConfigurationTarget.Workspace);
    vscode.window.showInformationMessage(
      `✓ Disabled pattern "${patternKey}" in workspace settings`,
      'Undo'
    ).then(result => {
      if (result === 'Undo') {
        updated[patternKey] = true;
        cfg.update('patterns', updated, vscode.ConfigurationTarget.Workspace);
      }
    });
  } catch (e) {
    vscode.window.showErrorMessage('Failed to update workspace settings.');
  }
}

/**
 * Enable a pattern in workspace settings
 */
async function enablePatternWorkspace(patternCode?: string) {
  try {
    const available = patternRegistry.getAvailablePatterns();
    
    // If patternCode is not provided or invalid, let user select the pattern
    let patternKey = patternCode ? String(patternCode).split('-')[0] : undefined;
    
    if (!patternKey || !available.includes(patternKey)) {
      const selected = await vscode.window.showQuickPick(available, {
        placeHolder: 'Select pattern to enable',
      });
      
      if (!selected) return;
      patternKey = selected;
    }
    
    const cfg = vscode.workspace.getConfiguration('pattern-lens');
    const patterns = cfg.get<Record<string, boolean>>('patterns') || {};
    
    // Set to true in object
    const updated = { ...patterns };
    if (updated[patternKey] !== undefined) updated[patternKey] = true;
    
    await cfg.update('patterns', updated, vscode.ConfigurationTarget.Workspace);
    vscode.window.showInformationMessage(
      `✓ Enabled pattern "${patternKey}" in workspace settings`,
      'Undo'
    ).then(result => {
      if (result === 'Undo') {
        updated[patternKey] = false;
        cfg.update('patterns', updated, vscode.ConfigurationTarget.Workspace);
      }
    });
  } catch (e) {
    vscode.window.showErrorMessage('Failed to update workspace settings.');
  }
}

/**
 * Set per-pattern severity in workspace
 */
async function setPatternSeverityWorkspace(patternCode?: string) {
  const cfg = vscode.workspace.getConfiguration('pattern-lens');
  const available = patternRegistry.getAvailablePatterns();
  
  // If patternCode is not provided or invalid, let user select the pattern
  let key = patternCode ? String(patternCode).split('-')[0] : undefined;
  
  if (!key || !available.includes(key)) {
    const selected = await vscode.window.showQuickPick(available, {
      placeHolder: 'Select pattern to set severity',
    });
    
    if (!selected) return;
    key = selected;
  }

  const severityOptions = [
    { label: '$(error) Error', description: 'Critical pattern violations', detail: 'Breaks the build' },
    { label: '$(warning) Warning', description: 'Significant pattern issues', detail: 'Needs attention' },
    { label: '$(info) Information', description: 'Minor pattern suggestions', detail: 'Just informational' }
  ];

  const severity = await vscode.window.showQuickPick(
    severityOptions,
    { 
      placeHolder: 'Select severity level for this pattern',
      matchOnDescription: true
    }
  );
  
  if (!severity) return;
  
  const severityValue = severity.label.split(' ')[1].toLowerCase();

  try {
    const map = cfg.get<Record<string, string>>('severity') || {};
    map[key] = severityValue;

    await cfg.update('severity', map, vscode.ConfigurationTarget.Workspace);
    vscode.window.showInformationMessage(
      `✓ Set severity for "${key}" to ${severityValue} in workspace settings`
    );
  } catch (e) {
    vscode.window.showErrorMessage('Failed to update pattern severity.');
  }
}

/**
 * Manage enabled patterns via quick pick
 */
async function managePatterns() {
  const cfg = vscode.workspace.getConfiguration('pattern-lens');
  const available = patternRegistry.getAvailablePatterns();
  const enabledMap = cfg.get<Record<string, boolean>>('patterns') || {};
  
  const patternDescriptions: Record<string, string> = {
    'singleton': 'Detects singleton pattern violations and constructor issues',
    'factory': 'Suggests factory pattern where beneficial',
    'observer': 'Finds unsubscribed event listeners and cleanup issues',
    'strategy': 'Detects long if-else chains that could use strategies',
    'decorator': 'Warns about decorator hierarchy complexity',
    'adapter': 'Identifies adapter anti-patterns',
    'facade': 'Detects facade complexity violations',
    'proxy': 'Suggests proxy pattern opportunities'
  };

  const picks = await vscode.window.showQuickPick(
    available.map(p => ({ 
      label: p, 
      description: patternDescriptions[p] || 'Pattern analyzer',
      picked: !!enabledMap[p] || (enabledMap[p] === undefined && true) 
    })),
    { 
      canPickMany: true, 
      placeHolder: '✓ Select patterns to enable (Space to toggle)' 
    }
  );
  
  if (!picks) return;
  
  const newMap: Record<string, boolean> = {};
  available.forEach(p => newMap[p] = false);
  picks.forEach(p => newMap[p.label] = true);

  try {
    await cfg.update('patterns', newMap, vscode.ConfigurationTarget.Workspace);
    const enabledCount = picks.length;
    vscode.window.showInformationMessage(
      `✓ Updated patterns (${enabledCount}/${available.length} enabled)`
    );
  } catch (e) {
    vscode.window.showErrorMessage('Failed to update enabled patterns.');
  }
}

/**
 * Toggle global extension enable/disable
 */
async function toggleExtension() {
  try {
    const cfg = vscode.workspace.getConfiguration('pattern-lens');
    const currentEnabled = cfg.get<boolean>('enabled') ?? true;
    const newEnabled = !currentEnabled;

    await cfg.update('enabled', newEnabled, vscode.ConfigurationTarget.Workspace);
    
    const status = newEnabled ? 'enabled' : 'disabled';
    vscode.window.showInformationMessage(
      `✓ Pattern Lens ${status}`
    );
  } catch (e) {
    vscode.window.showErrorMessage('Failed to toggle Pattern Lens.');
  }
}
