const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-secret-key';

const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'] || req.headers['authorization'];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  // Remove Bearer from string if it exists
  const tokenValue = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

  jwt.verify(tokenValue, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    next();
  });
};

module.exports = verifyToken;