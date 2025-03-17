const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, async (err) => {
  if (err) {
    console.error('Could not connect to database', err);
    process.exit(1);
  } 
  
  console.log('Connected to SQLite database');
  
  // Check if admin column exists, if not add it
  db.all(`PRAGMA table_info(users)`, (err, columns) => {
    if (err) {
      console.error('Error checking table schema:', err);
      process.exit(1);
    }
    
    // Check if is_admin column exists
    const isAdminExists = columns.some(column => column.name === 'is_admin');
    
    if (!isAdminExists) {
      console.log('Adding is_admin column to users table...');
      db.run(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`, (err) => {
        if (err) {
          console.error('Error adding is_admin column:', err);
          process.exit(1);
        }
        console.log('is_admin column added successfully');
        createAdminUser();
      });
    } else {
      console.log('is_admin column already exists');
      createAdminUser();
    }
  });
});

async function createAdminUser() {
  const adminEmail = 'admin@chairup.com';
  const adminPassword = 'Admin123!';
  const hashedPassword = bcrypt.hashSync(adminPassword, 8);
  
  // Check if admin user already exists
  db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, user) => {
    if (err) {
      console.error('Error checking for existing admin:', err);
      process.exit(1);
    }
    
    if (user) {
      // Update existing user to be admin
      db.run('UPDATE users SET is_admin = 1 WHERE email = ?', [adminEmail], function(err) {
        if (err) {
          console.error('Error updating user to admin:', err);
          process.exit(1);
        }
        console.log(`User ${adminEmail} has been updated to admin successfully!`);
        console.log('Admin credentials:');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        closeDatabase();
      });
    } else {
      // Create new admin user if it doesn't exist
      const query = `INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 1)`;
      db.run(query, ['Admin User', adminEmail, hashedPassword], function(err) {
        if (err) {
          console.error('Error creating admin user:', err);
          process.exit(1);
        }
        console.log(`Admin user ${adminEmail} created successfully!`);
        console.log('Admin credentials:');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        closeDatabase();
      });
    }
  });
}

function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
      process.exit(1);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
}