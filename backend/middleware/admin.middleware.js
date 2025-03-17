const db = require('../config/db');

const checkAdmin = (req, res, next) => {
  // userId is set by auth middleware
  const userId = req.userId;
  
  if (!userId) {
    return res.status(403).send({ message: "No user ID provided!" });
  }

  db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).send({ message: err.message });
    }
    
    if (!user || !user.is_admin) {
      return res.status(403).send({ message: "Requires admin privileges!" });
    }
    
    next();
  });
};

module.exports = checkAdmin;