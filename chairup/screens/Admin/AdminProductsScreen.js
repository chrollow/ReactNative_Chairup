import React, { useEffect, useState, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from '../../Context/Store/AuthGlobal';
import { useFocusEffect } from '@react-navigation/native';

const API_URL = "http://192.168.1.39:3000/api";

const AdminProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { stateUser } = useContext(AuthContext);
  
  // This will reload data every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProducts();
      return () => {}; // cleanup function
    }, [])
  );
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert("Error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  };
  
  const deleteProduct = async (productId) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              setLoading(true);
              const token = await SecureStore.getItemAsync('userToken');
              
              await axios.delete(`${API_URL}/products/${productId}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              // Update products list after deletion
              setProducts(products.filter(p => p.id !== productId));
              Alert.alert("Success", "Product deleted successfully");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to delete product");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderProductItem = ({ item }) => {
    // Ensure stockQuantity is converted to a number
    const stockQty = Number(item.stockQuantity || 0);
    
    return (
      <View style={styles.productItem}>
        <TouchableOpacity 
          style={styles.productInfo}
          onPress={() => navigation.navigate('AdminProductEdit', { product: item })}
        >
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>${item.price}</Text>
          <View style={styles.detailsRow}>
            <Text style={styles.productCategory}>{item.category}</Text>
            <Text style={[
              styles.stockIndicator, 
              stockQty > 0 ? styles.inStock : styles.outOfStock
            ]}>
              {stockQty > 0 ? 
                `In Stock (${stockQty})` : 
                'Out of Stock'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('AdminProductEdit', { product: item })}
          >
            <Ionicons name="create-outline" size={24} color="#4a6da7" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => deleteProduct(item.id)}
          >
            <Ionicons name="trash-outline" size={24} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('AdminProductEdit')}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add New Product</Text>
      </TouchableOpacity>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No products found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#4a6da7',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
  },
  stockIndicator: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inStock: {
    backgroundColor: '#e6f7e6',
    color: '#28a745',
  },
  outOfStock: {
    backgroundColor: '#ffebeb',
    color: '#dc3545',
  },
  actions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#4a6da7',
    margin: 16,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  }
});

export default AdminProductsScreen;