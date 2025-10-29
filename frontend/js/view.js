// view.js

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const blogId = params.get("id");
  const user = JSON.parse(localStorage.getItem("user"));

  const blogTitle = document.getElementById("blog-title");
  const blogMeta = document.getElementById("blog-meta");
  const blogContent = document.getElementById("blog-content");
  const commentsList = document.getElementById("comments-list");

  // Fetch blog details
  try {
    const res = await fetch(`/api/blogs/${blogId}`);
    const data = await res.json();

    if (data.success && data.blog) {
      const blog = data.blog;
      blogTitle.textContent = blog.title;
      blogMeta.textContent = `By: ${blog.username} | ${new Date(blog.created_at).toLocaleString()}`;
      blogContent.textContent = blog.content;
    } else {
      blogTitle.textContent = "Blog not found.";
    }
  } catch (err) {
    console.error("Error fetching blog:", err);
    blogTitle.textContent = "Error loading blog.";
  }

  // Fetch comments
  async function loadComments() {
    commentsList.innerHTML = "";
    const res = await fetch(`/api/comments/${blogId}`);
    const data = await res.json();

    if (data.success && data.comments.length > 0) {
      data.comments.forEach(c => {
        const div = document.createElement("div");
        div.classList.add("comment");
        div.innerHTML = `<strong>${c.username}</strong>: ${c.comment_text} <br><small>${new Date(c.comment_date).toLocaleString()}</small>`;
        commentsList.appendChild(div);
      });
    } else {
      commentsList.innerHTML = "<p>No comments yet. Be the first to comment!</p>";
    }
  }

  await loadComments();

  // Add new comment
  document.getElementById("add-comment").addEventListener("click", async () => {
    const text = document.getElementById("comment-text").value.trim();
    if (!user) {
      alert("Please log in to comment.");
      return;
    }
    if (!text) {
      alert("Comment cannot be empty.");
      return;
    }

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blog_id: blogId, user_id: user.user_id, comment_text: text })
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById("comment-text").value = "";
      loadComments();
    } else {
      alert("Failed to add comment.");
    }
  });

  // Logout
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });
});
