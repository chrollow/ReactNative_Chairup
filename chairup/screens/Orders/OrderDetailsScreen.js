import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment';

const API_URL = "http://192.168.1.39:3000/api"; // Update with your server IP
const BASE_URL = "http://192.168.1.39:3000"; // Base URL without /api

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('userToken');
      
      const response = await axios.get(
        `${API_URL}/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    // Show confirmation dialog
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order? This action cannot be undone.",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel Order", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('userToken');
              
              const response = await axios.put(
                `${API_URL}/orders/${orderId}/cancel`,
                {},
                {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                }
              );
              
              // Refresh order details
              fetchOrderDetails();
              Alert.alert('Success', 'Your order has been cancelled');
            } catch (error) {
              console.error('Error cancelling order:', error);
              
              // Show different error messages based on response
              const errorMessage = error.response?.data?.message || 'Failed to cancel order';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'processing': return '#2196f3';
      case 'shipped': return '#8bc34a';
      case 'delivered': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4a6da7" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#f44336" />
        <Text style={styles.errorText}>{error || "Order not found"}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{order._id.substr(-8)}</Text>
          <Text style={styles.orderDate}>
            {moment(order.created_at).format('MMMM DD, YYYY • h:mm A')}
          </Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.statusTrackerContainer}>
        <Text style={styles.statusTrackerTitle}>Order Status</Text>
        
        <View style={styles.statusTracker}>
          {['pending', 'processing', 'shipped', 'delivered'].map((status, index) => {
            const isActive = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= index;
            const isCurrent = order.status === status;
            
            return (
              <View key={status} style={styles.statusStep}>
                <View style={[
                  styles.statusDot,
                  isActive ? styles.activeDot : styles.inactiveDot,
                  isCurrent && styles.currentDot
                ]}>
                  {isCurrent && (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  )}
                </View>
                
                <Text style={[
                  styles.statusStepText,
                  isActive ? styles.activeStepText : styles.inactiveStepText,
                  isCurrent && styles.currentStepText
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
                
                {index < 3 && (
                  <View style={[
                    styles.statusLine,
                    isActive && index < ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) 
                      ? styles.activeLine 
                      : styles.inactiveLine
                  ]} />
                )}
              </View>
            );
          })}
        </View>
        
        {order.status === 'cancelled' && (
          <View style={styles.cancelledBadge}>
            <Ionicons name="close-circle" size={16} color="#fff" />
            <Text style={styles.cancelledText}>Order Cancelled</Text>
          </View>
        )}
      </View>

      {/* Cancel Order Button - Only show for pending or processing orders */}
      {(order.status === 'pending' || order.status === 'processing') && (
        <View style={styles.cancelOrderContainer}>
          <TouchableOpacity 
            style={styles.cancelOrderButton}
            onPress={handleCancelOrder}
          >
            <Ionicons name="close-circle-outline" size={18} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.cancelOrderButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <Text style={styles.addressText}>
          {order.shippingAddress.address}, {order.shippingAddress.city}, {'\n'}
          {order.shippingAddress.postalCode}, {order.shippingAddress.country}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.paymentMethod}>
          {order.paymentMethod === 'creditCard' && (
            <Ionicons name="card-outline" size={24} color="#2196f3" />
          )}
          {order.paymentMethod === 'paypal' && (
            <Ionicons name="logo-paypal" size={24} color="#0070ba" />
          )}
          {order.paymentMethod === 'cod' && (
            <Ionicons name="cash-outline" size={24} color="#4caf50" />
          )}
          
          <Text style={styles.paymentText}>
            {order.paymentMethod === 'creditCard' && 'Credit Card'}
            {order.paymentMethod === 'paypal' && 'PayPal'}
            {order.paymentMethod === 'cod' && 'Cash on Delivery'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        
        {order.orderItems.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <View style={styles.productImageContainer}>
              {item.product.image ? (
                <Image 
                  source={{ 
                    uri: item.product.image.startsWith('/uploads/') 
                      ? `${BASE_URL}${item.product.image}` 
                      : item.product.image 
                  }}
                  style={styles.productImage}
                  resizeMode="cover"
                  onError={(e) => {
                    console.log('Error loading order item image:', e.nativeEvent?.error);
                  }}
                />
              ) : (
                <View style={[styles.productImage, styles.noImage]}>
                  <Ionicons name="image-outline" size={24} color="#ccc" />
                </View>
              )}
            </View>
            
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.product.name}</Text>
              <View style={styles.productDetails}>
                <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                <Text style={styles.productQuantity}>×{item.quantity}</Text>
              </View>
              <Text style={styles.itemTotal}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Items:</Text>
          <Text style={styles.summaryValue}>${order.itemsPrice.toFixed(2)}</Text>
        </View>
        
        {/* Add discount row if the order has a discount */}
        {order.discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>Discount:</Text>
            <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>-${order.discount.toFixed(2)}</Text>
          </View>
        )}
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping:</Text>
          <Text style={styles.summaryValue}>${order.shippingPrice.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>${order.totalPrice.toFixed(2)}</Text>
        </View>
      </View>

      {order.status === 'delivered' && (
        <View style={styles.reviewButtonContainer}>
          <Text style={styles.reviewHeading}>Happy with your purchase?</Text>
          {order.orderItems && order.orderItems.map((orderItem, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.reviewButton}
              onPress={() => {
                // Properly access the product data
                const product = orderItem.product;
                if (product && product._id) {
                  navigation.navigate('ProductDetail', { 
                    productId: product._id,
                    name: product.name || 'Product',
                    openReviewModal: true  // Flag to auto-open review modal
                  });
                } else {
                  Alert.alert('Error', 'Product information not available');
                }
              }}
            >
              <Text style={styles.reviewButtonText}>
                Review "{orderItem.product?.name || 'Product'}"
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Render review item with image */}
      {order.reviews && order.reviews.map((review, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>Review by {review.user.name}</Text>
          <Text>{review.comment}</Text>
          {review.image && (
            <View style={styles.reviewImageContainer}>
              <Image
                source={{ 
                  uri: review.image.startsWith('/uploads/') 
                    ? `${BASE_URL}${review.image}` 
                    : review.image 
                }}
                style={styles.reviewImage}
                resizeMode="cover"
              />
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10
  },
  backButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4a6da7',
    borderRadius: 5
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold'
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
  orderInfo: {
    flex: 1
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  addressText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333'
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  paymentText: {
    fontSize: 15,
    marginLeft: 10,
    color: '#333'
  },
  orderItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
    marginBottom: 15
  },
  orderItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  productImageContainer: {
    marginRight: 15
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 5
  },
  noImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  productInfo: {
    flex: 1
  },
  productName: {
    fontSize: 16,
    marginBottom: 5
  },
  productDetails: {
    flexDirection: 'row'
  },
  productPrice: {
    fontSize: 14,
    color: '#666'
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666'
  },
  summaryValue: {
    fontSize: 15
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    marginTop: 5
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e91e63'
  },
  reviewButtonContainer: {
    marginHorizontal: 15,
    marginBottom: 25,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  reviewHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  reviewButton: {
    flexDirection: 'row',
    backgroundColor: '#4a6da7',
    borderRadius: 8,
    padding: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  buttonIcon: {
    marginRight: 8
  },
  statusTrackerContainer: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  statusTrackerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15
  },
  statusTracker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    position: 'relative',
    height: 60
  },
  statusStep: {
    alignItems: 'center',
    width: '25%',
    position: 'relative'
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5
  },
  activeDot: {
    backgroundColor: '#4a6da7'
  },
  inactiveDot: {
    backgroundColor: '#e0e0e0'
  },
  currentDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4caf50',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3
  },
  statusLine: {
    position: 'absolute',
    top: 12,
    right: -50,
    width: 50,
    height: 2
  },
  activeLine: {
    backgroundColor: '#4a6da7'
  },
  inactiveLine: {
    backgroundColor: '#e0e0e0'
  },
  statusStepText: {
    fontSize: 12,
    textAlign: 'center'
  },
  activeStepText: {
    color: '#4a6da7'
  },
  inactiveStepText: {
    color: '#999'
  },
  currentStepText: {
    color: '#4caf50',
    fontWeight: 'bold'
  },
  cancelledBadge: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 10
  },
  cancelledText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5
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
  cancelOrderContainer: {
    marginHorizontal: 15,
    marginTop: -5,
    marginBottom: 15,
  },
  cancelOrderButton: {
    flexDirection: 'row',
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default OrderDetailsScreen;