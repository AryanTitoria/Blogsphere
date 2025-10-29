// backend/server.js
const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('./db');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

/* ---------------- BLOG ROUTES ---------------- */

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.title, LEFT(p.content, 250) AS content_preview,
              p.content, p.image_url, p.category, p.created_at, p.updated_at,
              u.username
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.json({ success: true, posts: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Get single post
app.get('/api/posts/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.title, p.content, p.image_url, p.category,
              p.created_at, u.username
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, error: 'Post not found' });
    res.json({ success: true, post: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Create a post
app.post('/api/posts', async (req, res) => {
  const { title, content, user_id, category, image_url } = req.body;

  console.log("📝 Incoming new post:", req.body); // DEBUG LOG

  if (!title || !content || !user_id) {
    console.log("❌ Missing fields:", { title, content, user_id });
    return res.status(400).json({ success: false, error: 'Title, content, and user_id required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO posts (title, content, user_id, category, image_url) VALUES (?, ?, ?, ?, ?)',
      [title, content, user_id, category || null, image_url || null]
    );
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, post: rows[0] });
  } catch (err) {
    console.error("💥 Database error while inserting post:", err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});


// Delete post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, error: 'Post not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

/* ---------------- USER ROUTES ---------------- */

// Signup
app.post('/api/users/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ success: false, error: 'All fields required' });

  try {
    const [exists] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (exists.length > 0)
      return res.status(400).json({ success: false, error: 'Email already registered' });

    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );
    res.status(201).json({ success: true, user_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Login
app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, error: 'All fields required' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (rows.length === 0)
      return res.status(400).json({ success: false, error: 'Invalid credentials' });

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

/* ---------------- COMMENT ROUTES ---------------- */

// Get comments for a post
app.get('/api/comments/:post_id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.comment, c.created_at, c.username
       FROM comments c
       WHERE c.post_id = ?
       ORDER BY c.created_at DESC`,
      [req.params.post_id]
    );
    res.json({ success: true, comments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Add comment
app.post('/api/comments', async (req, res) => {
  const { post_id, username, comment } = req.body;
  if (!post_id || !username || !comment)
    return res.status(400).json({ success: false, error: 'All fields required' });

  try {
    const [result] = await pool.query(
      'INSERT INTO comments (post_id, username, comment) VALUES (?, ?, ?)',
      [post_id, username, comment]
    );
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, comment: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

/* ---------------- LIKE ROUTES ---------------- */

// Like / Unlike a post
app.post('/api/likes', async (req, res) => {
  const { post_id, username } = req.body;
  if (!post_id || !username)
    return res.status(400).json({ success: false, error: 'Missing fields' });

  try {
    const [exists] = await pool.query('SELECT * FROM likes WHERE post_id = ? AND username = ?', [post_id, username]);
    if (exists.length > 0) {
      await pool.query('DELETE FROM likes WHERE post_id = ? AND username = ?', [post_id, username]);
      return res.json({ success: true, action: 'unliked' });
    } else {
      await pool.query('INSERT INTO likes (post_id, username) VALUES (?, ?)', [post_id, username]);
      return res.json({ success: true, action: 'liked' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Get total likes
app.get('/api/likes/:post_id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS total_likes FROM likes WHERE post_id = ?', [req.params.post_id]);
    res.json({ success: true, total_likes: rows[0].total_likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

/* ---------------- FALLBACK ---------------- */
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    next();
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Server running at http://localhost:${port}`));
