const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./auth');
const workoutRoutes = require('./workout');

const app = express();

// Add CORS middleware
app.use(cors({
  origin: 'http://localhost:63342',//connect to frontend
  credentials: true
}));

app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use('/api/workout', workoutRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
