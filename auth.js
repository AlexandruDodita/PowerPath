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



router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User does not exist' });
    }


    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, result.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.json({
      token,
      user_id: user.id,  // Include user_id in the response
      username: user.username
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login', details: err.message });
  }
});

router.delete('/delete-account/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    await pool.query('BEGIN');
    const workouts = await pool.query(
      'SELECT id FROM workouts WHERE user_id = $1',
      [userId]
    );

    for (const workout of workouts.rows) {
      await pool.query('DELETE FROM exercises WHERE workout_id = $1', [workout.id]);
    }

    await pool.query('DELETE FROM workouts WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM profiles WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    await pool.query('COMMIT');

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Account deletion error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});


router.get('/user-info/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(
      `SELECT u.username, u.email, p.first_name, p.last_name, p.age, p.gender
       FROM users u
              JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user info:', err);
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});

router.put('/change-password', async (req, res) => {
  const { user_id, current_password, new_password } = req.body;

  if (!user_id || !current_password || !new_password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // First verify the current password
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [user_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(
      current_password,
      userResult.rows[0].password
    );

    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(new_password, 10);

    // Update the password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedNewPassword, user_id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;
