const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { OAuth2Client } = require('google-auth-library');

// JWT secret key - in production, use environment variables
const JWT_SECRET = 'your-secret-key';
const client = new OAuth2Client('562957089179-v0glkbdo2sc169prvf84hhrdi0p2rouj.apps.googleusercontent.com');

// Register a new user
exports.register = (req, res) => {
  const { name, email, password, phone, profileImage } = req.body;

  // Check if user already exists
  const checkQuery = 'SELECT * FROM users WHERE email = ?';
  db.get(checkQuery, [email], (err, row) => {
    if (err) {
      return res.status(500).send({ message: err.message });
    }
    
    if (row) {
      return res.status(400).send({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 8);

    // Insert user
    const insertQuery = `INSERT INTO users (name, email, password, phone, profile_image) 
                        VALUES (?, ?, ?, ?, ?)`;
    
    db.run(insertQuery, [name, email, hashedPassword, phone, profileImage], function(err) {
      if (err) {
        return res.status(500).send({ message: err.message });
      }

      // Create token
      const token = jwt.sign({ id: this.lastID }, JWT_SECRET, {
        expiresIn: 86400 // 24 hours
      });

      res.status(201).send({
        message: "User registered successfully!",
        user: {
          id: this.lastID,
          name,
          email,
          phone
        },
        token
      });
    });
  });
};

// Login user
exports.login = (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const query = 'SELECT * FROM users WHERE email = ?';
  db.get(query, [email], (err, user) => {
    if (err) {
      return res.status(500).send({ message: err.message });
    }

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Check password
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({ message: "Invalid password" });
    }

    // Create token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: 86400 // 24 hours
    });

    res.status(200).send({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profile_image,
        isAdmin: user.is_admin === 1  // Add this line
      },
      token
    });
  });
};

// Update user profile
exports.updateProfile = (req, res) => {
  // Get the user ID from the request (set by auth middleware)
  const userId = req.userId;
  const { name, email, phone, profileImage } = req.body;

  // First check if email is already taken by another user
  if (email) {
    const checkQuery = 'SELECT * FROM users WHERE email = ? AND id <> ?';
    db.get(checkQuery, [email, userId], (err, row) => {
      if (err) {
        return res.status(500).send({ message: err.message });
      }
      
      if (row) {
        return res.status(400).send({ message: "Email already used by another account" });
      }
      
      // If email is available or unchanged, proceed with update
      updateUserProfile();
    });
  } else {
    // If no email change, proceed directly
    updateUserProfile();
  }

  function updateUserProfile() {
    const updateQuery = `
      UPDATE users 
      SET name = COALESCE(?, name), 
          email = COALESCE(?, email), 
          phone = COALESCE(?, phone), 
          profile_image = COALESCE(?, profile_image)
      WHERE id = ?
    `;
    
    db.run(updateQuery, [name, email, phone, profileImage, userId], function(err) {
      if (err) {
        return res.status(500).send({ message: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).send({ message: "User not found" });
      }
      
      // Fetch updated user data
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
          return res.status(500).send({ message: err.message });
        }
        
        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }
        
        // Return updated user info (without password)
        res.status(200).send({
          message: "Profile updated successfully",
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            profileImage: user.profile_image
          }
        });
      });
    });
  }
};

// Google login/register
exports.googleAuth = async (req, res) => {
  const { email, name, profileImage } = req.body;

  if (!email) {
    return res.status(400).send({ message: 'Email is required' });
  }

  try {
    // Check if user exists
    db.get('SELECT * FROM users WHERE email = ? OR google_id = ?', [email, email], (err, user) => {
      if (err) {
        return res.status(500).send({ message: err.message });
      }

      if (user) {
        // User exists, login
        // Update profile image if provided
        if (profileImage && profileImage !== user.profile_image) {
          db.run('UPDATE users SET profile_image = ? WHERE id = ?', [profileImage, user.id]);
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, {
          expiresIn: 86400 // 24 hours
        });

        return res.status(200).send({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            profileImage: profileImage || user.profile_image,
            isAdmin: user.is_admin === 1  // Add this line
          },
          token
        });
      } else {
        // User doesn't exist, register
        const insertQuery = `INSERT INTO users (name, email, profile_image, google_id) 
                            VALUES (?, ?, ?, ?)`;

        db.run(insertQuery, [name, email, profileImage, email], function(err) {
          if (err) {
            return res.status(500).send({ message: err.message });
          }

          const token = jwt.sign({ id: this.lastID }, JWT_SECRET, {
            expiresIn: 86400 // 24 hours
          });

          res.status(201).send({
            message: "User registered via Google successfully!",
            user: {
              id: this.lastID,
              name,
              email,
              profileImage: profileImage,
              isAdmin: false  // Add this line
            },
            token
          });
        });
      }
    });
  } catch (error) {
    res.status(400).send({ message: 'Invalid Google login data' });
  }
};

// Facebook login/register
exports.facebookAuth = async (req, res) => {
  const { email, name, profileImage, facebookId } = req.body;

  if (!email && !facebookId) {
    return res.status(400).send({ message: 'Email or Facebook ID is required' });
  }

  try {
    // Check if user exists
    db.get('SELECT * FROM users WHERE email = ? OR facebook_id = ?', 
           [email, facebookId], (err, user) => {
      if (err) {
        return res.status(500).send({ message: err.message });
      }

      if (user) {
        // User exists, login
        // Update facebook_id if missing
        if (facebookId && !user.facebook_id) {
          db.run('UPDATE users SET facebook_id = ? WHERE id = ?', [facebookId, user.id]);
        }
        
        // Update profile image if provided
        if (profileImage && profileImage !== user.profile_image) {
          db.run('UPDATE users SET profile_image = ? WHERE id = ?', [profileImage, user.id]);
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, {
          expiresIn: 86400 // 24 hours
        });

        return res.status(200).send({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || null,
            profileImage: profileImage || user.profile_image || null,
            isAdmin: user.is_admin === 1  // Add this line
          },
          token
        });
      } else {
        // User doesn't exist, register
        const insertQuery = `INSERT INTO users (name, email, profile_image, facebook_id) 
                            VALUES (?, ?, ?, ?)`;

        db.run(insertQuery, [name, email, profileImage, facebookId], function(err) {
          if (err) {
            return res.status(500).send({ message: err.message });
          }

          const token = jwt.sign({ id: this.lastID }, JWT_SECRET, {
            expiresIn: 86400 // 24 hours
          });

          res.status(201).send({
            message: "User registered via Facebook successfully!",
            user: {
              id: this.lastID,
              name,
              email,
              profileImage: profileImage || null,
              isAdmin: false  // Add this line
            },
            token
          });
        });
      }
    });
  } catch (error) {
    res.status(400).send({ message: 'Invalid Facebook login data' });
  }
};