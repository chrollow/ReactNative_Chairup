import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { ProductContext } from '../../Context/Store/ProductGlobal';
import { processCheckout } from '../../Context/Actions/Product.actions';
import { clearCart } from '../../redux/slices/cartSlice';

const CheckoutScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { stateProducts } = useContext(ProductContext);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('creditCard');
  const [loading, setLoading] = useState(false);
  const [subTotal, setSubTotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(10); // Fixed shipping cost for now
  const [total, setTotal] = useState(0);

  // Calculate totals when cart changes
  useEffect(() => {
    let sum = 0;
    stateProducts.cart.forEach(item => {
      sum += (item.product.price * item.quantity);
    });
    setSubTotal(sum);
    setTotal(sum + shippingCost);
  }, [stateProducts.cart, shippingCost]);

  const validateForm = () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return false;
    }
    if (!city.trim()) {
      Alert.alert('Error', 'Please enter your city');
      return false;
    }
    if (!zipCode.trim()) {
      Alert.alert('Error', 'Please enter your ZIP code');
      return false;
    }
    if (!country.trim()) {
      Alert.alert('Error', 'Please enter your country');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    
    if (stateProducts.cart.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty.');
      return;
    }
    
    try {
      setLoading(true);
      
      const orderItems = stateProducts.cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      }));
      
      const orderData = {
        orderItems,
        shippingAddress: {
          address,
          city,
          postalCode: zipCode,
          country
        },
        phoneNumber: phone,
        paymentMethod,
        itemsPrice: subTotal,
        shippingPrice: shippingCost,
        totalPrice: total
      };
      
      const result = await processCheckout(orderData);
      
      if (result.success) {
        // Clear cart in both contexts
        dispatch(clearCart());
        stateProducts.dispatch({ type: 'CLEAR_CART' });
        
        Alert.alert(
          "Order Placed",
          "Your order has been successfully placed!",
          [
            {
              text: "View Orders",
              onPress: () => navigation.navigate('Orders')
            },
            {
              text: "Continue Shopping",
              onPress: () => navigation.navigate('Products')
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to process your order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'There was an error processing your order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Enter your city"
            />
          </View>
          
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>ZIP Code</Text>
              <TextInput
                style={styles.input}
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="ZIP"
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.formGroup, { flex: 2 }]}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                value={country}
                onChangeText={setCountry}
                placeholder="Country"
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity 
            style={[
              styles.paymentOption,
              paymentMethod === 'creditCard' && styles.selectedPayment
            ]}
            onPress={() => setPaymentMethod('creditCard')}
          >
            <Ionicons 
              name="card-outline" 
              size={24} 
              color={paymentMethod === 'creditCard' ? "#4a6da7" : "#555"} 
            />
            <Text style={[
              styles.paymentOptionText,
              paymentMethod === 'creditCard' && styles.selectedPaymentText
            ]}>
              Credit Card
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.paymentOption,
              paymentMethod === 'paypal' && styles.selectedPayment
            ]}
            onPress={() => setPaymentMethod('paypal')}
          >
            <Ionicons 
              name="logo-paypal" 
              size={24} 
              color={paymentMethod === 'paypal' ? "#4a6da7" : "#555"} 
            />
            <Text style={[
              styles.paymentOptionText,
              paymentMethod === 'paypal' && styles.selectedPaymentText
            ]}>
              PayPal
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.paymentOption,
              paymentMethod === 'cod' && styles.selectedPayment
            ]}
            onPress={() => setPaymentMethod('cod')}
          >
            <Ionicons 
              name="cash-outline" 
              size={24} 
              color={paymentMethod === 'cod' ? "#4a6da7" : "#555"} 
            />
            <Text style={[
              styles.paymentOptionText,
              paymentMethod === 'cod' && styles.selectedPaymentText
            ]}>
              Cash on Delivery
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          <View style={styles.orderSummaryItem}>
            <Text style={styles.orderSummaryLabel}>Subtotal</Text>
            <Text style={styles.orderSummaryValue}>${subTotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.orderSummaryItem}>
            <Text style={styles.orderSummaryLabel}>Shipping</Text>
            <Text style={styles.orderSummaryValue}>${shippingCost.toFixed(2)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.orderSummaryItem}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  formGroup: {
    marginBottom: 15
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 15
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#555'
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10
  },
  selectedPayment: {
    borderColor: '#4a6da7',
    backgroundColor: 'rgba(74, 109, 167, 0.1)'
  },
  paymentOptionText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#555'
  },
  selectedPaymentText: {
    fontWeight: 'bold',
    color: '#4a6da7'
  },
  orderSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  orderSummaryLabel: {
    fontSize: 15,
    color: '#555'
  },
  orderSummaryValue: {
    fontSize: 15,
    fontWeight: '500'
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e91e63'
  },
  footer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  placeOrderButton: {
    backgroundColor: '#4a6da7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 8
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5
  }
});

export default CheckoutScreen;