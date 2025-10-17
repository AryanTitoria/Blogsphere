const form = document.getElementById('add-blog-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = form.title.value.trim();
  const content = form.content.value.trim();
  const user_id = localStorage["user_id"]

  if (!title || !content ) {
    alert('All fields are required!');
    return;
  }

  try {
    const res = await fetch('/api/blogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content ,user_id})
    });

    const data = await res.json();
    if (data.success) {
      alert('Blog added successfully!');
      window.location.href = '/';
    } else {
      alert('Error: ' + data.error);
    }
  } catch (err) {
    console.error(err);
    alert('Error adding blog.');
  }
});
