import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const AdminDashboardScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate('AdminProducts')}
      >
        <View style={[styles.iconContainer, { backgroundColor: '#4caf50' }]}>
          <Ionicons name="cube-outline" size={24} color="#fff" />
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Product Management</Text>
          <Text style={styles.menuDescription}>Add, edit or delete products</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate('AdminOrders')}
      >
        <View style={[styles.iconContainer, { backgroundColor: '#2196f3' }]}>
          <Ionicons name="receipt-outline" size={24} color="#fff" />
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Order Management</Text>
          <Text style={styles.menuDescription}>View and update order status</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#ccc" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuDescription: {
    color: '#666',
    marginTop: 4,
  },
});

export default AdminDashboardScreen;