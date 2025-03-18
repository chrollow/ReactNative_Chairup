const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const verifyToken = async (req, res, next) => {
  const token = req.headers['x-access-token'] || req.headers['authorization'];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  // Remove Bearer from string if it exists
  const tokenValue = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

  try {
    const decoded = jwt.verify(tokenValue, JWT_SECRET);
    req.userId = decoded.id;
    
    // Optionally verify the user exists in database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).send({ message: "User no longer exists!" });
    }
    
    next();
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized!" });
  }
};

module.exports = verifyToken;