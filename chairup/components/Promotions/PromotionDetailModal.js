import React from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity,
  Clipboard,
  ToastAndroid,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PromotionDetailModal = ({ visible, onClose, promotion }) => {
  if (!promotion) return null;
  
  const copyToClipboard = () => {
    Clipboard.setString(promotion.code);
    
    // Show feedback based on platform
    if (Platform.OS === 'android') {
      ToastAndroid.show('Promo code copied to clipboard!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Copied!', 'Promo code copied to clipboard');
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'No expiration';
    const date = new Date(dateString);
    return `Expires: ${date.toLocaleDateString()}`;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{promotion.discountPercent}% OFF</Text>
          </View>
          
          <Text style={styles.title}>Special Offer!</Text>
          
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Use code:</Text>
            <TouchableOpacity style={styles.codeBox} onPress={copyToClipboard}>
              <Text style={styles.code}>{promotion.code}</Text>
              <Ionicons name="copy-outline" size={20} color="#4a6da7" />
            </TouchableOpacity>
          </View>
          
          {promotion.description && (
            <Text style={styles.description}>{promotion.description}</Text>
          )}
          
          <Text style={styles.expiryDate}>{formatDate(promotion.expiryDate)}</Text>
          
          <TouchableOpacity style={styles.shopButton} onPress={onClose}>
            <Text style={styles.shopButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 1,
  },
  discountBadge: {
    backgroundColor: '#D7A86E',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 15,
  },
  discountText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333333',
  },
  codeContainer: {
    width: '100%',
    marginBottom: 15,
  },
  codeLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  codeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  code: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  expiryDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: '#4a6da7',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PromotionDetailModal;