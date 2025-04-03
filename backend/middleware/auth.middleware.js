const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library'); // Import Google Auth Library
const User = require('../models/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // Add your Google Client ID here

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const verifyToken = async (req, res, next) => {
  const token = req.headers['x-access-token'] || req.headers['authorization'];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  // Remove Bearer from string if it exists
  const tokenValue = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

  try {
    // Check if it's a Google ID token
    if (tokenValue.startsWith('ey')) {
      // Verify Google ID token
      const ticket = await client.verifyIdToken({
        idToken: tokenValue,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { sub: googleId, email, name, picture } = payload;

      // Check if user exists in the database
      let user = await User.findOne({ email });
      if (!user) {
        // Optionally create a new user if they don't exist
        user = await User.create({
          googleId,
          email,
          name,
          profileImage: picture,
        });
      }

      // Attach user ID to the request
      req.userId = user._id;
      return next();
    }

    // Otherwise, verify your own JWT
    const decoded = jwt.verify(tokenValue, JWT_SECRET);
    req.userId = decoded.id;

    // Optionally verify the user exists in the database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).send({ message: "User no longer exists!" });
    }

    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).send({ message: "Unauthorized!" });
  }
};

module.exports = verifyToken;