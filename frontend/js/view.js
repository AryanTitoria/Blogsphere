document.addEventListener('DOMContentLoaded', () => {
  // Header elements
  const userId = localStorage.getItem('user_id');
  const username = localStorage.getItem('username');
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const userGreet = document.getElementById('user-greet');
  const usernameSpan = document.getElementById('username');
  const logoutBtn = document.getElementById('logout-btn');

  if (userId) {
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'none';
    userGreet.style.display = 'inline';
    usernameSpan.textContent = username;
  }

  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    window.location.reload();
  });

  // BLOG & COMMENTS
  const blogContainer = document.getElementById('blog-container');
  const commentsContainer = document.getElementById('comments-container');
  const commentForm = document.getElementById('add-comment-form');

  const params = new URLSearchParams(window.location.search);
  const blogId = params.get('id');

  async function fetchBlog() {
    blogContainer.innerHTML = '<p>Loading blog...</p>';
    try {
      const res = await fetch(`/api/blogs/${blogId}`);
      const data = await res.json();
      if (!data.success) {
        blogContainer.innerHTML = '<p>Blog not found.</p>';
        return;
      }
      const blog = data.blog;
      blogContainer.innerHTML = `
        <h2>${blog.title}</h2>
        <p>By: ${blog.username} | ${new Date(blog.created_at).toLocaleString()}</p>
        <p>${blog.content}</p>
      `;
    } catch (err) {
      console.error(err);
      blogContainer.innerHTML = '<p>Error loading blog.</p>';
    }
  }

  async function fetchComments() {
    commentsContainer.innerHTML = '<p>Loading comments...</p>';
    try {
      const res = await fetch(`/api/comments/${blogId}`);
      const data = await res.json();
      if (!data.success) {
        commentsContainer.innerHTML = '<p>Error loading comments.</p>';
        return;
      }
      if (data.comments.length === 0) {
        commentsContainer.innerHTML = '<p>No comments yet.</p>';
        return;
      }
      commentsContainer.innerHTML = '';
      data.comments.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comment';
        div.innerHTML = `<p><strong>${c.username}</strong>: ${c.comment_text}</p>`;
        commentsContainer.appendChild(div);
      });
    } catch (err) {
      console.error(err);
      commentsContainer.innerHTML = '<p>Error loading comments.</p>';
    }
  }

  // Add comment
  if (commentForm) {
    commentForm.addEventListener('submit', async e => {
      e.preventDefault();
      if (!userId) {
        alert('You must be logged in to comment.');
        return;
      }
      const comment_text = commentForm.comment_text.value.trim();
      if (!comment_text) return;

      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blog_id: blogId, user_id: userId, comment_text })
        });
        const data = await res.json();
        if (data.success) {
          commentForm.reset();
          fetchComments();
        } else {
          alert('Error: ' + data.error);
        }
      } catch (err) {
        console.error(err);
        alert('Error adding comment.');
      }
    });
  }

  // Initialize
  fetchBlog();
  fetchComments();
});
