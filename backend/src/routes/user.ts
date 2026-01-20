// src/middleware/users.ts
import { Router } from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

const router = Router();
const dbPath = path.join(__dirname, '..', 'db', 'mydb.sdb');
const db = new sqlite3.Database(dbPath);

// GET all users
router.get('/', (req, res) => {
    db.all(
        'SELECT id, username, email, role, first_name, last_name FROM users ORDER BY id DESC',
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// GET single user
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.get(
        'SELECT id, username, email, role, first_name, last_name FROM users WHERE id = ?',
        [id],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'User not found' });
            res.json(row);
        }
    );
});

// UPDATE user info
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, role } = req.body;
    db.run(
        'UPDATE users SET first_name = ?, last_name = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [first_name, last_name, role, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
            res.json({ message: 'User updated successfully' });
        }
    );
});

// UPDATE password
router.put('/:id/password', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ error: 'Password is required' });

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
            res.json({ message: 'Password updated successfully' });
        }
    );
});

// DELETE user
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    });
});

export { router };