document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const blogId = urlParams.get("id");
  const user = localStorage.getItem("username");

  const blogContentDiv = document.getElementById("blogContent");
  const commentsList = document.getElementById("commentsList");
  const addCommentBtn = document.getElementById("addCommentBtn");
  const commentText = document.getElementById("commentText");
  const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  //  Fetch blog details from backend
  try {
    const res = await fetch(`/blog/${blogId}`);
    if (!res.ok) throw new Error("Failed to fetch blog details.");
    const blog = await res.json();

    if (!blog || !blog.title) {
      blogContentDiv.innerHTML = `<h2 style="color:red;">Blog not found!</h2>`;
      return;
    }

    //  Show blog content beautifully
    blogContentDiv.innerHTML = `
      <h2 class="blog-title">${blog.title}</h2>
      <div class="blog-meta">
        By <b>${blog.username}</b> | ${new Date(blog.created_at).toLocaleString()}
      </div>
      <div class="blog-content">
        ${blog.content.replace(/\n/g, "<br>")}
      </div>
    `;
  } catch (err) {
    console.error(err);
    blogContentDiv.innerHTML = `<p style="color:red;">Error loading blog content.</p>`;
  }

  //  Fetch and display comments
  async function loadComments() {
    try {
      const res = await fetch(`/comments/${blogId}`);
      const comments = await res.json();

      commentsList.innerHTML =
        comments.length === 0
          ? "<p>No comments yet. Be the first to comment!</p>"
          : comments
              .map(
                (c) => `
          <div class="comment">
            <strong>${c.username}</strong>: ${c.comment_text}
          </div>
        `
              )
              .join("");
    } catch (err) {
      commentsList.innerHTML = `<p style="color:red;">Failed to load comments.</p>`;
    }
  }

  loadComments();

  //  Add comment
  addCommentBtn.addEventListener("click", async () => {
    if (!user) {
      alert("Please login to comment.");
      window.location.href = "login.html";
      return;
    }

    const text = commentText.value.trim();
    if (!text) return alert("Please enter a comment.");

    await fetch("/add-comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blog_id: blogId,
        username: user,
        comment_text: text,
      }),
    });

    commentText.value = "";
    loadComments();
  });
});
