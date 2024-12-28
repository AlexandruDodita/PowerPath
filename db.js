const { Pool } = require('pg');
require('dotenv').config();

// Log the configuration (excluding sensitive info)
console.log('Database Configuration:', {
  user: process.env.DB_USER,
  host: 'localhost',
  database: process.env.DB_NAME,
  passwordExists: !!process.env.DB_PASS,
  port: 5432
});

// Ensure password is a string
const password = String(process.env.DB_PASS);

const pool = new Pool({
  user: process.env.DB_USER,
  host: 'localhost',
  database: process.env.DB_NAME,
  password: password,
  port: 5432
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
    console.log('Attempted password type:', typeof password);
    console.log('Password length:', password.length);
  } else {
    console.log('Database connected successfully');
  }
});

// Add error handler for pool errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
