const User = require('../models/User');

const isAdmin = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    
    if (!user.is_admin) {
      return res.status(403).send({ message: "Admin access required" });
    }
    
    next();
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

module.exports = isAdmin;