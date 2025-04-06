import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductContext } from '../../Context/Store/ProductGlobal';
import { useIsFocused } from '@react-navigation/native';
import { syncCartItem, deleteCartItem, clearServerCart, fetchUserCart } from '../../Context/Actions/Product.actions';
import * as SecureStore from 'expo-secure-store';
import PromotionModal from '../../components/Promotions/PromotionModal';
import axios from 'axios';
import { API_URL } from '../../utils/api';

const BASE_URL = "http://192.168.100.11:3000"; // Base URL without /api

const CartScreen = ({ navigation, route }) => {
  const { stateProducts, dispatch } = useContext(ProductContext);
  const [total, setTotal] = useState(0);
  const [userId, setUserId] = useState(null);
  const isFocused = useIsFocused();
  const [promotionModalVisible, setPromotionModalVisible] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState(null);
  
  // Get current user ID for debugging
  useEffect(() => {
    const getUserData = async () => {
      try {
        const userData = await SecureStore.getItemAsync('userData');
        if (userData) {
          const user = JSON.parse(userData);
          setUserId(user.id || user._id);
          console.log("Current cart user:", user.id || user._id);
        }
      } catch (err) {
        console.error('Failed to get user data', err);
      }
    };
    
    getUserData();
  }, []);
  
  // Calculate total whenever cart changes
  useEffect(() => {
    if (stateProducts && stateProducts.cart) {
      let sum = 0;
      stateProducts.cart.forEach(item => {
        sum += (item.product.price * item.quantity);
      });
      setTotal(sum);
    }
  }, [stateProducts.cart, isFocused]);
  
  // Explicitly refresh cart data when screen is focused
  useEffect(() => {
    if (isFocused) {
      console.log("Cart screen is focused, refreshing cart data");
      refreshCartData();
    }
  }, [isFocused]);
  
  // Add useEffect to handle promotion code from navigation params
  useEffect(() => {
    if (route.params?.promoCode && route.params?.showPromoModal) {
      fetchPromotion(route.params.promoCode);
    }
  }, [route.params]);
  
  // Function to refresh cart data from server
  const refreshCartData = async () => {
    try {
      console.log("Explicitly fetching fresh cart data from server...");
      const result = await fetchUserCart();
      
      if (result.success) {
        console.log(`Loaded ${result.cart.length} cart items for current user`);
        
        // Update cart in global state
        dispatch({
          type: 'SET_CART',
          payload: result.cart
        });
      } else {
        console.error("Failed to refresh cart:", result.message);
      }
    } catch (error) {
      console.error("Error refreshing cart:", error);
    }
  };
  
  const updateQuantity = async (productId, change) => {
    const cartItem = stateProducts.cart.find(item => item.product._id === productId);
    if (!cartItem) return;
    
    const newQuantity = cartItem.quantity + change;
    
    // When increasing quantity, check against available stock
    if (change > 0) {
      const availableStock = cartItem.product.stockQuantity;
      
      if (cartItem.quantity >= availableStock) {
        Alert.alert(
          "Maximum Stock Reached",
          `Sorry, there are only ${availableStock} items available in stock.`,
          [{ text: "OK" }]
        );
        return;
      }
    }
    
    // Update local state first for immediate feedback
    dispatch({
      type: 'UPDATE_CART_ITEM',
      payload: {
        productId,
        newQuantity
      }
    });
    
    // Then sync with server
    if (newQuantity > 0) {
      try {
        await syncCartItem(productId, newQuantity);
      } catch (error) {
        console.error('Failed to sync cart with server:', error);
        // Optional: Show error message
      }
    } else {
      removeItem(productId);
    }
  };
  
  const removeItem = async (productId) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          onPress: async () => {
            // Update local state
            dispatch({
              type: 'REMOVE_FROM_CART',
              payload: productId
            });
            
            // Sync with server
            try {
              await deleteCartItem(productId);
            } catch (error) {
              console.error('Failed to remove item from server cart:', error);
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const clearCart = () => {
    if (stateProducts.cart.length === 0) return;
    
    Alert.alert(
      "Clear Cart",
      "Are you sure you want to clear your entire cart?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          onPress: async () => {
            // Update local state
            dispatch({ type: 'CLEAR_CART' });
            
            // Sync with server
            try {
              await clearServerCart();
            } catch (error) {
              console.error('Failed to clear server cart:', error);
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleCheckout = () => {
    if (stateProducts.cart.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart before checkout");
      return;
    }
    
    navigation.navigate("Checkout");
  };
  
  const fetchPromotion = async (code) => {
    try {
      const response = await axios.get(`${API_URL}/promotions/validate/${code}`);
      if (response.data.valid) {
        setCurrentPromotion(response.data.promotion);
        setPromotionModalVisible(true);
        
        // Clear the route params
        navigation.setParams({
          promoCode: undefined,
          showPromoModal: undefined
        });
      }
    } catch (error) {
      console.error('Error fetching promotion:', error);
    }
  };
  
  const renderCartItem = ({ item }) => {
    const { product, quantity } = item;
    
    return (
      <View style={styles.cartItem}>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProductDetail', {
            productId: product._id,
            name: product.name
          })}
          style={styles.productInfo}
        >
          {product.image ? (
            <Image 
              source={{ 
                uri: product.image.startsWith('/uploads/') 
                  ? `${BASE_URL}${product.image}` 
                  : product.image || 'https://via.placeholder.com/100'
              }} 
              style={styles.productImage}
              onError={(e) => {
                console.log('Error loading cart image:', e.nativeEvent?.error);
              }}
            />
          ) : (
            <View style={[styles.productImage, { backgroundColor: '#e1e1e1', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="image-outline" size={30} color="#999" />
            </View>
          )}
          
          <View style={styles.productDetails}>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            <Text style={styles.productPrice}>${product.price}</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(product._id, -1)}
          >
            <Ionicons name="remove" size={16} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{quantity}</Text>
          
          <TouchableOpacity
            style={[
              styles.quantityButton,
              quantity >= product.stockQuantity && styles.disabledQuantityButton
            ]}
            onPress={() => updateQuantity(product._id, 1)}
            disabled={quantity >= product.stockQuantity}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeItem(product._id)}
        >
          <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        {stateProducts.cart && stateProducts.cart.length > 0 && (
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {stateProducts.cart && stateProducts.cart.length > 0 ? (
        <FlatList
          data={stateProducts.cart}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.product._id.toString()}
          style={styles.cartList}
          contentContainerStyle={styles.cartListContent}
          extraData={stateProducts.cart} // Add this to force re-render when cart changes
        />
      ) : (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => navigation.navigate('Products')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {stateProducts.cart && stateProducts.cart.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total:</Text>
            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      
      <PromotionModal
        visible={promotionModalVisible}
        onClose={() => setPromotionModalVisible(false)}
        promotion={currentPromotion}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F3'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#333333',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  clearButton: {
    color: '#E6D5B8',
    fontSize: 16,
    fontWeight: '600'
  },
  cartList: {
    flex: 1,
  },
  cartListContent: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E6D5B8',
  },
  productInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '700',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: '#F8F6F3',
    borderRadius: 12,
    padding: 8,
  },
  quantityButton: {
    backgroundColor: '#333333',
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#333333',
    marginVertical: 20,
    fontWeight: '600',
  },
  shopButton: {
    backgroundColor: '#333333',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 2,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#E6D5B8',
    elevation: 4,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalText: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
  },
  checkoutButton: {
    backgroundColor: '#333333',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  disabledQuantityButton: {
    backgroundColor: '#E6D5B8',
    opacity: 0.7,
  },
});

export default CartScreen;