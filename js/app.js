const BACKEND_URL = 'http://localhost:5000'; // Updated to match your backend port

async function handleAuth(event) {
  event.preventDefault();
  try {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_id', data.user_id);
      document.getElementById('auth-screen').style.display = 'none';
      document.getElementById('main-screen').style.display = 'block';
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert('Network error: ' + error.message);
  }
}

async function registerUser(event) {
  event.preventDefault();

  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  const email = document.getElementById('reg-email').value;
  const first_name = document.getElementById('reg-firstname').value;
  const last_name = document.getElementById('reg-lastname').value;
  const age = document.getElementById('reg-age').value;
  const gender = document.getElementById('reg-gender').value;
  const weight = document.getElementById('reg-weight').value;

  const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password, email, first_name, last_name, age, gender, weight })
  });

  const data = await response.json();
  if (response.ok) {
    alert('Registration successful! Please login.');
    location.reload();
  } else {
    alert(`Error: ${data.error}`);
  }
}



function showRegister() {
  document.getElementById('auth-form').innerHTML = `
      <h2>Create Your Account</h2>
      <input type="text" id="reg-firstname" placeholder="First Name" required>
      <input type="text" id="reg-lastname" placeholder="Last Name" required>
      <input type="number" id="reg-age" placeholder="Age" required min="13" max="100">
      <select id="reg-gender" required>
        <option value="" disabled selected>Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
      <input type="number" id="reg-weight" placeholder="Weight (kg)" required min="20">
      <input type="text" id="reg-username" placeholder="Username" required>
      <input type="email" id="reg-email" placeholder="Email" required>
      <input type="password" id="reg-password" placeholder="Password" required>
      <button type="submit" onclick="registerUser(event)">Register</button>
      <button type="button" onclick="location.reload()">Back to Login</button>
    `;
}



function addExercise() {
  const list = document.getElementById('exercise-list');
  const div = document.createElement('div');
  div.classList.add('exercise-item');
  div.innerHTML = `
    <select class="exercise-select">
      <optgroup label="Compound Movements">
        <option>Squat</option>
        <option>Deadlift</option>
        <option>Bench Press</option>
        <option>Overhead Press</option>
        <option>Barbell Row</option>
        <option>Pull-ups</option>
      </optgroup>
      <optgroup label="Lower Body">
        <option>Romanian Deadlift</option>
        <option>Leg Press</option>
        <option>Lunges</option>
        <option>Leg Extensions</option>
        <option>Leg Curls</option>
        <option>Calf Raises</option>
        <option>Hip Thrusts</option>
      </optgroup>
      <optgroup label="Upper Body Push">
        <option>Incline Bench</option>
        <option>Dips</option>
        <option>Push-ups</option>
        <option>Lateral Raises</option>
        <option>Tricep Pushdowns</option>
        <option>Tricep Extensions</option>
      </optgroup>
      <optgroup label="Upper Body Pull">
        <option>Lat Pulldown</option>
        <option>Cable Rows</option>
        <option>Face Pulls</option>
        <option>Bicep Curls</option>
        <option>Hammer Curls</option>
        <option>Preacher Curls</option>
      </optgroup>
    </select>
    <input type="number" placeholder="Sets" min="1" max="20" value="3" oninput="validateNumber(this, 1, 20)">
    <input type="number" placeholder="Reps" min="1" max="100" value="10" oninput="validateNumber(this, 1, 100)">
    <input type="number" placeholder="RPE" min="0" max="10" step="0.5" value="7" oninput="validateRPE(this)">
    <button class="remove-btn" onclick="removeExercise(this)" title="Remove Exercise">×</button>
  `;
  list.appendChild(div);
}

function validateNumber(input, min, max) {
  let value = parseInt(input.value);
  if (isNaN(value)) value = min;
  input.value = Math.min(Math.max(value, min), max);
}

function validateRPE(input) {
  let value = parseFloat(input.value);
  if (isNaN(value)) value = 7;
  input.value = Math.min(Math.max(value, 0), 10);
}

function removeExercise(button) {
  if (document.getElementsByClassName('exercise-item').length > 1) {
    button.parentElement.remove();
  } else {
    alert('You must have at least one exercise in your workout');
  }
}


function finishWorkout() {
  const exercises = Array.from(document.getElementsByClassName('exercise-item')).map(item => {
    const select = item.querySelector('select');
    const [sets, reps, rpe] = Array.from(item.querySelectorAll('input')).map(input => input.value);

    return {
      exercise_name: select.value,
      sets: parseInt(sets),
      reps: parseInt(reps),
      rpe: parseFloat(rpe)
    };
  });

  if (exercises.some(ex => !ex.exercise_name || !ex.sets || !ex.reps || ex.rpe === undefined)) {
    alert('Please fill in all exercise details');
    return;
  }

  const user_id = localStorage.getItem('user_id');
  if (!user_id) {
    alert('Session expired. Please log in again.');
    logout();
    return;
  }

  // Show loading state
  const finishBtn = document.querySelector('.finish-btn');
  const originalText = finishBtn.textContent;
  finishBtn.textContent = 'Saving...';
  finishBtn.disabled = true;

  fetch(`${BACKEND_URL}/api/workout/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      user_id: parseInt(user_id),
      exercises: exercises
    })
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to save workout');
      return response.json();
    })
    .then(data => {
      alert('Workout successfully saved!');
      document.getElementById('workout-screen').style.display = 'none';
      document.getElementById('main-screen').style.display = 'block';
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to save workout. Please try again.');
    })
    .finally(() => {
      finishBtn.textContent = originalText;
      finishBtn.disabled = false;
    });
}

function startWorkout() {
  hideAllScreens();
  document.getElementById('main-screen').style.display = 'none';
  document.getElementById('workout-screen').style.display = 'block';
  document.getElementById('exercise-list').innerHTML = '';
  addExercise();
}

async function viewHistory() {
  hideAllScreens();
  const userId = localStorage.getItem('user_id');
  if (!userId) {
    alert('Please log in again');
    return;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/workout/history/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch history');

    const workouts = await response.json();
    const historyList = document.getElementById('workout-history-list');
    historyList.innerHTML = workouts.map(workout => `
      <div class="workout-history-item" id="workout-${workout.id}">
        <div class="workout-info" onclick="viewWorkoutDetails(${workout.id})">
          <h3>Workout on ${new Date(workout.workout_date).toLocaleDateString()}</h3>
          <p>${workout.exercise_count} exercises</p>
        </div>
        <button class="delete-btn" onclick="deleteWorkout(${workout.id}, event)">🗑️</button>
      </div>
    `).join('');

    document.getElementById('main-screen').style.display = 'none';
    document.getElementById('history-screen').style.display = 'block';
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to load workout history');
  }
}

async function deleteWorkout(workoutId, event) {
  event.stopPropagation(); // Prevent triggering the viewWorkoutDetails click

  if (!confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/workout/delete/${workoutId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to delete workout');

    // Remove the workout from the UI using the specific workout ID
    const workoutElement = document.getElementById(`workout-${workoutId}`);
    if (workoutElement) {
      workoutElement.remove();
    }

    // Check if there are any workouts left
    const historyList = document.getElementById('workout-history-list');
    if (historyList.children.length === 0) {
      historyList.innerHTML = '<p class="no-workouts">No workouts found</p>';
    }

    alert('Workout deleted successfully');
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to delete workout');
  }
}

async function viewWorkoutDetails(workoutId) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/workout/details/${workoutId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch workout details');

    const exercises = await response.json();
    const detailsContent = document.getElementById('workout-details-content');
    detailsContent.innerHTML = exercises.map(exercise => `
      <div class="exercise-detail">
        <h3>${exercise.exercise_name}</h3>
        <p>Sets: ${exercise.sets} | Reps: ${exercise.reps} | RPE: ${exercise.rpe}</p>
      </div>
    `).join('');

    document.getElementById('history-screen').style.display = 'none';
    document.getElementById('workout-details-screen').style.display = 'block';
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to load workout details');
  }
}

function showSettings() {
  hideAllScreens();
  document.getElementById('settings-screen').style.display = 'block';
}

async function updateWeight() {
  const newWeight = document.getElementById('new-weight').value;
  const userId = localStorage.getItem('user_id');

  if (!newWeight) {
    alert('Please enter a valid weight');
    return;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/update-weight`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        user_id: userId,
        weight: parseFloat(newWeight)
      })
    });

    if (!response.ok) throw new Error('Failed to update weight');

    const data = await response.json();
    alert('Weight updated successfully!');
    document.getElementById('new-weight').value = '';
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to update weight');
  }
}

async function deleteAccount() {
  if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your workout history.')) {
    return;
  }

  // Add a second confirmation for extra safety
  if (!confirm('Really delete your account? This is your last chance to back out!')) {
    return;
  }

  const userId = localStorage.getItem('user_id');

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/delete-account/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) throw new Error('Failed to delete account');

    alert('Account deleted successfully');
    logout(); // This will clear localStorage and redirect to login screen
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to delete account');
  }
}

function hideAllScreens() {
  const screens = [
    'auth-screen',
    'main-screen',
    'workout-screen',
    'history-screen',
    'workout-details-screen',
    'settings-screen'
  ];
  screens.forEach(screenId => {
    document.getElementById(screenId).style.display = 'none';
  });
}

function backToMain() {
  hideAllScreens();
  document.getElementById('history-screen').style.display = 'none';
  document.getElementById('main-screen').style.display = 'block';
}

function backToHistory() {
  hideAllScreens();
  document.getElementById('workout-details-screen').style.display = 'none';
  document.getElementById('history-screen').style.display = 'block';
}

function logout() {
  hideAllScreens();
  localStorage.removeItem('token');
  localStorage.removeItem('user_id');
  document.getElementById('main-screen').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'block';
}
