import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserOrders } from '../../redux/slices/orderSlice';
import moment from 'moment';

const OrdersScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.orders);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setRefreshing(true);
      await dispatch(fetchUserOrders());
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
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

  const renderOrder = ({ item }) => {
    const orderDate = moment(item.created_at).format('MMM DD, YYYY');
    
    return (
      <TouchableOpacity 
        style={styles.orderItem}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item._id.substr(-8)}</Text>
            <Text style={styles.orderDate}>{orderDate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.orderDetails}>
          <Text style={styles.itemCount}>
            {item.orderItems.length} {item.orderItems.length === 1 ? 'item' : 'items'}
          </Text>
          <Text style={styles.totalPrice}>${item.totalPrice.toFixed(2)}</Text>
        </View>
        
        <View style={styles.viewDetailsContainer}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#4a6da7" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4a6da7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrder}
        refreshing={refreshing}
        onRefresh={loadOrders}
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No orders yet</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate('Products')}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
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
    alignItems: 'center'
  },
  ordersList: {
    padding: 15,
    paddingBottom: 30
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  orderId: {
    fontSize: 16,
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
    borderRadius: 12
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  itemCount: {
    fontSize: 14,
    color: '#666'
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 10
  },
  viewDetailsText: {
    color: '#4a6da7',
    marginRight: 5,
    fontSize: 14
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 10
  },
  shopButton: {
    backgroundColor: '#4a6da7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10
  },
  shopButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});

export default OrdersScreen;