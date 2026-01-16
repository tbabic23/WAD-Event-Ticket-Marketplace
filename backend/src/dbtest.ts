import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, 'db', 'mydb.sdb');
const db = new sqlite3.Database(dbPath);

db.all('SELECT * FROM users', [], (err, rows) => {
  if (err) return console.error(err);
  console.log(rows);
  db.close();
});