"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dbPath = path_1.default.join(__dirname, 'mydb.sdb');
const schemaPath = path_1.default.join(__dirname, 'schema.sql');
if (fs_1.default.existsSync(dbPath)) {
    console.log('Removing existing database...');
    fs_1.default.unlinkSync(dbPath);
}
const db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        console.error('Error creating database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database.');
});
const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
const statements = schema
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
const initializeDatabase = async () => {
    db.serialize(() => {
        let index = 0;
        const executeNext = () => {
            if (index >= statements.length) {
                createAdminUser();
                return;
            }
            const statement = statements[index];
            db.run(statement + ';', (err) => {
                if (err) {
                    console.error('Error executing statement:', err.message);
                    console.error('Statement:', statement.substring(0, 100) + '...');
                }
                index++;
                executeNext();
            });
        };
        executeNext();
    });
};
const createAdminUser = async () => {
    try {
        const users = [
            {
                username: 'admin',
                email: 'admin@eventtickets.com',
                password: 'admin123',
                role: 'admin',
                first_name: 'Admin',
                last_name: 'User'
            },
            {
                username: 'creator',
                email: 'creator@eventtickets.com',
                password: 'creator123',
                role: 'creator',
                first_name: 'Event',
                last_name: 'Creator'
            },
            {
                username: 'buyer',
                email: 'buyer@eventtickets.com',
                password: 'buyer123',
                role: 'buyer',
                first_name: 'Ticket',
                last_name: 'Buyer'
            }
        ];
        let usersCreated = 0;
        for (const user of users) {
            const hashedPassword = await bcrypt_1.default.hash(user.password, 10);
            await new Promise((resolve, reject) => {
                db.run('INSERT OR IGNORE INTO users (username, email, password, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)', [user.username, user.email, hashedPassword, user.role, user.first_name, user.last_name], (err) => {
                    if (err) {
                        console.error(`Error creating ${user.role} user:`, err.message);
                        reject(err);
                    }
                    else {
                        usersCreated++;
                        resolve();
                    }
                });
            });
        }
        console.log('\nDefault users created:');
        console.log('  Admin    - Username: admin    Password: admin123');
        console.log('  Creator  - Username: creator  Password: creator123');
        console.log('  Buyer    - Username: buyer    Password: buyer123');
        console.log(`\nDatabase initialized successfully!`);
        console.log(`Location: ${dbPath}`);
        console.log('\nTables created:');
        db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
            if (err) {
                console.error('Error listing tables:', err.message);
            }
            else {
                tables.forEach((table) => {
                    console.log(`  - ${table.name}`);
                });
            }
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                }
                else {
                    console.log('\nDatabase connection closed.');
                }
            });
        });
    }
    catch (error) {
        console.error('Error creating users:', error);
    }
};
initializeDatabase();
