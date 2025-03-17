import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { AuthContext } from '../../Context/Store/AuthGlobal';

const API_URL = "http://192.168.1.39:3000/api";

const AdminProductEditScreen = ({ route, navigation }) => {
  const { product } = route.params || {};
  const { stateUser } = useContext(AuthContext);
  const isEditing = !!product;
  
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price ? product.price.toString() : '');
  const [category, setCategory] = useState(product?.category || 'Office');
  const [description, setDescription] = useState(product?.description || '');
  const [image, setImage] = useState(product?.image || null);
  const [stockQuantity, setStockQuantity] = useState(product?.stockQuantity ? product.stockQuantity.toString() : '0');
  const [loading, setLoading] = useState(false);
  
  // Predefined categories
  const categories = ['Office', 'Gaming', 'Living Room', 'Dining', 'Outdoor'];
  
  useEffect(() => {
    // Check if user is admin
    if (!stateUser.isAuthenticated || !stateUser.user.isAdmin) {
      navigation.navigate('HomeTab');
      return;
    }
    
    // Request permissions on component mount
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
          Alert.alert('Permission required', 'Camera and Photos access is needed to add product images');
        }
      }
    })();
  }, []);

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const validateForm = () => {
    if (!name.trim()) return "Name is required";
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) 
      return "Valid price is required";
    if (!category) return "Category is required";
    if (!description.trim()) return "Description is required";
    if (!image) return "Product image is required";
    if (!stockQuantity.trim() || isNaN(parseInt(stockQuantity)) || parseInt(stockQuantity) < 0)
      return "Valid stock quantity is required";
    return null;
  };

  const saveProduct = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }
    
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync('userToken');
      
      const productData = {
        name,
        price: parseFloat(price),
        category,
        description,
        image,
        stockQuantity: parseInt(stockQuantity, 10) || 0,  // Ensure stockQuantity is parsed as int
      };
      
      console.log("Saving product with data:", productData); // Log data to verify
      
      let response;
      
      if (isEditing) {
        response = await axios.put(`${API_URL}/products/${product.id}`, productData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        response = await axios.post(`${API_URL}/products`, productData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      
      console.log("Response from API:", response.data); // Log response to verify
      
      Alert.alert(
        "Success",
        isEditing ? "Product updated successfully" : "Product created successfully",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      Alert.alert("Error", isEditing ? "Failed to update product" : "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={50} color="#ccc" />
            <Text style={styles.placeholderText}>No image selected</Text>
          </View>
        )}
        
        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Ionicons name="images" size={20} color="#fff" />
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Product Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter product name"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Price ($)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="Enter price"
          keyboardType="decimal-pad"
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            onValueChange={setCategory}
            style={styles.picker}
          >
            {categories.map(cat => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter product description"
          multiline
          numberOfLines={5}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Stock Quantity</Text>
        <TextInput
          style={styles.input}
          value={stockQuantity}
          onChangeText={setStockQuantity}
          placeholder="Available stock quantity"
          keyboardType="number-pad"
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.saveButton, loading && styles.disabledButton]}
        onPress={saveProduct}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Product' : 'Create Product'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    color: '#999',
    marginTop: 8,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  imageButton: {
    flexDirection: 'row',
    backgroundColor: '#4a6da7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4a6da7',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  }
});

export default AdminProductEditScreen;