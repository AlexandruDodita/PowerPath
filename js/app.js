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
function startWorkout() {
  document.getElementById('main-screen').style.display = 'none';
  document.getElementById('workout-screen').style.display = 'block';
}

function viewHistory() {
  alert('Viewing Workout History...');
}

function addExercise() {
  const list = document.getElementById('exercise-list');
  const div = document.createElement('div');
  div.classList.add('exercise-item');
  div.innerHTML = `
            <select>
                <option>Squat</option>
                <option>Bench Press</option>
                <option>Deadlift</option>
                <option>Pull-up</option>
                <option>Overhead Press</option>
            </select>
            <input type="number" placeholder="Sets" required>
            <input type="number" placeholder="Reps" required>
            <input type="number" placeholder="RPE / RIR" required>
        `;
  list.appendChild(div);
}

function finishWorkout() {
  const exercises = Array.from(document.getElementsByClassName('exercise-item')).map(item => {
    const inputs = item.getElementsByTagName('input');
    const select = item.getElementsByTagName('select')[0];
    return {
      exercise_name: select.value,
      sets: inputs[0].value,
      reps: inputs[1].value,
      rpe: inputs[2].value
    };
  });

  fetch(`${BACKEND_URL}/api/workout/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      exercises: exercises
    })
  })
    .then(response => response.json())
    .then(data => {
      alert('Workout Completed!');
      document.getElementById('workout-screen').style.display = 'none';
      document.getElementById('main-screen').style.display = 'block';
    })
    .catch(error => alert('Failed to save workout'));
}
