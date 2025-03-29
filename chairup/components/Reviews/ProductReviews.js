import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductReviews, createReview, editReview } from '../../redux/slices/reviewSlice';
import * as SecureStore from 'expo-secure-store';

const ProductReviews = forwardRef(({ productId }, ref) => {
  const dispatch = useDispatch();
  const { productReviews, loading, error } = useSelector(state => state.reviews);
  const [userId, setUserId] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [purchaseVerified, setPurchaseVerified] = useState(false);
  const orders = useSelector(state => state.orders.items);

  // Get user ID from secure storage
  useEffect(() => {
    const getUserData = async () => {
      try {
        const userData = await SecureStore.getItemAsync('userData');
        if (userData) {
          const user = JSON.parse(userData);
          setUserId(user._id);
          
          // Check if user has purchased this product
          const hasPurchased = checkIfProductPurchased(productId);
          setPurchaseVerified(hasPurchased);
        }
      } catch (err) {
        console.error('Failed to get user data', err);
      }
    };
    
    getUserData();
  }, [productId, orders]);

  // Fetch reviews for this product
  useEffect(() => {
    dispatch(fetchProductReviews(productId));
  }, [dispatch, productId]);

  // Check if user has purchased this product
  const checkIfProductPurchased = (productId) => {
    if (!orders || orders.length === 0) return false;
    
    // Check all orders for this product
    return orders.some(order => 
      order.items && order.items.some(item => 
        item.product && item.product._id === productId
      )
    );
  };

  // Calculate average rating
  const calculateAverageRating = () => {
    if (!productReviews[productId] || productReviews[productId].length === 0) {
      return 0;
    }
    
    const totalRating = productReviews[productId].reduce(
      (sum, review) => sum + review.rating, 0
    );
    
    return (totalRating / productReviews[productId].length).toFixed(1);
  };

  // Handle submit review (create or update)
  const handleSubmitReview = () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a review comment');
      return;
    }
    
    const reviewData = {
      rating,
      comment
    };
    
    if (editingReview) {
      // Update existing review
      dispatch(editReview({
        productId,
        reviewId: editingReview._id,
        reviewData
      })).then(result => {
        if (!result.error) {
          setShowReviewModal(false);
          setEditingReview(null);
          setRating(5);
          setComment('');
          Alert.alert('Success', 'Your review has been updated');
        } else {
          Alert.alert('Error', result.payload || 'Failed to update review');
        }
      });
    } else {
      // Create new review
      dispatch(createReview({
        productId,
        reviewData
      })).then(result => {
        if (!result.error) {
          setShowReviewModal(false);
          setRating(5);
          setComment('');
          Alert.alert('Success', 'Your review has been submitted');
        } else {
          Alert.alert('Error', result.payload || 'Failed to submit review');
        }
      });
    }
  };

  // Open edit review modal
  const openEditReview = (review) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment);
    setShowReviewModal(true);
  };

  // Render rating stars
  const renderRatingStars = (rating, size = 16, interactive = false) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity 
            key={star} 
            onPress={() => interactive && setRating(star)}
            disabled={!interactive}
          >
            <Ionicons 
              name={star <= rating ? "star" : "star-outline"} 
              size={size} 
              color={interactive ? "#FFD700" : (star <= rating ? "#FFD700" : "#ccc")}
              style={styles.starIcon} 
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render a single review item
  const renderReviewItem = ({ item }) => {
    const isUsersReview = item.user?._id === userId;
    
    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <View>
            <Text style={styles.reviewAuthor}>
              {item.user?.name || 'Anonymous'} 
              {item.verified && <Text style={styles.verifiedBadge}> ✓ Verified Purchase</Text>}
            </Text>
            <Text style={styles.reviewDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          
          {isUsersReview && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => openEditReview(item)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.ratingContainer}>
          {renderRatingStars(item.rating)}
        </View>
        
        <Text style={styles.reviewComment}>{item.comment}</Text>
      </View>
    );
  };

  // Expose the openReviewModal method
  useImperativeHandle(ref, () => ({
    openReviewModal: () => {
      setShowReviewModal(true);
    }
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customer Reviews</Text>
        <View style={styles.averageRating}>
          <Text style={styles.averageRatingValue}>{calculateAverageRating()}</Text>
          {renderRatingStars(calculateAverageRating(), 18)}
          <Text style={styles.totalReviews}>
            ({productReviews[productId]?.length || 0} {productReviews[productId]?.length === 1 ? 'review' : 'reviews'})
          </Text>
        </View>
      </View>
      
      {purchaseVerified && !productReviews[productId]?.some(review => review.user?._id === userId) && (
        <TouchableOpacity 
          style={styles.addReviewButton}
          onPress={() => setShowReviewModal(true)}
        >
          <Ionicons name="create-outline" size={18} color="#fff" style={styles.addReviewIcon} />
          <Text style={styles.addReviewText}>Write a Review</Text>
        </TouchableOpacity>
      )}
      
      {loading ? (
        <ActivityIndicator size="large" color="#4a6da7" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>Failed to load reviews. {error}</Text>
      ) : productReviews[productId]?.length > 0 ? (
        <FlatList
          data={productReviews[productId]}
          renderItem={renderReviewItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.reviewsList}
        />
      ) : (
        <View style={styles.noReviewsContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={50} color="#ccc" />
          <Text style={styles.noReviewsText}>No reviews yet</Text>
          {purchaseVerified && (
            <Text style={styles.beFirstText}>Be the first to review this product!</Text>
          )}
        </View>
      )}
      
      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingReview ? 'Edit Your Review' : 'Write a Review'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowReviewModal(false);
                setEditingReview(null);
                setRating(5);
                setComment('');
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Your Rating:</Text>
              {renderRatingStars(rating, 30, true)}
            </View>
            
            <Text style={styles.commentLabel}>Your Review:</Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience with this product..."
              multiline
              numberOfLines={5}
            />
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmitReview}
            >
              <Text style={styles.submitButtonText}>
                {editingReview ? 'Update Review' : 'Submit Review'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  averageRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  averageRatingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starIcon: {
    marginRight: 2,
  },
  totalReviews: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  addReviewButton: {
    flexDirection: 'row',
    backgroundColor: '#4a6da7',
    padding: 12,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  addReviewIcon: {
    marginRight: 8,
  },
  addReviewText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewsList: {
    paddingBottom: 20,
  },
  reviewItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  reviewAuthor: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  verifiedBadge: {
    color: '#47c266',
    fontSize: 12,
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(74, 109, 167, 0.1)',
    borderRadius: 3,
  },
  editButtonText: {
    color: '#4a6da7',
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  noReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  noReviewsText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
  },
  beFirstText: {
    marginTop: 5,
    fontSize: 14,
    color: '#888',
  },
  loader: {
    marginVertical: 20,
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#4a6da7',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default ProductReviews;