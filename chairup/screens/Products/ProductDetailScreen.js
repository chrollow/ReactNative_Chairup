import React, { useContext, useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductContext } from '../../Context/Store/ProductGlobal';
import axios from 'axios';

const API_URL = "http://192.168.1.39:3000/api";

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const { stateProducts, dispatch } = useContext(ProductContext);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch product details directly from API
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/products/${productId}`);
        setProduct(response.data);
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

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const addToCart = () => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        product,
        quantity
      }
    });
    
    Alert.alert(
      "Success",
      `${product.name} added to cart`,
      [
        { text: "Continue Shopping", style: "cancel" },
        { text: "Go to Cart", onPress: () => navigation.navigate('Cart') }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {product.image ? (
        <Image 
          source={{ uri: product.image }} 
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
              name="star" 
              size={20} 
              color="#FFD700" 
            />
          ))}
          <Text style={styles.ratingText}>(5.0)</Text>
        </View>
        
        <Text style={styles.categoryText}>
          Category: {product.category || 'Office Chair'}
        </Text>
        
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Quantity:</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity 
              style={styles.quantityButton} 
              onPress={decreaseQuantity}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            
            <Text style={styles.quantityValue}>{quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={increaseQuantity}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={addToCart}
        >
          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
        
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {product.description || 'No description available for this product.'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  productImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover'
  },
  infoContainer: {
    padding: 15
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  },
  productPrice: {
    fontSize: 22,
    color: '#e91e63',
    marginBottom: 10
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 16
  },
  categoryText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  quantityLabel: {
    fontSize: 16,
    marginRight: 10
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5
  },
  quantityButton: {
    padding: 10,
    width: 40,
    alignItems: 'center'
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  quantityValue: {
    paddingHorizontal: 15,
    fontSize: 16
  },
  addToCartButton: {
    backgroundColor: '#2196f3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  descriptionContainer: {
    marginTop: 10
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333'
  }
});

export default ProductDetailScreen;