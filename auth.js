const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password, email, first_name, last_name, age, gender, weight } = req.body;

  if (!username || !password || !email || !first_name || !last_name || !age || !gender || !weight) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query('BEGIN');

    const userResult = await pool.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, email]
    );

    const userId = userResult.rows[0].id;

    const profileInsert = await pool.query(
      'INSERT INTO profiles (user_id, first_name, last_name, age, gender, weight) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, first_name, last_name, age, gender, weight]
    );

    if (profileInsert.rowCount === 0) {
      throw new Error('Profile insertion failed.');
    }

    await pool.query('COMMIT');

    res.json({
      message: 'User registered successfully!',
      user: { id: userId, username, email }
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration', details: err.message });
  }
});



// User Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Input validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Check if user exists
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User does not exist' });
    }

    // Compare passwords
    const validPassword = await bcrypt.compare(password, result.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: result.rows[0].id, username: result.rows[0].username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login', details: err.message });
  }
});

module.exports = router;
