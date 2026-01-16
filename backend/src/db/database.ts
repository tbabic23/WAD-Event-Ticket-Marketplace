import sqlite3 from "sqlite3";
import { open } from "sqlite";


async function createDatabase() {

  const db = await open({
    filename: 'mydb.sdb',
    driver: sqlite3.Database
  });


  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      password TEXT
    )
  `);

  console.log("Database and users table created successfully!");


  await db.run(`
INSERT OR IGNORE INTO users (username, password) 
VALUES 
    ('admin', 'admin'),
    ('user', 'user');
  `);

  console.log("Inserted a test user: admin / admin");

  await db.close();
}

createDatabase().catch(err => console.error(err));