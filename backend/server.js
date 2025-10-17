// backend/server.js
const express = require('express');
const path = require('path');
require('dotenv').config();
const pool = require('./db');

const app = express();
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

/* ---------- API Routes ---------- */

// 1️⃣ Get all blogs
app.get('/api/blogs', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.blog_id, b.title, b.content, b.user_id, u.username, b.created_at, b.updated_at
       FROM Blogs b
       JOIN Users u ON b.user_id = u.user_id
       ORDER BY b.created_at DESC`
    );
    res.json({ success: true, blogs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// 2️⃣ Get single blog by ID
app.get('/api/blogs/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.blog_id, b.title, b.content, b.user_id, u.username, b.created_at, b.updated_at
       FROM Blogs b
       JOIN Users u ON b.user_id = u.user_id
       WHERE b.blog_id = ?`, [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Blog not found' });
    res.json({ success: true, blog: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// 3️⃣ Create new blog
app.post('/api/blogs', async (req, res) => {
  const { title, content ,user_id} = req.body;
  if (!title || !content ) return res.status(400).json({ success: false, error: 'Title, content, and user_id required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO Blogs (title, content, user_id) VALUES (?, ?, ?)',
      [title, content,user_id]
    );
    const [rows] = await pool.query('SELECT * FROM Blogs WHERE blog_id = ?', [result.insertId]);
    res.status(201).json({ success: true, blog: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// 4️⃣ Delete blog by ID
app.delete('/api/blogs/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM Blogs WHERE blog_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Blog not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Create new user (signup)
app.post('/api/users/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  try {
    // Check if email already exists
    const [existing] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO Users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password] // For production: hash passwords!
    );

    res.status(201).json({ success: true, user_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// User login
app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM Users WHERE email = ? AND password = ?', [email, password]);

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid email or password' });
    }

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Get all comments for a blog
app.get('/api/comments/:blog_id', async (req, res) => {
  const { blog_id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT c.comment_id, c.comment_text, c.comment_date, c.user_id, u.username
       FROM Comments c
       JOIN Users u ON c.user_id = u.user_id
       WHERE c.blog_id = ?
       ORDER BY c.comment_date ASC`,
      [blog_id]
    );
    res.json({ success: true, comments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Add comment to a blog
app.post('/api/comments', async (req, res) => {
  const { blog_id, user_id, comment_text } = req.body;

  if (!blog_id || !user_id || !comment_text) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO Comments (blog_id, user_id, comment_text) VALUES (?, ?, ?)',
      [blog_id, user_id, comment_text]
    );

    const [rows] = await pool.query('SELECT * FROM Comments WHERE comment_id = ?', [result.insertId]);
    res.status(201).json({ success: true, comment: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});


// Fallback for frontend routing 
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    next();
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));