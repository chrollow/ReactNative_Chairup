import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductContext } from '../../Context/Store/ProductGlobal';
import axios from 'axios';
import ProductReviews from '../../components/Reviews/ProductReviews';
import { syncCartItem } from '../../Context/Actions/Product.actions';
import { useSelector } from 'react-redux';

const API_URL = "http://192.168.100.11:3000/api";
const BASE_URL = "http://192.168.100.11:3000"; // Base URL without /api

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const { stateProducts, dispatch } = useContext(ProductContext);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get reviews data from Redux state
  const { productReviews } = useSelector(state => state.reviews);

  // Add a ref for the ProductReviews component
  const productReviewsRef = useRef(null);

  // Fetch product details directly from API
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/products/${productId}`);
        setProduct(response.data);
        // Reset quantity to 1 whenever a new product is loaded
        setQuantity(1);
      } catch (error) {
        console.error("Error fetching product details:", error);
        Alert.alert("Error", "Failed to load product details");
        // Try to find the product in the global state as fallback
        const stateProduct = stateProducts.products.find(p => p._id === productId);
        if (stateProduct) {
          setProduct(stateProduct);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Check if we should open the review modal automatically
  useEffect(() => {
    if (route.params?.openReviewModal && product?._id) {
      // Find the ProductReviews component ref and open the modal
      setTimeout(() => {
        if (productReviewsRef.current) {
          productReviewsRef.current.openReviewModal();
        }
      }, 500); // Small delay to ensure component is mounted
    }
  }, [route.params?.openReviewModal, product]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text>Product not found</Text>
      </View>
    );
  }

  // Get available stock quantity, defaulting to 0 if not available
  const availableStock = product.stockQuantity || 0;

  // Check if the product is in stock
  const isInStock = availableStock > 0;

  // Calculate average rating from reviews
  const calculateAverageRating = () => {
    const reviews = productReviews[productId] || [];
    if (reviews.length === 0) return 0;
    
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };
  
  const avgRating = calculateAverageRating();
  const reviewCount = (productReviews[productId] || []).length;

  const increaseQuantity = () => {
    // Only increase if quantity is less than available stock
    if (quantity < availableStock) {
      setQuantity(quantity + 1);
    } else {
      // Optional: Show message when trying to add more than available stock
      Alert.alert("Maximum Quantity", `Only ${availableStock} items available in stock.`);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const addToCart = async () => {
    // Double-check that we're not adding more than the available stock
    if (quantity > availableStock) {
      Alert.alert("Insufficient Stock", `Only ${availableStock} items available.`);
      return;
    }

    // Update local state first for immediate feedback
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        product,
        quantity
      }
    });

    // Sync with server
    try {
      // Get current quantity in cart
      const existingItem = stateProducts.cart.find(item => item.product._id === product._id);
      const totalQuantity = existingItem 
        ? existingItem.quantity + quantity 
        : quantity;
        
      await syncCartItem(product._id, totalQuantity);
    } catch (error) {
      console.error('Failed to sync cart with server:', error);
    }

    Alert.alert(
      "Success",
      `${product.name} added to cart`,
      [
        { text: "Continue Shopping", style: "cancel" },
        { text: "Go to Cart", onPress: () => navigation.navigate('Cart') }
      ]
    );
  };

  // Get stock status text and color
  const getStockStatus = () => {
    if (availableStock === 0) {
      return { text: "Out of Stock", color: "#ff4d4d" };
    } else if (availableStock <= 5) {
      return { text: `Low Stock: ${availableStock} left`, color: "#ff9933" };
    } else {
      return { text: `In Stock: ${availableStock} available`, color: "#47c266" };
    }
  };

  const stockStatus = getStockStatus();

  // Render the product details as the header of our FlatList
  const renderHeader = () => (
    <>
      {product.image ? (
        <Image
          source={{ uri: `${BASE_URL}${product.image}` }}
          style={styles.productImage}
          onError={(e) => {
            console.log('Error loading image:', e.nativeEvent?.error);
          }}
        />
      ) : (
        <View style={[styles.productImage, {
          backgroundColor: '#e1e1e1',
          justifyContent: 'center',
          alignItems: 'center'
        }]}>
          <Ionicons name="image-outline" size={40} color="#999" />
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>${product.price}</Text>

        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <Ionicons
              key={star}
              name={star <= avgRating ? "star" : star - avgRating < 1 && star - avgRating > 0 ? "star-half" : "star-outline"}
              size={20}
              color="#FFD700"
            />
          ))}
          <Text style={styles.ratingText}>({avgRating}) {reviewCount > 0 ? `${reviewCount} reviews` : 'No reviews'}</Text>
        </View>

        <Text style={styles.categoryText}>
          Category: {product.category || 'Office Chair'}
        </Text>

        {/* Stock status indicator */}
        <Text style={[styles.stockStatusText, { color: stockStatus.color }]}>
          {stockStatus.text}
        </Text>

        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Quantity:</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                quantity <= 1 && styles.disabledButton
              ]}
              onPress={decreaseQuantity}
              disabled={quantity <= 1}
            >
              <Text style={[
                styles.quantityButtonText,
                quantity <= 1 && styles.disabledButtonText
              ]}>-</Text>
            </TouchableOpacity>

            <Text style={styles.quantityValue}>{quantity}</Text>

            <TouchableOpacity
              style={[
                styles.quantityButton,
                quantity >= availableStock && styles.disabledButton
              ]}
              onPress={increaseQuantity}
              disabled={quantity >= availableStock}
            >
              <Text style={[
                styles.quantityButtonText,
                quantity >= availableStock && styles.disabledButtonText
              ]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.addToCartButton,
            !isInStock && styles.disabledAddToCartButton
          ]}
          onPress={addToCart}
          disabled={!isInStock}
        >
          <Text style={styles.addToCartButtonText}>
            {isInStock ? 'Add to Cart' : 'Out of Stock'}
          </Text>
        </TouchableOpacity>

        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {product.description || 'No description available for this product.'}
          </Text>
        </View>
      </View>

      <View style={styles.reviewsHeader}>
        {/* <Text style={styles.reviewsTitle}>Customer Reviews</Text> */}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={[]} // Empty array since we're just using this for the header
        keyExtractor={() => 'header'}
        renderItem={() => null}
        ListFooterComponent={
          <ProductReviews 
            productId={product?._id} 
            ref={productReviewsRef}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F3'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F6F3'
  },
  productImage: {
    width: '100%',
    height: 350,
    resizeMode: 'cover',
    backgroundColor: '#F8F6F3'
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12
  },
  productPrice: {
    fontSize: 24,
    color: '#333333',
    fontWeight: '700',
    marginBottom: 12
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666'
  },
  categoryText: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 8
  },
  stockStatusText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24
  },
  quantityLabel: {
    fontSize: 15,
    color: '#333333',
    marginRight: 12
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F6F3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6D5B8'
  },
  quantityButton: {
    padding: 12,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333'
  },
  disabledButtonText: {
    color: '#666666'
  },
  quantityValue: {
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333'
  },
  addToCartButton: {
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledAddToCartButton: {
    backgroundColor: '#E6D5B8',
    opacity: 0.7
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  descriptionContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F6F3',
    borderRadius: 12,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#666666'
  },
  reviewsHeader: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E6D5B8',
    paddingHorizontal: 20
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12
  }
});

export default ProductDetailScreen;