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

const API_URL = "http://192.168.1.39:3000/api";
const BASE_URL = "http://192.168.1.39:3000"; // Base URL without /api

const CartScreen = ({ navigation }) => {
  const { stateProducts, dispatch } = useContext(ProductContext);
  const [total, setTotal] = useState(0);
  const [userId, setUserId] = useState(null);
  const isFocused = useIsFocused();
  
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  clearButton: {
    color: '#ff6b6b',
    fontSize: 16
  },
  cartList: {
    flex: 1
  },
  cartListContent: {
    paddingBottom: 20
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  productInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10
  },
  productDetails: {
    flex: 1
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  productPrice: {
    fontSize: 16,
    color: '#e91e63',
    fontWeight: 'bold'
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10
  },
  quantityButton: {
    backgroundColor: '#2196f3',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  quantityText: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center'
  },
  removeButton: {
    padding: 5
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyCartText: {
    fontSize: 18,
    color: '#555',
    marginVertical: 20
  },
  shopButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  footer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  totalText: {
    fontSize: 18,
    color: '#555'
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  checkoutButton: {
    backgroundColor: '#2196f3',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 8
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5
  },
  disabledQuantityButton: {
    backgroundColor: '#b0bec5', // Gray color for disabled state
    opacity: 0.7
  },
});

export default CartScreen;