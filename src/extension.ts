import * as vscode from 'vscode';
import { PatternAnalyzer } from './analyzer/patternAnalyzer';
import { patternRegistry } from './analyzer/patternRegistry';
import PatternCodeActionProvider, { PatternCodeActionProvider as PatternCodeActionProviderClass } from './codeActions/patternCodeActions';
import { createBuiltInProviders } from './patterns';

let analyzer: PatternAnalyzer;
let disposables: vscode.Disposable[] = [];

/**
 * Activate the extension
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Pattern Dojo extension is now active!');

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
    vscode.commands.registerCommand('pattern-dojo.refresh', refreshAnalysis),
    vscode.commands.registerCommand('pattern-dojo.reportIssue', reportIssue),
    vscode.commands.registerCommand('pattern-dojo.disablePatternWorkspace', disablePatternWorkspace),
    vscode.commands.registerCommand('pattern-dojo.setPatternSeverityWorkspace', setPatternSeverityWorkspace),
    vscode.commands.registerCommand('pattern-dojo.managePatterns', managePatterns)
  );

  // Analyze current open files
  analyzer.analyzeAllDocuments().catch(console.error);

  // Listen for document changes
  disposables.push(
    vscode.workspace.onDidOpenTextDocument(onDocumentOpen),
    vscode.workspace.onDidChangeTextDocument(onDocumentChange),
    vscode.workspace.onDidChangeConfiguration(onConfigurationChange),
    vscode.workspace.onDidCloseTextDocument(onDocumentClose)
  );

  // Add disposables to context
  context.subscriptions.push(...disposables);
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
  await analyzer.analyzeDocument(document);
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
    analyzer.analyzeDocument(event.document).catch(console.error);
  }, 500); // Debounce 500ms
}

/**
 * Handle configuration change event
 */
async function onConfigurationChange() {
  analyzer.reloadConfig();
  await analyzer.analyzeAllDocuments();
}

/**
 * Handle document close event
 */
function onDocumentClose(document: vscode.TextDocument) {
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
    const cfg = vscode.workspace.getConfiguration('pattern-dojo');
    const patterns = cfg.get<string[]>('patterns') || [];
    const updated = patterns.filter(p => p !== patternKey);
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
    const cfg = vscode.workspace.getConfiguration('pattern-dojo');
    const map = cfg.get<Record<string, string>>('patternSeverities') || {};
    map[String(patternCode)] = severity;
    await cfg.update('patternSeverities', map, vscode.ConfigurationTarget.Workspace);
    vscode.window.showInformationMessage(`Set severity for '${patternCode}' to ${severity} in workspace settings.`);
  } catch (e) {
    vscode.window.showErrorMessage('Failed to update pattern severity.');
  }
}

/**
 * Manage enabled patterns via quick pick
 */
async function managePatterns() {
  const cfg = vscode.workspace.getConfiguration('pattern-dojo');
  const available = patternRegistry.getAvailablePatterns();
  const enabled = cfg.get<string[]>('patterns') || [];
  const picks = await vscode.window.showQuickPick(
    available.map(p => ({ label: p, picked: enabled.includes(p) })),
    { canPickMany: true, placeHolder: 'Select enabled patterns' }
  );
  if (!picks) return;
  const selected = picks.map(p => p.label);
  try {
    await cfg.update('patterns', selected, vscode.ConfigurationTarget.Workspace);
    vscode.window.showInformationMessage('Updated enabled patterns in workspace settings.');
  } catch (e) {
    vscode.window.showErrorMessage('Failed to update enabled patterns.');
  }
}
