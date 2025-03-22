const Review = require('../models/Review');
const Order = require('../models/Order');

// Create new review
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    
    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      user: req.userId,
      product: productId
    });
    
    if (existingReview) {
      return res.status(400).send({ message: "You have already reviewed this product" });
    }
    
    // Check if user has purchased the product (for verified purchase badge)
    const purchaseVerified = await Order.exists({
      user: req.userId,
      'orderItems.product': productId,
      status: { $in: ['delivered', 'shipped'] }
    });
    
    const review = new Review({
      rating: Number(rating),
      comment,
      product: productId,
      user: req.userId,
      verified: !!purchaseVerified
    });
    
    const savedReview = await review.save();
    
    // Return populated review
    const populatedReview = await Review.findById(savedReview._id)
      .populate({
        path: 'user',
        select: 'name profileImage'
      });
      
    res.status(201).send(populatedReview);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Update review
exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { id, reviewId } = req.params;
    
    // Find review and check ownership
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).send({ message: "Review not found" });
    }
    
    if (review.user.toString() !== req.userId) {
      return res.status(403).send({ message: "Not authorized to update this review" });
    }
    
    review.rating = Number(rating);
    review.comment = comment;
    
    const updatedReview = await review.save();
    
    // Return populated review
    const populatedReview = await Review.findById(updatedReview._id)
      .populate({
        path: 'user',
        select: 'name profileImage'
      });
      
    res.status(200).send(populatedReview);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get all reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    
    const reviews = await Review.find({ product: productId })
      .populate({
        path: 'user',
        select: 'name profileImage'
      })
      .sort({ created_at: -1 });
      
    res.status(200).send(reviews);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// Get all reviews by current user
exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.userId })
      .populate({
        path: 'product',
        select: 'name image'
      })
      .sort({ created_at: -1 });
      
    res.status(200).send(reviews);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};