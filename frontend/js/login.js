// frontend/js/login.js

const form = document.getElementById('login-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = form.email.value.trim();
  const password = form.password.value.trim();

  if (!email || !password) {
    alert('All fields are required!');
    return;
  }

  try {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.success) {
      alert('Login successful!');
      // You can store user_id in localStorage for session
      localStorage.setItem('user_id', data.user.user_id);
      localStorage.setItem('username', data.user.username);
      window.location.href = '/';
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    console.error(err);
    alert('Error logging in.');
  }
});
