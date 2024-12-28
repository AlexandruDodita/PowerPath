const express = require('express');
const pool = require('./db');
const router = express.Router();

// Add New Workout
router.post('/new', async (req, res) => {
  const { user_id, exercises } = req.body;

  try {
    const workoutResult = await pool.query(
      'INSERT INTO workouts (user_id) VALUES ($1) RETURNING id',
      [user_id]
    );

    const workoutId = workoutResult.rows[0].id;

    for (let exercise of exercises) {
      const { exercise_name, sets, reps, rpe } = exercise;
      await pool.query(
        'INSERT INTO exercises (workout_id, exercise_name, sets, reps, rpe) VALUES ($1, $2, $3, $4, $5)',
        [workoutId, exercise_name, sets, reps, rpe]
      );
    }

    res.json({ message: 'Workout added!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log workout' });
  }
});

module.exports = router;
