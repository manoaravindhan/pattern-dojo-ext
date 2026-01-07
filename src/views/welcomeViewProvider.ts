import * as vscode from 'vscode';

export class WelcomeViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'pattern-lens.welcome';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
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
          try {
            const target = vscode.Uri.joinPath(this._extensionUri, data.file);
            vscode.commands.executeCommand('vscode.open', target);
          } catch (e) {
            console.error('[WelcomeView] Failed to open file:', e);
          }
          break;
        case 'openSettings':
          vscode.commands.executeCommand('workbench.action.openSettings', '@ext:pattern-lens');
          break;
        case 'openSettingsUI':
          vscode.commands.executeCommand('pattern-lens.managePatterns');
          break;
        case 'runExample':
          vscode.commands.executeCommand('pattern-lens.refresh');
          break;
        case 'openDocs':
          vscode.env.openExternal(vscode.Uri.parse('https://github.com/manoaravindhan/pattern-dojo-ext/wiki'));
          break;
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pattern Lens</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary: #4A90E2;
            --success: #7ED321;
            --warning: #FF9800;
            --error: #F44336;
            --neutral-light: rgba(255, 255, 255, 0.05);
            --neutral-border: rgba(255, 255, 255, 0.1);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: var(--vscode-sideBar-background);
            color: var(--vscode-foreground);
            line-height: 1.6;
            padding: 16px 12px;
            overflow-y: auto;
        }

        .container {
            max-width: 100%;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        /* Header Section */
        .header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--success) 100%);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .logo {
            font-size: 32px;
            line-height: 1;
        }

        .header-content h1 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 4px;
            color: white;
        }

        .header-content p {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.9);
        }

        /* Card Style */
        .card {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 8px;
            padding: 12px;
            transition: all 0.2s ease;
        }

        .card:hover {
            border-color: var(--primary);
            box-shadow: 0 2px 8px rgba(74, 144, 226, 0.1);
        }

        .card-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .card-icon {
            font-size: 14px;
        }

        /* Feature List */
        .feature-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 8px;
        }

        .feature-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background-color: var(--neutral-light);
            border-radius: 4px;
            font-size: 12px;
            transition: background-color 0.2s;
        }

        .feature-item:hover {
            background-color: rgba(74, 144, 226, 0.15);
        }

        .feature-icon {
            flex-shrink: 0;
            font-size: 14px;
        }

        /* Button Styles */
        .button-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .button {
            padding: 10px 14px;
            border: 1px solid var(--vscode-button-border);
            border-radius: 4px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .button:active {
            transform: translateY(0);
        }

        .button.secondary {
            background-color: transparent;
            border-color: var(--vscode-button-border);
            color: var(--vscode-textLink-foreground);
        }

        .button.secondary:hover {
            background-color: var(--neutral-light);
        }

        .button.primary {
            background-color: var(--primary);
            border-color: var(--primary);
            color: white;
        }

        .button.primary:hover {
            background-color: #3b7ac9;
        }

        /* Info Box */
        .info-box {
            background-color: var(--neutral-light);
            border-left: 3px solid var(--primary);
            padding: 10px;
            border-radius: 4px;
            font-size: 11px;
            line-height: 1.5;
            margin-top: 8px;
        }

        .info-box.success {
            border-left-color: var(--success);
            background-color: rgba(126, 211, 33, 0.1);
        }

        .info-box.warning {
            border-left-color: var(--warning);
            background-color: rgba(255, 152, 0, 0.1);
        }

        .info-box.error {
            border-left-color: var(--error);
            background-color: rgba(244, 67, 54, 0.1);
        }

        /* Stats Section */
        .stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 8px;
        }

        .stat {
            background-color: var(--neutral-light);
            padding: 10px;
            border-radius: 4px;
            text-align: center;
        }

        .stat-value {
            font-size: 18px;
            font-weight: 600;
            color: var(--primary);
        }

        .stat-label {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }

        /* Links */
        .link {
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
            cursor: pointer;
            transition: opacity 0.2s;
        }

        .link:hover {
            opacity: 0.8;
            text-decoration: underline;
        }

        /* Icon indicators */
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 600;
            background-color: var(--primary);
            color: white;
        }

        .badge.warning {
            background-color: var(--warning);
        }

        .badge.success {
            background-color: var(--success);
        }

        /* Responsive */
        @media (max-width: 300px) {
            .button-group {
                gap: 6px;
            }

            .button {
                padding: 8px 12px;
                font-size: 11px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">🎯</div>
            <div class="header-content">
                <h1>Pattern Lens</h1>
                <p>Design Pattern Analyzer</p>
            </div>
        </div>

        <!-- Quick Start Card -->
        <div class="card">
            <div class="card-title">
                <span class="card-icon">⚡</span>
                Quick Start
            </div>
            <div class="button-group">
                <button class="button primary" onclick="runAnalysis()">
                    🔍 Analyze Current File
                </button>
                <button class="button secondary" onclick="openSettings()">
                    ⚙️ Configure Patterns
                </button>
            </div>
            <div class="info-box success">
                ✓ Open any JavaScript or TypeScript file to begin analysis
            </div>
        </div>

        <!-- Features Card -->
        <div class="card">
            <div class="card-title">
                <span class="card-icon">✨</span>
                Pattern Detection
            </div>
            <div class="feature-grid">
                <div class="feature-item">
                    <span class="feature-icon">🔒</span>
                    <span>Singleton issues</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🏭</span>
                    <span>Factory patterns</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">👁️</span>
                    <span>Observer cleanup</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🎯</span>
                    <span>Strategy patterns</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🎨</span>
                    <span>Decorator hierarchy</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🔌</span>
                    <span>Adapter patterns</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🏢</span>
                    <span>Facade complexity</span>
                </div>
                <div class="feature-item">
                    <span class="feature-icon">🔀</span>
                    <span>Proxy opportunities</span>
                </div>
            </div>
        </div>

        <!-- Settings Card -->
        <div class="card">
            <div class="card-title">
                <span class="card-icon">⚙️</span>
                Configuration
            </div>
            <div class="button-group">
                <button class="button secondary" onclick="openSettingsUI()">
                    📋 Manage Enabled Patterns
                </button>
                <button class="button secondary" onclick="openSettings()">
                    🔧 Advanced Settings
                </button>
            </div>
            <div class="info-box">
                Customize severity levels and enable/disable specific patterns
            </div>
        </div>

        <!-- Documentation Card -->
        <div class="card">
            <div class="card-title">
                <span class="card-icon">📚</span>
                Resources
            </div>
            <div class="button-group">
                <button class="button secondary" onclick="openDocs()">
                    📖 View Documentation
                </button>
                <button class="button secondary" onclick="openGitHub()">
                    🐙 GitHub Repository
                </button>
            </div>
        </div>

        <!-- Tips Card -->
        <div class="card">
            <div class="card-title">
                <span class="card-icon">💡</span>
                Pro Tips
            </div>
            <ul style="list-style: none; padding: 0; margin: 0; font-size: 12px; line-height: 1.8;">
                <li>📌 Status bar shows real-time pattern violation counts</li>
                <li>⌨️ Use Ctrl+Shift+P to access all Pattern Lens commands</li>
                <li>🎨 Customize severity (error, warning, info) per pattern</li>
                <li>♻️ Debounced analysis (500ms) for optimal performance</li>
            </ul>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function runAnalysis() {
            vscode.postMessage({ type: 'runExample' });
        }

        function openSettings() {
            vscode.postMessage({ type: 'openSettings' });
        }

        function openSettingsUI() {
            vscode.postMessage({ type: 'openSettingsUI' });
        }

        function openDocs() {
            vscode.postMessage({ type: 'openDocs' });
        }

        function openGitHub() {
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/manoaravindhan/pattern-dojo-ext'));
        }
    </script>
</body>
</html>`;
  }
}
