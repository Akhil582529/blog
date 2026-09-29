/**
 * Managed by the orchestrator. Agents must NOT edit this file.
 *
 * Every file in ./routes is mounted automatically at /api/<filename>.
 * routes/auth.js  ->  /api/auth
 * routes/expenses.js -> /api/expenses
 *
 * A route file may export either an Express Router directly, or
 * { basePath, router } to override the mount path.
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const routesDir = path.join(__dirname, 'routes');

if (fs.existsSync(routesDir)) {
  for (const file of fs.readdirSync(routesDir)) {
    if (!file.endsWith('.js')) continue;

    let mod;

    try {
      mod = require(path.join(routesDir, file));
    } catch (err) {
      console.error('[server] failed to load route ' + file + ':', err.message);
      continue;
    }

    const router = mod && mod.router ? mod.router : mod;
    const basePath =
      (mod && mod.basePath) || '/api/' + file.replace(/\.js$/, '');

    if (typeof router !== 'function') {
      console.error('[server] ' + file + ' did not export a router');
      continue;
    }

    app.use(basePath, router);
    console.log('[server] mounted ' + basePath + ' from routes/' + file);
  }
}

app.use((err, req, res, next) => {
  console.error('[server] error:', err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5050;

async function start() {
  try {
    const db = require('./db');
    if (db && typeof db.init === 'function') {
      await db.init();
      console.log('[server] database ready');
    }
  } catch (err) {
    console.error('[server] database init failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log('[server] listening on http://localhost:' + PORT);
  });
}

start();
