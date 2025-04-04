require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const CartItem = require('../models/SqliteCart'); // Updated import
const Product = require('../models/Product'); // Add Product model import

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Add profile image path if uploaded
    const profileImage = req.file ? `/uploads/${req.file.filename}` : '';
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      return res.status(400).send({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 8);

    // Create new user
    user = new User({
      name,
      email, 
      password: hashedPassword,
      phone,
      profile_image: profileImage
    });

    await user.save();

    // Create token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: 86400 // 24 hours
    });

    res.status(201).send({
      message: "User registered successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // Check password
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({ message: "Invalid password" });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: 86400 // 24 hours
    });

    // Find user's cart using SQLite CartItem model
    const cartItems = await CartItem.findAll({
      where: { userId: user._id.toString() }
    });

    // Get product details from MongoDB for cart items
    let cartWithProducts = [];
    if (cartItems && cartItems.length > 0) {
      const productIds = cartItems.map(item => item.productId);
      const products = await Product.find({ _id: { $in: productIds } });
      
      // Map products to cart items
      cartWithProducts = cartItems.map(item => {
        const product = products.find(p => p._id.toString() === item.productId);
        return {
          product: product ? {
            _id: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            stockQuantity: product.stockQuantity,
            category: product.category
          } : null,
          quantity: item.quantity
        };
      }).filter(item => item.product); // Filter out items with no matching product
    }

    // Send response with user info, token, and cart
    res.status(200).send({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profile_image,
        isAdmin: user.is_admin
      },
      token,
      cart: cartWithProducts
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.userId;
    
    // Add profile image if uploaded
    const profileImage = req.file ? `/uploads/${req.file.filename}` : undefined;

    // First check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).send({ message: "Email already used by another account" });
      }
    }
    
    // Find and update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name: name || undefined,
          email: email || undefined, 
          phone: phone || undefined,
          profile_image: profileImage || undefined
        }
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).send({ message: "User not found" });
    }
    
    // Return updated user info
    res.status(200).send({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        profileImage: updatedUser.profile_image // Make sure this field name is consistent
      }
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
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
    let user = await User.findOne({ 
      $or: [{ email }, { google_id: email }] 
    });
    
    if (user) {
      // Update existing user's profile if needed
      if (profileImage && profileImage !== user.profile_image) {
        user.profile_image = profileImage;
        await user.save();
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET, {
        expiresIn: 86400
      });

      return res.status(200).send({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profileImage: profileImage || user.profile_image,
          isAdmin: user.is_admin
        },
        token
      });
    }

    // Create new user if not exists
    user = new User({
      name,
      email,
      profile_image: profileImage,
      google_id: email
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, {
      expiresIn: 86400
    });

    res.status(201).send({
      message: "Registered successfully via Google!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profile_image,
        isAdmin: user.is_admin
      },
      token
    });
  } catch (error) {
    console.error('Google auth error:', error);
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
    let user = await User.findOne({ 
      $or: [{ email }, { facebook_id: facebookId }] 
    });
    
    if (user) {
      // User exists, login
      // Update facebook_id if missing
      if (facebookId && !user.facebook_id) {
        user.facebook_id = facebookId;
        await user.save();
      }
      
      // Update profile image if provided
      if (profileImage && profileImage !== user.profile_image) {
        user.profile_image = profileImage;
        await user.save();
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET, {
        expiresIn: 86400 // 24 hours
      });

      return res.status(200).send({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || null,
          profileImage: profileImage || user.profile_image || null,
          isAdmin: user.is_admin
        },
        token
      });
    } else {
      // User doesn't exist, register
      user = new User({
        name,
        email,
        profile_image: profileImage,
        facebook_id: facebookId
      });

      await user.save();

      const token = jwt.sign({ id: user._id }, JWT_SECRET, {
        expiresIn: 86400 // 24 hours
      });

      res.status(201).send({
        message: "User registered via Facebook successfully!",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profile_image || null,
          isAdmin: user.is_admin
        },
        token
      });
    }
  } catch (error) {
    res.status(400).send({ message: 'Invalid Facebook login data' });
  }
};