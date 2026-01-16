import express from 'express';
import sqlite3 from 'sqlite3';
import app from './index';
import path from 'path';

const dbPath = path.join(__dirname, 'db', 'mydb.sdb');
const db = new sqlite3.Database(dbPath);

const PORT = 3000;


app.post('/login', (req, res) => {
  console.log('LOGIN BODY:', req.body);
  const { username, password } = req.body;
  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, row) => {
      console.log(row);
      if (err) return res.status(500).send('DB error');
      if (!row) return res.status(401).send('Invalid credentials');
      res.send({ message: 'Login successful', user: row });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
