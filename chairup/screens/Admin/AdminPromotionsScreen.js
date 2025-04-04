import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API from '../../utils/api';

const AdminPromotionsScreen = ({ navigation }) => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [editingPromo, setEditingPromo] = useState(null);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await API.get('/promotions');
      setPromotions(response.data);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      Alert.alert('Error', 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePromotion = async () => {
    if (!code || !discountPercent) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const promoData = {
        code: code.toUpperCase(),
        discountPercent: parseInt(discountPercent),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        active: true
      };

      if (editingPromo) {
        // Update existing promotion
        await API.put(`/promotions/${editingPromo._id}`, promoData);
        Alert.alert('Success', 'Promotion updated successfully');
      } else {
        // Create new promotion
        await API.post('/promotions', promoData);
        Alert.alert('Success', 'Promotion created successfully');
      }

      // Reset form and close modal
      setCode('');
      setDiscountPercent('');
      setExpiryDate('');
      setEditingPromo(null);
      setModalVisible(false);
      
      // Refresh promotions list
      fetchPromotions();
    } catch (error) {
      console.error('Error saving promotion:', error);
      Alert.alert('Error', 'Failed to save promotion');
    }
  };

  const handleEditPromotion = (promo) => {
    setEditingPromo(promo);
    setCode(promo.code);
    setDiscountPercent(promo.discountPercent.toString());
    setExpiryDate(promo.expiryDate ? new Date(promo.expiryDate).toISOString().split('T')[0] : '');
    setModalVisible(true);
  };

  const handleDeletePromotion = async (promoId) => {
    try {
      await API.delete(`/promotions/${promoId}`);
      Alert.alert('Success', 'Promotion deleted');
      fetchPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      Alert.alert('Error', 'Failed to delete promotion');
    }
  };

  const renderPromoItem = ({ item }) => {
    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
    
    return (
      <View style={[styles.promoItem, isExpired && styles.expiredPromo]}>
        <View style={styles.promoContent}>
          <View style={styles.promoHeader}>
            <Text style={styles.promoCode}>{item.code}</Text>
            {item.active ? (
              <View style={styles.activeTag}>
                <Text style={styles.activeText}>Active</Text>
              </View>
            ) : (
              <View style={styles.inactiveTag}>
                <Text style={styles.inactiveText}>Inactive</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.discount}>{item.discountPercent}% OFF</Text>
          
          {item.expiryDate && (
            <Text style={styles.expiryDate}>
              Expires: {new Date(item.expiryDate).toLocaleDateString()}
            </Text>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditPromotion(item)}
          >
            <Ionicons name="create-outline" size={22} color="#4a6da7" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                'Delete Promotion',
                `Are you sure you want to delete "${item.code}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', onPress: () => handleDeletePromotion(item._id), style: 'destructive' }
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loadingText}>Loading promotions...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={promotions}
            renderItem={renderPromoItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="pricetag-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No promotions found</Text>
                <Text style={styles.emptySubtext}>Add your first promotion</Text>
              </View>
            }
          />
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingPromo(null);
              setCode('');
              setDiscountPercent('');
              setExpiryDate('');
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>
          
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {editingPromo ? 'Edit Promotion' : 'New Promotion'}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Promo Code *</Text>
                  <TextInput
                    style={styles.input}
                    value={code}
                    onChangeText={setCode}
                    placeholder="e.g. SUMMER2023"
                    autoCapitalize="characters"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Discount Percentage *</Text>
                  <TextInput
                    style={styles.input}
                    value={discountPercent}
                    onChangeText={setDiscountPercent}
                    placeholder="e.g. 10"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Expiry Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={expiryDate}
                    onChangeText={setExpiryDate}
                    placeholder="e.g. 2023-12-31"
                  />
                </View>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSavePromotion}
                >
                  <Text style={styles.saveButtonText}>Save Promotion</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F3',
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
    padding: 16,
    paddingBottom: 80,
  },
  promoItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E6D5B8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expiredPromo: {
    opacity: 0.7,
    borderColor: '#ccc',
  },
  promoContent: {
    flex: 1,
  },
  promoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  promoCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginRight: 8,
  },
  activeTag: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  inactiveTag: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inactiveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  discount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#D7A86E',
    marginBottom: 8,
  },
  expiryDate: {
    fontSize: 14,
    color: '#666666',
  },
  actionButtons: {
    justifyContent: 'center',
  },
  editButton: {
    padding: 8,
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#333333',
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6D5B8',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  input: {
    backgroundColor: '#F8F6F3',
    borderWidth: 1,
    borderColor: '#E6D5B8',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#333333',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminPromotionsScreen;