import * as vscode from 'vscode';

const CORE_ENGINE_URL = 'http://localhost:3000';

/**
 * The extension is intentionally thin: it hosts the same static `ui` build
 * (packages/ui/dist) inside a webview and lets that frontend talk to the
 * already-running local core engine, exactly like the browser and desktop
 * clients do. No duplicated business logic lives here.
 */
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('stowwit.open', () => {
    const panel = vscode.window.createWebviewPanel(
      'stowwitBrowser',
      'stowwit',
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    panel.webview.html = getWebviewHtml();
  });

  context.subscriptions.push(disposable);
}

function getWebviewHtml(): string {
  // The webview loads the built UI as an iframe pointed at the local core
  // engine's static file server (see packages/core's optional static
  // middleware) or, in dev, at the Vite dev server. Keeping this as an
  // iframe rather than re-bundling the UI avoids maintaining two builds.
  return /* html */ `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          html, body, iframe { height: 100%; width: 100%; margin: 0; border: 0; }
          body { background: #0D0E12; }
        </style>
      </head>
      <body>
        <iframe src="${CORE_ENGINE_URL}"></iframe>
      </body>
    </html>
  `;
}

export function deactivate() {}
