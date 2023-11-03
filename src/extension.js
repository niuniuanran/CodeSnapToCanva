'use strict';

const vscode = require('vscode');
const { runStartCommand } = require('./start.js');

module.exports.activate = (context) =>
  context.subscriptions.push(
    vscode.commands.registerCommand('codesnaptocanva.start', () => runStartCommand(context))
  );
