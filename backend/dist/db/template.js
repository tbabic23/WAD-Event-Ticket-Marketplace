"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, '..', 'db', 'mydb.sdb');
const db = new sqlite3_1.default.Database(dbPath);
db.run('ALTER TABLE events ADD COLUMN is_official BOOLEAN DEFAULT 0', (err) => {
    if (err) {
        console.error('Error adding column:', err.message);
    }
    else {
        console.log('Column is_official added successfully!');
    }
    db.close();
});
