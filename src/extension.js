'use strict';

const vscode = require('vscode');
const { runStartCommand } = require('./start.js');
const { runSignInCommand } = require('./signin.js');

module.exports.activate = (context) => {
  context.subscriptions.push(
    vscode.commands.registerCommand('codesnaptocanva.start', () => runStartCommand(context))
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('codesnaptocanva.signin', () => runSignInCommand(context))
  );
};
