'use strict';
const express = require('express');
const vscode = require('vscode');

const runSignInCommand = (context) => {
  startRedirectServer(context);
  openAuthenticationPage();
};

const openAuthenticationPage = () => {
  const url = `https://y8qu8yj9ni.execute-api.us-east-1.amazonaws.com/Prod/oauth/start`;
  vscode.env.openExternal(vscode.Uri.parse(url));
};

const startRedirectServer = (context) => {
  const app = express();
  // const options = {
  //   key: fs.readFileSync('./certs/server-key.pem'),
  //   cert: fs.readFileSync('./certs/server-cert.pem')
  // };

  const port = 6553;
  let server;
  app.get('/', (req, res) => {
    res.send('Welcome to my server!');
  });

  app.get('/success', async (req, res) => {
    const accessToken = req.query.token;
    try {
      await context.secrets.store('oauthCode', accessToken);
      res.json('success');
      res.status(200);
    } catch (error) {
      res.json('Error saving the authorization code:', error);
      res.status(500);
    }
  });

  // const server = https.createServer(options, app);
  server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

module.exports = { runSignInCommand };
