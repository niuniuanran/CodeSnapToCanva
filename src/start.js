'use strict';
const path = require('path');
const { homedir } = require('os');
const { readHtml, writeFile, getSettings } = require('./util');
const vscode = require('vscode');
const fetch = require('node-fetch');

const getConfig = () => {
  const editorSettings = getSettings('editor', ['fontLigatures', 'tabSize']);
  const editor = vscode.window.activeTextEditor;
  if (editor) editorSettings.tabSize = editor.options.tabSize;

  const extensionSettings = getSettings('codesnap', [
    'backgroundColor',
    'boxShadow',
    'containerPadding',
    'roundedCorners',
    'showWindowControls',
    'showWindowTitle',
    'showLineNumbers',
    'realLineNumbers',
    'transparentBackground',
    'target',
    'shutterAction'
  ]);

  const selection = editor && editor.selection;
  const startLine = extensionSettings.realLineNumbers ? (selection ? selection.start.line : 0) : 0;

  let windowTitle = '';
  if (editor && extensionSettings.showWindowTitle) {
    const activeFileName = editor.document.uri.path.split('/').pop();
    windowTitle = `${vscode.workspace.name} - ${activeFileName}`;
  }

  return {
    ...editorSettings,
    ...extensionSettings,
    startLine,
    windowTitle
  };
};

const createPanel = async (context) => {
  const panel = vscode.window.createWebviewPanel(
    'codesnaptocanva',
    'CodeSnapToCanva 📸',
    { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(context.extensionPath)]
    }
  );
  panel.webview.html = await readHtml(
    path.resolve(context.extensionPath, 'webview/index.html'),
    panel
  );

  return panel;
};

const lastUsedImageUri = vscode.Uri.file(path.resolve(homedir(), 'Desktop/code.png'));
// const saveImage = async (data) => {
//   const uri = await vscode.window.showSaveDialog({
//     filters: { Images: ['png'] },
//     defaultUri: lastUsedImageUri
//   });
//   lastUsedImageUri = uri;
//   uri && writeFile(uri.fsPath, Buffer.from(data, 'base64'));
// };

const uploadImage = async (context, data) => {
  // const uri = await vscode.window.showSaveDialog({
  //   filters: { Images: ['png'] },
  //   defaultUri: lastUsedImageUri
  // });
  // lastUsedImageUri = uri;
  // uri && writeFile(uri.fsPath, Buffer.from(data, 'base64'));
  const binaryData = Buffer.from(data, 'base64');
  const response = await fetch('https://api.canva.com/rest/v1/assets/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      Authorization: `Bearer ${context.secrets.get('oauthCode')}`,
      'Upload-Metadata': {
        name: 'codeSnap.png',
        parent_folder_id: 'FAFzFNtJKjc'
      }
    },
    body: binaryData // Your binary buffer goes here
  });
};

const hasOneSelection = (selections) =>
  selections && selections.length === 1 && !selections[0].isEmpty;

const runStartCommand = async (context) => {
  const panel = await createPanel(context);

  const update = async () => {
    await vscode.commands.executeCommand('editor.action.clipboardCopyWithSyntaxHighlightingAction');
    panel.webview.postMessage({ type: 'update', ...getConfig() });
  };

  const flash = () => panel.webview.postMessage({ type: 'flash' });

  panel.webview.onDidReceiveMessage(async ({ type, data }) => {
    if (type === 'save') {
      flash();
      vscode.window.showInformationMessage('Upload'); // TODO Add save action back
      await uploadImage(context, data);
    } else {
      vscode.window.showErrorMessage(`CodeSnap 📸: Unknown shutterAction "${type}"`);
    }
  });

  const selectionHandler = vscode.window.onDidChangeTextEditorSelection(
    (e) => hasOneSelection(e.selections) && update()
  );
  panel.onDidDispose(() => selectionHandler.dispose());

  const editor = vscode.window.activeTextEditor;
  if (editor && hasOneSelection(editor.selections)) update();
};

module.exports = { runStartCommand };
