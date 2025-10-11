// frontend/js/signup.js

const form = document.getElementById('signup-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = form.username.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value.trim();

  if (!username || !email || !password) {
    alert('All fields are required!');
    return;
  }

  try {
    const res = await fetch('/api/users/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await res.json();
    if (data.success) {
      alert('Signup successful! You can now login.');
      window.location.href = '/login.html';
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    console.error(err);
    alert('Error signing up.');
  }
});
