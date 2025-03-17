const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, async (err) => {
  if (err) {
    console.error('Could not connect to database', err);
    process.exit(1);
  } 
  
  console.log('Connected to SQLite database');
  
  // Check if stockQuantity column exists
  db.all(`PRAGMA table_info(products)`, (err, columns) => {
    if (err) {
      console.error('Error checking table schema:', err);
      process.exit(1);
    }
    
    // Check if stockQuantity column exists
    const stockQuantityExists = columns.some(column => column.name === 'stockQuantity');
    
    if (!stockQuantityExists) {
      console.log('Adding stockQuantity column to products table...');
      db.run(`ALTER TABLE products ADD COLUMN stockQuantity INTEGER DEFAULT 0`, (err) => {
        if (err) {
          console.error('Error adding stockQuantity column:', err);
          process.exit(1);
        }
        console.log('stockQuantity column added successfully');
        closeDatabase();
      });
    } else {
      console.log('stockQuantity column already exists');
      closeDatabase();
    }
  });
});

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