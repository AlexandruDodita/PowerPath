const express = require('express');
const pool = require('./db');
const router = express.Router();

router.post('/new', async (req, res) => {
  const { user_id, exercises } = req.body;

  if (!user_id || !exercises || exercises.length === 0) {
    return res.status(400).json({ error: 'Invalid workout data' });
  }

  try {
    // Insert workout into workouts table
    const workoutResult = await pool.query(
      'INSERT INTO workouts (user_id) VALUES ($1) RETURNING id',
      [user_id]
    );

    const workoutId = workoutResult.rows[0].id;

    // Insert exercises linked to the workout
    for (let exercise of exercises) {
      const { exercise_name, sets, reps, rpe } = exercise;

      if (!exercise_name || !sets || !reps || rpe === undefined) {
        continue;  // Skip incomplete exercise entries
      }

      await pool.query(
        'INSERT INTO exercises (workout_id, exercise_name, sets, reps, rpe) VALUES ($1, $2, $3, $4, $5)',
        [workoutId, exercise_name, sets, reps, rpe]
      );
    }

    res.json({ message: 'Workout and exercises added!' });
  } catch (err) {
    console.error('Workout Error:', err);
    res.status(500).json({ error: 'Failed to log workout' });
  }
});

//fetcher for the history
router.get('/history/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const workouts = await pool.query(
      `SELECT w.id, w.workout_date,
              COUNT(e.id) as exercise_count
       FROM workouts w
       LEFT JOIN exercises e ON w.id = e.workout_id
       WHERE w.user_id = $1
       GROUP BY w.id, w.workout_date
       ORDER BY w.workout_date DESC`,
      [userId]
    );

    res.json(workouts.rows);
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch workout history' });
  }
});


router.get('/details/:workoutId', async (req, res) => {
  try {
    const workoutId = req.params.workoutId;
    const exercises = await pool.query(
      `SELECT exercise_name, sets, reps, rpe
       FROM exercises
       WHERE workout_id = $1
       ORDER BY id`,
      [workoutId]
    );

    res.json(exercises.rows);
  } catch (err) {
    console.error('Workout details fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch workout details' });
  }
});

router.delete('/delete/:workoutId', async (req, res) => {
  try {
    const workoutId = req.params.workoutId;

    // First delete associated exercises (due to foreign key constraints)
    await pool.query(
      'DELETE FROM exercises WHERE workout_id = $1',
      [workoutId]
    );

    // Then delete the workout
    await pool.query(
      'DELETE FROM workouts WHERE id = $1',
      [workoutId]
    );

    res.json({ message: 'Workout deleted successfully' });
  } catch (err) {
    console.error('Workout deletion error:', err);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

router.put('/update-weight', async (req, res) => {
  const { user_id, weight } = req.body;

  if (!user_id || !weight) {
    return res.status(400).json({ error: 'User ID and weight are required' });
  }

  try {
    const result = await pool.query(
      'UPDATE profiles SET weight = $1 WHERE user_id = $2 RETURNING weight',
      [weight, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      message: 'Weight updated successfully',
      weight: result.rows[0].weight
    });
  } catch (err) {
    console.error('Weight update error:', err);
    res.status(500).json({ error: 'Failed to update weight' });
  }
});
module.exports = router;
