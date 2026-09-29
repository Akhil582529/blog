/**
 * Managed by the orchestrator. Agents must NOT edit this file.
 *
 * Exposes a shared pg Pool and runs every .sql file in ./sql (sorted by
 * filename) at startup. Agents create schema by writing sql/001_name.sql,
 * never by running DDL inline.
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/postgres',
});

async function init() {
  const sqlDir = path.join(__dirname, 'sql');

  if (!fs.existsSync(sqlDir)) return;

  const files = fs
    .readdirSync(sqlDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');

    try {
      await pool.query(sql);
      console.log('[db] applied ' + file);
    } catch (err) {
      console.error('[db] failed on ' + file + ':', err.message);
    }
  }
}

module.exports = { pool, query: (t, p) => pool.query(t, p), init };
