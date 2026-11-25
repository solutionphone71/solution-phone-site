#!/usr/bin/env node
/* Simple Express server exposing /faq-fallback endpoint for Jason widget */
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();

app.get('/faq-fallback', (req, res) => {
  const question = req.query.question || '';
  const scriptPath = path.join(__dirname, 'scripts', 'faq_fallback.py');
  const child = spawn('python3', [scriptPath, question]);
  let stdout = '';
  child.stdout.on('data', (data) => { stdout += data.toString(); });
  child.stderr.on('data', (data) => { console.error('stderr:', data.toString()); });
  child.on('close', (code) => {
    try {
      const json = JSON.parse(stdout);
      res.json(json);
    } catch (e) {
      res.status(500).json({ status: 'error', error: 'Invalid response from script' });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`FAQ fallback server listening on port ${PORT}`));
