import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment';
import { sendOrderStatusNotification } from '../../utils/notifications';

const API_URL = "http://192.168.1.39:3000/api"; // Update with your server IP

const AdminOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    fetchOrders();
  }, []);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('userToken');
      
      const response = await axios.get(
        `${API_URL}/orders`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };
  
  const handleUpdateStatus = async (orderId, currentStatus) => {
    // Don't allow updating cancelled orders
    if (currentStatus === 'cancelled') {
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
      .filter(status => status !== currentStatus)
      .map(status => ({
        text: status.charAt(0).toUpperCase() + status.slice(1),
        onPress: () => updateOrderStatus(orderId, status)
      }));
    
    // Add cancel button
    buttons.push({ text: 'Cancel', style: 'cancel' });
    
    Alert.alert(
      'Update Order Status',
      'Select new status:',
      buttons
    );
  };
  
  const updateOrderStatus = async (orderId, newStatus) => {
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
      await sendOrderStatusNotification(orderId, newStatus, response.data.user);
      
      Alert.alert('Success', 'Order status updated');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };
  
  const renderOrderItem = ({ item }) => {
    const orderDate = moment(item.created_at).format('MMM DD, YYYY');
    const statusColor = getStatusColor(item.status);
    
    return (
      <TouchableOpacity
        style={styles.orderItem}
        onPress={() => navigation.navigate('AdminOrderDetails', { orderId: item._id })}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item._id.substr(-8)}</Text>
            <Text style={styles.orderDate}>{orderDate}</Text>
            {item.status === 'cancelled' && (
              <Text style={styles.cancelledNote}>Status cannot be changed</Text>
            )}
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.orderContent}>
          <View style={styles.userInfo}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.userName}>{item.user?.name || 'Unknown User'}</Text>
          </View>
          
          <Text style={styles.itemsCount}>
            {item.orderItems?.length || 0} {item.orderItems?.length === 1 ? 'item' : 'items'}
          </Text>
          
          <View style={styles.footer}>
            <Text style={styles.totalPrice}>${item.totalPrice?.toFixed(2)}</Text>
            
            <TouchableOpacity 
              style={styles.updateButton}
              onPress={() => handleUpdateStatus(item._id, item.status)}
            >
              <Text style={styles.updateButtonText}>Update Status</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}
    </View>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cancelledNote: {
    color: '#f44336',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  orderContent: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    marginLeft: 6,
    fontSize: 14,
    color: '#333',
  },
  itemsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  updateButton: {
    backgroundColor: '#4a6da7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 10,
  }
});

export default AdminOrdersScreen;