import { Router } from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const dbPath = path.join(__dirname, '..', 'db', 'mydb.sdb');
const db = new sqlite3.Database(dbPath);

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

router.post('/register', async (req, res) => {
  const { username, email, password, role, first_name, last_name } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      'INSERT INTO users (username, email, password, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, role || 'buyer', first_name, last_name],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        const token = jwt.sign(
          { id: this.lastID, username, email, role: role || 'buyer' },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
        );

        res.status(201).json({
          message: 'Registration successful',
          token,
          user: {
            id: this.lastID,
            username,
            email,
            role: role || 'buyer',
            first_name,
            last_name
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      try {
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
        );

        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name
          }
        });
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
    }
  );
});

export { router };
