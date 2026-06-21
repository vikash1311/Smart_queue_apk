const fs = require('fs');
const path = require('path');
const pool = require('./db');

// Runs schema.sql automatically on every server start.
// Safe because all CREATE TABLE statements use IF NOT EXISTS.
const initDb = async () => {
  try {
    const schemaPath = path.join(__dirname, '..', '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✅ Database schema verified/created');
  } catch (err) {
    console.error('❌ Schema init failed:', err.message);
  }
};

module.exports = initDb;