import * as vscode from 'vscode';
import * as path from 'path';

export class WelcomeViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'pattern-dojo.welcome';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.type) {
        case 'openFile':
          vscode.commands.executeCommand('vscode.open', vscode.Uri.file(data.file));
          break;
        case 'openSettings':
          vscode.commands.executeCommand('workbench.action.openSettings', '@ext:pattern-dojo');
          break;
        case 'runExample':
          vscode.commands.executeCommand('pattern-dojo.refresh');
          break;
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'media', 'welcome.css')
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pattern Dojo Welcome</title>
    <link rel="stylesheet" href="${styleUri}">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            padding: 20px;
        }
        
        .container {
            max-width: 400px;
            margin: 0 auto;
        }
        
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 24px;
        }
        
        .logo {
            width: 48px;
            height: 48px;
            margin-right: 12px;
            background: linear-gradient(135deg, #4A90E2 0%, #7ED321 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        
        .title {
            font-size: 20px;
            font-weight: 600;
            margin: 0;
        }
        
        .subtitle {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin: 4px 0 0 0;
        }
        
        .section {
            margin-bottom: 24px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
        }
        
        .section-content {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 6px;
            padding: 12px;
        }
        
        .feature-list {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        
        .feature-list li {
            padding: 8px 0;
            font-size: 13px;
            display: flex;
            align-items: center;
        }
        
        .feature-list li:before {
            content: "✓";
            color: #7ED321;
            font-weight: bold;
            margin-right: 8px;
            display: inline-block;
            width: 16px;
        }
        
        .button-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .button {
            padding: 10px 16px;
            border: 1px solid var(--vscode-button-border);
            border-radius: 4px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background-color 0.2s;
            text-align: center;
        }
        
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .button.secondary {
            background-color: transparent;
            border-color: var(--vscode-button-border);
        }
        
        .button.secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .link {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
            cursor: pointer;
        }
        
        .link:hover {
            text-decoration: underline;
        }
        
        .tip {
            background-color: var(--vscode-notebook-cellHint-background);
            border-left: 3px solid var(--vscode-notebookStatusSuccessIcon-foreground);
            padding: 12px;
            border-radius: 4px;
            font-size: 12px;
            margin-top: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎯</div>
            <div>
                <h1 class="title">Pattern Dojo</h1>
                <p class="subtitle">Design Pattern Detector</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">What it does</div>
            <div class="section-content">
                <p style="margin: 0 0 12px 0; font-size: 13px;">
                    Pattern Dojo automatically detects design pattern violations and anti-patterns in your code.
                </p>
                <ul class="feature-list">
                    <li>Singleton issues</li>
                    <li>Factory pattern suggestions</li>
                    <li>Observer cleanup detection</li>
                    <li>Strategy pattern detection</li>
                    <li>Decorator hierarchy warnings</li>
                    <li>Adapter anti-patterns</li>
                    <li>Facade complexity detection</li>
                    <li>Proxy opportunities</li>
                </ul>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Getting Started</div>
            <div class="section-content">
                <div class="button-group">
                    <button class="button" onclick="openSettings()">
                        Open Settings
                    </button>
                    <button class="button secondary" onclick="runExample()">
                        Run Example
                    </button>
                </div>
                <div class="tip">
                    💡 Open any JavaScript, TypeScript, Java, Python, or C# file to start analysis.
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Resources</div>
            <div class="section-content">
                <p style="margin: 0; font-size: 13px; line-height: 1.8;">
                    <a class="link" href="https://github.com/manoaravindhan/pattern-dojo-ext">GitHub Repository</a><br>
                    <a class="link" onclick="viewDocs()">Documentation</a>
                </p>
            </div>
        </div>
    </div>

    <script>
        function openSettings() {
            vscode.postMessage({ type: 'openSettings' });
        }

        function runExample() {
            vscode.postMessage({ type: 'runExample' });
        }

        function viewDocs() {
            vscode.postMessage({ 
                type: 'openFile',
                file: '\${vscode.Uri.joinPath(extensionUri, 'GETTING_STARTED.md')}'
            });
        }

        const vscode = acquireVsCodeApi();
    </script>
</body>
</html>`;
  }
}
