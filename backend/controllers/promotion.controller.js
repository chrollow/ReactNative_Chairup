const Promotion = require('../models/Promotion');

// Get all promotions
exports.getAllPromotions = async (req, res) => {
  try {
    const { active } = req.query;
    
    let query = {};
    if (active === 'true') {
      query.active = true;
      
      // If looking for active promotions, also check that they haven't expired
      const now = new Date();
      query.$or = [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gt: now } }
      ];
    }
    
    const promotions = await Promotion.find(query).sort({ created_at: -1 });
    res.status(200).send(promotions);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get promotion by ID
exports.getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    
    if (!promotion) {
      return res.status(404).send({ message: "Promotion not found" });
    }
    
    res.status(200).send(promotion);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Create promotion (Admin only)
exports.createPromotion = async (req, res) => {
  try {
    const { code, discountPercent, expiryDate, active, description } = req.body;
    
    // Check if promotion code already exists
    const existingPromo = await Promotion.findOne({ code: code.toUpperCase() });
    if (existingPromo) {
      return res.status(400).send({ message: "Promotion code already exists" });
    }
    
    const promotion = new Promotion({
      code: code.toUpperCase(),
      discountPercent,
      expiryDate,
      active: active !== undefined ? active : true,
      description
    });
    
    const savedPromotion = await promotion.save();
    res.status(201).send(savedPromotion);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Update promotion (Admin only)
exports.updatePromotion = async (req, res) => {
  try {
    const { code, discountPercent, expiryDate, active, description } = req.body;
    
    // Check if promotion exists
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).send({ message: "Promotion not found" });
    }
    
    // Check if updating to a code that already exists (and it's not the same promotion)
    if (code && code !== promotion.code) {
      const existingPromo = await Promotion.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      
      if (existingPromo) {
        return res.status(400).send({ message: "Promotion code already exists" });
      }
    }
    
    // Update fields
    if (code) promotion.code = code.toUpperCase();
    if (discountPercent !== undefined) promotion.discountPercent = discountPercent;
    if (expiryDate !== undefined) promotion.expiryDate = expiryDate;
    if (active !== undefined) promotion.active = active;
    if (description !== undefined) promotion.description = description;
    
    promotion.updated_at = Date.now();
    
    const updatedPromotion = await promotion.save();
    res.status(200).send(updatedPromotion);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Delete promotion (Admin only)
exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    
    if (!promotion) {
      return res.status(404).send({ message: "Promotion not found" });
    }
    
    res.status(200).send({ message: "Promotion deleted" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Validate promotion code
exports.validatePromoCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    const promotion = await Promotion.findOne({ 
      code: code.toUpperCase(),
      active: true
    });
    
    if (!promotion) {
      return res.status(200).send({ 
        valid: false,
        message: "Invalid promotion code" 
      });
    }
    
    // Check if promotion has expired
    if (promotion.expiryDate && new Date(promotion.expiryDate) < new Date()) {
      return res.status(200).send({ 
        valid: false,
        message: "This promotion has expired" 
      });
    }
    
    res.status(200).send({ 
      valid: true,
      promotion: {
        _id: promotion._id,
        code: promotion.code,
        discountPercent: promotion.discountPercent,
        expiryDate: promotion.expiryDate
      }
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};