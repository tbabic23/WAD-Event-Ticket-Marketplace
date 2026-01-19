"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
async function createDatabase() {
    const db = await (0, sqlite_1.open)({
        filename: 'mydb.sdb',
        driver: sqlite3_1.default.Database
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
