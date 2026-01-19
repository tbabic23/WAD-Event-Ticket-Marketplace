import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const dbPath = path.join(__dirname, 'mydb.sdb');
const schemaPath = path.join(__dirname, 'schema.sql');

if (fs.existsSync(dbPath)) {
  console.log('Removing existing database...');
  fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error creating database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database.');
});

const schema = fs.readFileSync(schemaPath, 'utf8');

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
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await new Promise<void>((resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO users (username, email, password, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)',
          [user.username, user.email, hashedPassword, user.role, user.first_name, user.last_name],
          (err) => {
            if (err) {
              console.error(`Error creating ${user.role} user:`, err.message);
              reject(err);
            } else {
              usersCreated++;
              resolve();
            }
          }
        );
      });
    }

    console.log('\nDefault users created:');
    console.log('  Admin    - Username: admin    Password: admin123');
    console.log('  Creator  - Username: creator  Password: creator123');
    console.log('  Buyer    - Username: buyer    Password: buyer123');

    console.log(`\nDatabase initialized successfully!`);
    console.log(`Location: ${dbPath}`);
    console.log('\nTables created:');

    db.all(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
      [],
      (err, tables: { name: string }[]) => {
        if (err) {
          console.error('Error listing tables:', err.message);
        } else {
          tables.forEach((table: { name: string }) => {
            console.log(`  - ${table.name}`);
          });
        }

        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          } else {
            console.log('\nDatabase connection closed.');
          }
        });
      }
    );
  } catch (error) {
    console.error('Error creating users:', error);
  }
};

initializeDatabase();
