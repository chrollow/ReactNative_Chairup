import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment';
import { sendOrderStatusNotification } from '../../utils/notifications';

const API_URL = "http://192.168.1.39:3000/api"; // Update with your server IP
const BASE_URL = "http://192.168.1.39:3000"; // Add this line for image URLs

const AdminOrderDetailsScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);
  
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
      Alert.alert('Error', 'Failed to load order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
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
  
  const handleUpdateStatus = async () => {
    // Don't allow updating cancelled orders
    if (order.status === 'cancelled') {
      Alert.alert(
        'Cannot Update Order',
        'This order has been cancelled and its status cannot be changed.',
        [{ text: 'OK' }]
      );
      return;
    }

    const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    // Create buttons for each status except the current one
    const buttons = statusOptions
      .filter(status => status !== order.status)
      .map(status => ({
        text: status.charAt(0).toUpperCase() + status.slice(1),
        onPress: () => updateOrderStatus(status)
      }));
    
    // Add cancel button
    buttons.push({ text: 'Cancel', style: 'cancel' });
    
    Alert.alert(
      'Update Order Status',
      'Select new status:',
      buttons
    );
  };
  
  const updateOrderStatus = async (newStatus) => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('userToken');
      
      const response = await axios.put(
        `${API_URL}/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Send notification to the user about status update
      await sendOrderStatusNotification(orderId, newStatus, order.user?._id);
      
      Alert.alert('Success', 'Order status updated');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6da7" />
      </View>
    );
  }
  
  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
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
        
        <View style={[styles.statusContainer, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={18} color="#666" />
          <Text style={styles.infoText}>{order.user?.name}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={18} color="#666" />
          <Text style={styles.infoText}>{order.user?.email}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={18} color="#666" />
          <Text style={styles.infoText}>{order.phoneNumber}</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
        </View>
        
        <Text style={styles.addressText}>
          {order.shippingAddress.address}, {order.shippingAddress.city}, {'\n'}
          {order.shippingAddress.postalCode}, {order.shippingAddress.country}
        </Text>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
        </View>
        
        <View style={styles.paymentMethod}>
          {order.paymentMethod === 'creditCard' && (
            <Ionicons name="card-outline" size={22} color="#2196f3" />
          )}
          {order.paymentMethod === 'paypal' && (
            <Ionicons name="logo-paypal" size={22} color="#0070ba" />
          )}
          {order.paymentMethod === 'cod' && (
            <Ionicons name="cash-outline" size={22} color="#4caf50" />
          )}
          
          <Text style={styles.paymentText}>
            {order.paymentMethod === 'creditCard' && 'Credit Card'}
            {order.paymentMethod === 'paypal' && 'PayPal'}
            {order.paymentMethod === 'cod' && 'Cash on Delivery'}
          </Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Order Items</Text>
        </View>
        
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
                  onError={(e) => {
                    console.log('Error loading order item image:', item.product.name, e.nativeEvent?.error);
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>${order.itemsPrice.toFixed(2)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping:</Text>
          <Text style={styles.summaryValue}>${order.shippingPrice.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>${order.totalPrice.toFixed(2)}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.updateStatusButton}
        onPress={handleUpdateStatus}
      >
        <Text style={styles.updateStatusText}>Update Order Status</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
  },
  header: {
    backgroundColor: '#fff',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderDate: {
    marginTop: 2,
    color: '#666',
    fontSize: 14,
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    minWidth: 100,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 15,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 15,
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 15,
  },
  addressText: {
    fontSize: 15,
    lineHeight: 22,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentText: {
    marginLeft: 10,
    fontSize: 15,
  },
  orderItem: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 10,
  },
  productImageContainer: {
    marginRight: 15,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  noImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    marginBottom: 5,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 15,
    color: '#666',
  },
  productQuantity: {
    fontSize: 15,
    color: '#666',
    marginLeft: 10,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  updateStatusButton: {
    backgroundColor: '#4a6da7',
    marginHorizontal: 15,
    marginVertical: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  updateStatusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default AdminOrderDetailsScreen;