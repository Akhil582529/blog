const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).send('Access denied');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send('Invalid token');
  }
};

// Create a new note
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const queryText = 'INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *';
    const result = await db.query(queryText, [req.user.id, title, content]);
    res.status(201).send(result.rows[0]);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Retrieve all notes for the authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    const queryText = 'SELECT * FROM notes WHERE user_id = $1';
    const result = await db.query(queryText, [req.user.id]);
    res.send(result.rows);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get a specific note
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const queryText = 'SELECT * FROM notes WHERE id = $1 AND user_id = $2';
    const result = await db.query(queryText, [req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Note not found');
    }
    res.send(result.rows[0]);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update a note
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const queryText = 'UPDATE notes SET title = $1, content = $2 WHERE id = $3 AND user_id = $4 RETURNING *';
    const result = await db.query(queryText, [title, content, req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Note not found');
    }
    res.send(result.rows[0]);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete a note
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const queryText = 'DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING *';
    const result = await db.query(queryText, [req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Note not found');
    }
    res.send(result.rows[0]);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
