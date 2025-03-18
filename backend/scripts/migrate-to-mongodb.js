const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const mongoose = require('mongoose');
const dbPath = path.resolve(__dirname, '../database.sqlite');
const User = require('../models/User');
const Product = require('../models/Product');
require('dotenv').config();

// Use MongoDB URI from .env file
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    migrateData();
  }).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Connect to SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to SQLite database', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Migration function
async function migrateData() {
  try {
    // Migrate users
    console.log('Migrating users...');
    await migrateUsers();
    
    // Migrate products
    console.log('Migrating products...');
    await migrateProducts();
    
    console.log('Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Migrate users from SQLite to MongoDB
function migrateUsers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', async (err, rows) => {
      if (err) {
        return reject(err);
      }
      
      try {
        // Clear existing users in MongoDB (optional)
        await User.deleteMany({});
        
        // Insert SQLite users into MongoDB
        for (const row of rows) {
          await User.create({
            name: row.name,
            email: row.email,
            password: row.password,
            phone: row.phone,
            profile_image: row.profile_image,
            facebook_id: row.facebook_id,
            google_id: row.google_id,
            is_admin: row.is_admin === 1,
            created_at: row.created_at ? new Date(row.created_at) : new Date()
          });
        }
        console.log(`${rows.length} users migrated`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Migrate products from SQLite to MongoDB
function migrateProducts() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM products', async (err, rows) => {
      if (err) {
        return reject(err);
      }
      
      try {
        // Clear existing products in MongoDB (optional)
        await Product.deleteMany({});
        
        // Insert SQLite products into MongoDB
        for (const row of rows) {
          await Product.create({
            name: row.name,
            price: row.price,
            category: row.category,
            description: row.description,
            image: row.image,
            stockQuantity: row.stockQuantity || 0,
            created_at: row.created_at ? new Date(row.created_at) : new Date()
          });
        }
        console.log(`${rows.length} products migrated`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}