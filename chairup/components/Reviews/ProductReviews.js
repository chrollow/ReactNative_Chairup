const BASE_URL = "http://192.168.100.11:3000"; // Use your server IP here

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
  ActivityIndicator,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductReviews, createReview, editReview } from '../../redux/slices/reviewSlice';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';

const ProductReviews = forwardRef(({ productId }, ref) => {
  const dispatch = useDispatch();
  const { productReviews, loading, error } = useSelector(state => state.reviews);
  const [userId, setUserId] = useState(null);
  const [rating, setRating] = useState(5); // Default to 5 stars
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [comment, setComment] = useState('');
  const [editingReview, setEditingReview] = useState(null);
  const [purchaseVerified, setPurchaseVerified] = useState(false);
  const [reviewImage, setReviewImage] = useState(null);
  const orders = useSelector(state => state.orders.items);

  // Get user ID from secure storage and fetch reviews
  useEffect(() => {
    const getUserDetails = async () => {
      try {
        // Get the full userData object instead of just userId
        const userDataString = await SecureStore.getItemAsync('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          // The ID is likely stored as 'id' in the userData object
          const storedUserId = userData.id; // or userData._id if that's how it's structured
          console.log("Retrieved userId from userData:", storedUserId);
          setUserId(storedUserId);
        } else {
          console.log("No user data found in SecureStore");
        }
        
        if (productId) {
          dispatch(fetchProductReviews(productId));
          checkIfProductPurchased(productId);
        }
      } catch (error) {
        console.error('Error getting user details:', error);
      }
    };
    
    getUserDetails();
  }, [productId, orders]);

  // Add this new effect to monitor userId changes
  useEffect(() => {
    if (userId) {
      console.log("User ID has been set to:", userId);
      // Force a re-render of reviews with the new userId
      if (productId && productReviews[productId]) {
        const userReview = productReviews[productId].find(review => review.user?._id === userId);
        console.log("User's review found:", userReview ? userReview._id : "None");
      }
    }
  }, [userId, productReviews]);

  // Check if user has purchased this product
  const checkIfProductPurchased = async (productId) => {
    try {
      // Use the userId from state instead of fetching from SecureStore again
      if (!userId) return false;
      
      // Check if orders exists and is an array before using it
      if (!orders || !Array.isArray(orders)) {
        console.log("Orders not available:", orders);
        return false;
      }
      
      // Check if this user has any completed orders with this product
      const hasOrdered = orders.some(order => 
        order.status === 'delivered' && 
        order.orderItems && Array.isArray(order.orderItems) &&
        order.orderItems.some(item => 
          item.product && item.product._id === productId
        )
      );
      
      console.log("Has ordered this product:", hasOrdered);
      setPurchaseVerified(hasOrdered);
      return hasOrdered;
    } catch (error) {
      console.error('Error checking purchase status:', error);
      return false;
    }
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
  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a review comment');
      return;
    }
    
    try {
      // Create FormData object for image upload
      const formData = new FormData();
      formData.append('rating', rating.toString());
      formData.append('comment', comment);
      
      // Add image if selected
      if (reviewImage) {
        const filename = reviewImage.split('/').pop();
        // Ensure we have a valid extension
        const match = /\.(\w+)$/.exec(filename) || [null, 'jpg'];
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        console.log("Adding image to form data:", {
          uri: reviewImage,
          name: filename,
          type: type
        });
        
        formData.append('reviewImage', {
          uri: Platform.OS === 'ios' ? reviewImage.replace('file://', '') : reviewImage,
          name: filename || `image.${type.split('/')[1]}`,
          type: type
        });
      }
      
      // Log the request details for debugging
      console.log(`Updating review ${editingReview?._id} for product ${productId}`);
      
      if (editingReview) {
        // Update existing review with image
        const result = await dispatch(editReview({
          productId,
          reviewId: editingReview._id,
          reviewData: formData
        }));
        
        if (!result.error) {
          setShowReviewModal(false);
          setEditingReview(null);
          setRating(5);
          setComment('');
          setReviewImage(null);
          
          // Force refresh reviews
          dispatch(fetchProductReviews(productId));
          
          Alert.alert('Success', 'Your review has been updated');
        } else {
          Alert.alert('Error', result.payload || 'Failed to update review. Please try again.');
        }
      } else {
        // Create new review
        console.log(`Creating new review for product ${productId}`);
        
        const result = await dispatch(createReview({
          productId,
          reviewData: formData
        }));
        
        if (!result.error) {
          setShowReviewModal(false);
          setRating(5);
          setComment('');
          setReviewImage(null);
          
          // Force refresh reviews
          dispatch(fetchProductReviews(productId));
          
          Alert.alert('Success', 'Your review has been submitted');
        } else {
          Alert.alert('Error', result.payload || 'Failed to submit review. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review with image');
    }
  };

  // Open edit review modal
  const openEditReview = (review) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment);
    setReviewImage(review.image || null); // Set image if it exists
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

  // Check if the current user has a review
  const getUserReview = () => {
    if (!userId || !productReviews[productId]) return null;
    return productReviews[productId].find(review => review.user?._id === userId);
  };

  // Render a single review item
  const renderReviewItem = ({ item }) => {
    const isUsersReview = item.user?._id === userId;
    
    // Log for debugging
    console.log("Review item:", item._id, "User ID:", userId, "Is user's review:", isUsersReview);
    
    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          {/* User Avatar and Info */}
          <View style={styles.reviewAuthorContainer}>
            {item.user?.profileImage ? (
              <Image 
                source={{ 
                  uri: item.user.profileImage.startsWith('/uploads/') 
                    ? `${BASE_URL}${item.user.profileImage}`
                    : item.user.profileImage
                }}
                style={styles.reviewAuthorAvatar}
                onError={(e) => {
                  console.log("Failed to load profile image:", e.nativeEvent?.error);
                }}
              />
            ) : (
              <View style={styles.defaultAvatarContainer}>
                <Text style={styles.defaultAvatarText}>
                  {item.user?.name ? item.user.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            
            <View style={styles.authorDetails}>
              <Text style={styles.reviewAuthor}>
                {item.user?.name || 'Anonymous'} 
                {item.verified && <Text style={styles.verifiedBadge}> ✓ Verified Purchase</Text>}
              </Text>
              <Text style={styles.reviewDate}>
                {item.created_at ? moment(item.created_at).format('MMM DD, YYYY') : 'No date'}
              </Text>
            </View>
          </View>
          
          {/* Edit Button */}
          {isUsersReview && (
            <TouchableOpacity 
              style={styles.prominentEditButton}
              onPress={() => {
                console.log("Edit button pressed for review:", item._id);
                openEditReview(item);
              }}
            >
              <Ionicons name="create" size={16} color="#fff" style={{ marginRight: 5 }} />
              <Text style={styles.prominentEditButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.ratingContainer}>
          {renderRatingStars(item.rating)}
        </View>
        
        <Text style={styles.reviewComment}>{item.comment}</Text>
        
        {item.image && (
          <View style={styles.reviewImageContainer}>
            <Image
              source={{ 
                uri: item.image.startsWith('/uploads/') 
                  ? `${BASE_URL}${item.image}` 
                  : item.image 
              }}
              style={styles.reviewImage}
              resizeMode="cover"
            />
          </View>
        )}
        
        {isUsersReview && (
          <View style={styles.bottomEditContainer}>
            <TouchableOpacity 
              style={styles.secondaryEditButton}
              onPress={() => {
                console.log("Bottom edit button pressed for review:", item._id);
                openEditReview(item);
              }}
            >
              <Ionicons name="pencil" size={16} color="#2196f3" style={{ marginRight: 5 }} />
              <Text style={styles.secondaryEditButtonText}>Edit Your Review</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Image picker functions
  const pickReviewImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to grant camera roll permissions to upload images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setReviewImage(result.assets[0].uri);
    }
  };

  const takeReviewPhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to grant camera permissions to take photos");
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log("Camera image selected:", result.assets[0].uri);
        setReviewImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Error taking photo:", err);
      Alert.alert("Error", "Could not take photo. Please try again.");
    }
  };

  const clearReviewImage = () => {
    setReviewImage(null);
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
                setReviewImage(null);
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

            <Text style={styles.imageLabel}>Add Photo (Optional):</Text>
            <View style={styles.imageUploadContainer}>
              {reviewImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: reviewImage }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={clearReviewImage}
                  >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.imagePickerButton}
                    onPress={takeReviewPhoto}
                  >
                    <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.imagePickerButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.imagePickerButton}
                    onPress={pickReviewImage}
                  >
                    <Ionicons name="images" size={20} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.imagePickerButtonText}>Choose Image</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
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
  editYourReviewContainer: {
    marginBottom: 15,
  },
  editYourReviewButton: {
    flexDirection: 'row',
    backgroundColor: '#2196f3',
    padding: 12,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editYourReviewButtonText: {
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
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewAuthorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  defaultAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4a6da7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  defaultAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  authorDetails: {
    flex: 1,
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
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  prominentEditButton: {
    flexDirection: 'row',
    backgroundColor: '#2196f3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  prominentEditButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bottomEditContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  secondaryEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 5,
  },
  secondaryEditButtonText: {
    color: '#2196f3',
    fontSize: 14,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  reviewImageContainer: {
    marginTop: 10,
    marginBottom: 5,
  },
  reviewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
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
  imageLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  imageUploadContainer: {
    marginBottom: 20,
  },
  imagePickerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imagePickerButton: {
    flexDirection: 'row',
    backgroundColor: '#4a6da7',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.48,
  },
  imagePickerButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 5,
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