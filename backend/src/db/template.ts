//must be empty

import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', 'db', 'mydb.sdb');
const db = new sqlite3.Database(dbPath);

db.run(
    'ALTER TABLE events ADD COLUMN is_official BOOLEAN DEFAULT 0',
    (err) => {
        if (err) {
            console.error('Error adding column:', err.message);
        } else {
            console.log('Column is_official added successfully!');
        }
        db.close();
    }
);
