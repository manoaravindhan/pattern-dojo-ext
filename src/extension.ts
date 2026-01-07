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

    // Register code action provider for supported languages
    const supported = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'java', 'python', 'csharp'];
    for (const lang of supported) {
      disposables.push(vscode.languages.registerCodeActionsProvider(lang, PatternCodeActionProvider, { providedCodeActionKinds: PatternCodeActionProviderClass.providedCodeActionKinds }));
    }

    // Register commands
    disposables.push(
      vscode.commands.registerCommand('pattern-lens.refresh', refreshAnalysis),
      vscode.commands.registerCommand('pattern-lens.reportIssue', reportIssue),
      vscode.commands.registerCommand('pattern-lens.disablePatternWorkspace', disablePatternWorkspace),
      vscode.commands.registerCommand('pattern-lens.setPatternSeverityWorkspace', setPatternSeverityWorkspace),
      vscode.commands.registerCommand('pattern-lens.managePatterns', managePatterns)
    );

    // Analyze current open files
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
            statusBarItem.text = '✅ Pattern Lens: Pass';
            statusBarItem.tooltip = 'No design pattern violations detected';
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }
    } else {
        statusBarItem.text = `$(alert) Pattern Lens: ${diagnostics.length} Issues`;
        statusBarItem.tooltip = 'Click to report false positives';
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
  const selected = await vscode.window.showQuickPick(patterns, {
    placeHolder: 'Select the pattern issue to report',
  });

  if (selected) {
    const message = await vscode.window.showInputBox({
      prompt: 'Describe the issue:',
      placeHolder: 'Enter your issue description...',
    });

    if (message) {
      vscode.window.showInformationMessage(
        `Issue reported for ${selected}: ${message}\n\nThank you for your feedback!`
      );
      // In a real implementation, this would send telemetry or create an issue
    }
  }
}

/**
 * Disable a pattern in workspace settings (patternCode: e.g. 'singleton-non-private-constructor')
 */
async function disablePatternWorkspace(patternCode: string) {
  try {
    const patternKey = String(patternCode).split('-')[0];
    const cfg = vscode.workspace.getConfiguration('pattern-lens');
    const patterns = cfg.get<Record<string, boolean>>('patterns') || {};
    // const updated = patterns.filter(p => p !== patternKey); // Old logic
    // Set to false in object
    const updated = { ...patterns };
    if (updated[patternKey] !== undefined) updated[patternKey] = false;
    
    await cfg.update('patterns', updated, vscode.ConfigurationTarget.Workspace);
    vscode.window.showInformationMessage(`Disabled pattern '${patternKey}' in workspace settings.`);
  } catch (e) {
    vscode.window.showErrorMessage('Failed to update workspace settings.');
  }
}

/**
 * Set per-pattern severity in workspace
 */
async function setPatternSeverityWorkspace(patternCode: string) {
  const severity = await vscode.window.showQuickPick(['error', 'warning', 'information'], { placeHolder: 'Select severity for the pattern' });
  if (!severity) return;
  try {
    const cfg = vscode.workspace.getConfiguration('pattern-lens');
    // For object-based severity, we update the object
    const map = cfg.get<Record<string, string>>('severity') || {};
    // map[String(patternCode)] = severity; // patternCode might include code, but config is by pattern name key
    // Actually patternAnalyzer uses provider.patternName as key. 
    // patternCode usually comes from diagnostic code e.g. 'singleton-public-constructor'.
    // We need to map code to pattern key.
    const key = String(patternCode).split('-')[0]; // simple heuristic
    map[key] = severity;

    await cfg.update('severity', map, vscode.ConfigurationTarget.Workspace);
    vscode.window.showInformationMessage(`Set severity for '${key}' to ${severity} in workspace settings.`);
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
  
  const picks = await vscode.window.showQuickPick(
    available.map(p => ({ label: p, picked: !!enabledMap[p] || (enabledMap[p] === undefined && true) })),
    { canPickMany: true, placeHolder: 'Select enabled patterns' }
  );
  if (!picks) return;
  
  const newMap: Record<string, boolean> = {};
  // default all to false or keep existing?
  // Logic: For selected, set true. For others, set false.
  available.forEach(p => newMap[p] = false);
  picks.forEach(p => newMap[p.label] = true);

  try {
    await cfg.update('patterns', newMap, vscode.ConfigurationTarget.Workspace);
    vscode.window.showInformationMessage('Updated enabled patterns in workspace settings.');
  } catch (e) {
    vscode.window.showErrorMessage('Failed to update enabled patterns.');
  }
}
