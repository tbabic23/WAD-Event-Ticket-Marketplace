"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
// src/middleware/users.ts
const express_1 = require("express");
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
exports.router = router;
const dbPath = path_1.default.join(__dirname, '..', 'db', 'mydb.sdb');
const db = new sqlite3_1.default.Database(dbPath);
// GET all users
router.get('/', (req, res) => {
    db.all('SELECT id, username, email, role, first_name, last_name FROM users ORDER BY id DESC', [], (err, rows) => {
        if (err)
            return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
// GET single user
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT id, username, email, role, first_name, last_name FROM users WHERE id = ?', [id], (err, row) => {
        if (err)
            return res.status(500).json({ error: err.message });
        if (!row)
            return res.status(404).json({ error: 'User not found' });
        res.json(row);
    });
});
// UPDATE user info
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, role } = req.body;
    db.run('UPDATE users SET first_name = ?, last_name = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [first_name, last_name, role, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        if (this.changes === 0)
            return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User updated successfully' });
    });
});
// UPDATE password
router.put('/:id/password', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    if (!password)
        return res.status(400).json({ error: 'Password is required' });
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    db.run('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        if (this.changes === 0)
            return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'Password updated successfully' });
    });
});
// DELETE user
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
        if (err)
            return res.status(500).json({ error: err.message });
        if (this.changes === 0)
            return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    });
});
