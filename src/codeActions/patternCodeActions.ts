import * as vscode from 'vscode';

export class PatternCodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      const code = typeof diagnostic.code === 'string' ? diagnostic.code : String(diagnostic.code);

      // Specific fixes
      if (code === 'singleton-non-private-constructor') {
        const title = 'Make constructor private';
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.isPreferred = true;
        action.edit = this.makeConstructorPrivateEdit(document, diagnostic.range);
        actions.push(action);
      } else if (code === 'singleton-implicit-public-constructor') {
        const title = 'Add private constructor';
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.isPreferred = true;
        action.edit = this.addPrivateConstructorEdit(document, diagnostic.range);
        actions.push(action);
      }

      // Additional targeted quick fixes
      if (code === 'facade-complex-interface') {
        const title = 'Add Facade TODO';
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.edit = this.addFacadeTodoEdit(document, diagnostic.range);
        actions.push(action);
      }

      if (code === 'factory-multiple-instantiation') {
        const title = 'Add Factory TODO';
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.edit = this.addFactoryTodoEdit(document, diagnostic.range);
        actions.push(action);
      }

      if (code === 'proxy-expensive-operation') {
        const title = 'Add caching TODO';
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.edit = this.addProxyTodoEdit(document, diagnostic.range);
        actions.push(action);
      }

      // Generic actions for all pattern-dojo diagnostics
      if (String(code).startsWith('singleton') || String(code).startsWith('factory') || String(code).startsWith('decorator') || String(code).startsWith('adapter') || String(code).startsWith('proxy') || String(code).startsWith('facade') || String(code).startsWith('observer') || String(code).startsWith('strategy')) {
        // Suppress next-line
        const suppressTitle = 'Suppress pattern-dojo for next line';
        const suppress = new vscode.CodeAction(suppressTitle, vscode.CodeActionKind.QuickFix);
        suppress.diagnostics = [diagnostic];
        suppress.edit = this.addSuppressNextLineEdit(document, diagnostic.range);
        actions.push(suppress);

        // Disable pattern in workspace settings
        const disableTitle = `Disable pattern '${code}' in workspace`; 
        const disableAction = new vscode.CodeAction(disableTitle, vscode.CodeActionKind.QuickFix);
        disableAction.diagnostics = [diagnostic];
        disableAction.command = {
          title: disableTitle,
          command: 'pattern-dojo.disablePatternWorkspace',
          arguments: [String(code)],
        };
        actions.push(disableAction);
      }
    }

    return actions;
  }

  // Make constructor declaration private by inserting 'private ' before 'constructor'
  private makeConstructorPrivateEdit(document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit {
    const edit = new vscode.WorkspaceEdit();
    const startOffset = document.offsetAt(range.start);
    const text = document.getText();
    // Find 'constructor' token within the diagnostic range
    const sub = text.substring(startOffset, document.offsetAt(range.end));
    const idx = sub.indexOf('constructor');
    if (idx >= 0) {
      const insertPos = document.positionAt(startOffset + idx);
      edit.insert(document.uri, insertPos, 'private ');
    } else {
      // fallback: insert at range start
      edit.insert(document.uri, range.start, 'private ');
    }
    return edit;
  }

  // Add a private constructor stub inside the class body
  private addPrivateConstructorEdit(document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit {
    const edit = new vscode.WorkspaceEdit();
    const startOffset = document.offsetAt(range.start);
    const text = document.getText();
    // Find the opening brace of the class starting from range.start
    const braceIdx = text.indexOf('{', startOffset);
    if (braceIdx >= 0) {
      const insertPos = document.positionAt(braceIdx + 1);
      const indent = this.detectIndentationAt(document, insertPos);
      const constructorSnippet = `\n${indent}private constructor() {\n${indent}  // private constructor for singleton\n${indent}}\n`;
      edit.insert(document.uri, insertPos, constructorSnippet);
    } else {
      // fallback: insert at end of range
      edit.insert(document.uri, range.end, '\nprivate constructor() {}\n');
    }
    return edit;
  }

  private addSuppressNextLineEdit(document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit {
    const edit = new vscode.WorkspaceEdit();
    const line = range.start.line;
    const pos = new vscode.Position(line, 0);
    const langId = document.languageId;
    const comment = langId === 'python' ? '# pattern-dojo-disable-next-line\n' : '// pattern-dojo-disable-next-line\n';
    edit.insert(document.uri, pos, comment);
    return edit;
  }

  // Quick fixes for specific diagnostics
  private addFacadeTodoEdit(document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit {
    const edit = new vscode.WorkspaceEdit();
    const line = range.start.line;
    const pos = new vscode.Position(line, 0);
    edit.insert(document.uri, pos, '// TODO: Consider creating a Facade to simplify this interface\n');
    return edit;
  }

  private addFactoryTodoEdit(document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit {
    const edit = new vscode.WorkspaceEdit();
    const line = range.start.line;
    const pos = new vscode.Position(line, 0);
    edit.insert(document.uri, pos, '// TODO: Consider using a Factory to centralize instantiation\n');
    return edit;
  }

  private addProxyTodoEdit(document: vscode.TextDocument, range: vscode.Range): vscode.WorkspaceEdit {
    const edit = new vscode.WorkspaceEdit();
    const line = range.start.line;
    const pos = new vscode.Position(line, 0);
    edit.insert(document.uri, pos, '// TODO: Consider caching or lazy-loading this expensive operation\n');
    return edit;
  }

  private detectIndentationAt(document: vscode.TextDocument, pos: vscode.Position): string {
    const lineText = document.lineAt(pos.line).text;
    const match = lineText.match(/^\s*/);
    return match ? match[0] : '  ';
  }
}

export default new PatternCodeActionProvider();
