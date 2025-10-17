async function fetchBlogs() {
  const container = document.getElementById('blogs-container');
  container.innerHTML = '<p>Loading blogs...</p>';

  try {
    const res = await fetch('/api/blogs');
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = '<p>Error loading blogs.</p>';
      return;
    }

    if (data.blogs.length === 0) {
      container.innerHTML = '<p>No blogs yet.</p>';
      return;
    }

    container.innerHTML = '';
    data.blogs.forEach(blog => {
      const div = document.createElement('div');
      div.className = 'post';
      div.innerHTML = `
        <h2>${blog.title}</h2>
        <p>By: ${blog.username} | ${new Date(blog.created_at).toLocaleString()}</p>
        <p>${blog.content.substring(0, 200)}...</p>
        <a href="/view.html?id=${blog.blog_id}" class="btn">Read More</a>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Error loading blogs.</p>';
  }
}

// Initialize
fetchBlogs();
