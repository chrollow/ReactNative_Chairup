import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image,
  Button,
  Platform,
  Alert,
  Dimensions
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import FormContainer from './Shared/FormContainer';
import Input from './Shared/Input';
import { registerUser } from '../Context/Actions/Auth.actions';

// Add this line to define API_URL
const API_URL = "http://192.168.1.39:3000/api";

var { width } = Dimensions.get("window");

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [image, setImage] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      // Request camera permissions
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
      
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const takePhoto = async () => {
    const c = await ImagePicker.requestCameraPermissionsAsync();

    if (c.status === "granted") {
      let result = await ImagePicker.launchCameraAsync({
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setMainImage(result.assets[0].uri);
        setImage(result.assets[0].uri);
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setMainImage(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    // Your existing validation
    if (!email || !name || !phone || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!image) {
      setError('Please take a profile picture');
      return;
    }
    
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('password', password);
      
      // Add profile image with correct structure
      if (image) {
        const filename = image.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('profileImage', {
          uri: Platform.OS === 'ios' ? image.replace('file://', '') : image,
          name: filename,
          type
        });
      }
      
      console.log("Sending registration data with image");
      
      // Make the API call
      const response = await axios.post(
        `${API_URL}/auth/register`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        }
      );
      
      console.log("Registration response:", response.data);
      
      if (response.data) {
        Alert.alert(
          "Registration Successful",
          "You have successfully registered!",
          [{ text: "OK", onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (error) {
      console.error("Registration error:", error.response?.data || error.message);
      setError(error.response?.data?.message || 'Registration failed');
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  return (
    <KeyboardAwareScrollView
      viewIsInsideTabBar={true}
      extraHeight={200}
      enableOnAndroid={true}
      style={{ backgroundColor: '#F8F6F3' }}
    >
      <FormContainer title={"Create Account"}>
        <View style={styles.imageContainer}>
          {mainImage ? (
            <Image source={{ uri: mainImage }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Ionicons name="person-outline" size={50} color="#666" />
            </View>
          )}
          <TouchableOpacity
            onPress={takePhoto}
            style={styles.imagePicker}
          >
            <Ionicons name="camera" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Input
            placeholder="Email"
            name="email"
            id="email"
            value={email}
            onChangeText={(text) => setEmail(text.toLowerCase())}
            keyboardType="email-address"
            autoCorrect={false}
          />
          <Input
            placeholder="Name"
            name="name"
            id="name"
            value={name}
            onChangeText={(text) => setName(text)}
            autoCorrect={false}
          />
          <Input
            placeholder="Phone Number"
            name="phone"
            id="phone"
            value={phone}
            keyboardType="numeric"
            onChangeText={(text) => setPhone(text)}
          />
          <Input
            placeholder="Password"
            name="password"
            id="password"
            value={password}
            secureTextEntry={true}
            onChangeText={(text) => setPassword(text)}
            autoCorrect={false}
          />
          <Input
            placeholder="Confirm Password"
            name="confirmPassword"
            id="confirmPassword"
            value={confirmPassword}
            secureTextEntry={true}
            onChangeText={(text) => setConfirmPassword(text)}
            autoCorrect={false}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity 
          style={styles.registerButton}
          onPress={handleRegister}
        >
          <Text style={styles.registerButtonText}>Create Account</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </FormContainer>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: 100, // Reduced from 150
    height: 100, // Reduced from 150
    alignSelf: 'center',
    marginVertical: 10, // Reduced from 20
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 50, // Reduced from 75
    borderWidth: 2, // Reduced from 3
    borderColor: '#E6D5B8',
  },
  placeholderImage: {
    backgroundColor: '#F8F6F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1, // Reduced from 2
    borderColor: '#E6D5B8',
    borderStyle: 'dashed',
  },
  imagePicker: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    backgroundColor: '#333333',
    padding: 8, // Reduced from 12
    borderRadius: 16, // Reduced from 20
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  inputContainer: {
    width: '90%',
    alignSelf: 'center',
    paddingHorizontal: 0,
    gap: 8, // Reduced from 12
  },
  input: {
    height: 40, // Added fixed height
    paddingVertical: 8, // Reduced padding
    fontSize: 14, // Reduced from 16
  },
  registerButton: {
    backgroundColor: '#333333',
    paddingVertical: 12, // Reduced from 15
    paddingHorizontal: 20, // Reduced from 30
    borderRadius: 12,
    width: '90%',
    alignSelf: 'center',
    marginTop: 12, // Reduced from 20
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  registerButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14, // Reduced from 16
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#E6D5B8',
    paddingVertical: 12, // Reduced from 15
    paddingHorizontal: 20, // Reduced from 30
    borderRadius: 12,
    width: '90%',
    alignSelf: 'center',
    marginTop: 8, // Reduced from 10
    marginBottom: 10, // Added to ensure space at bottom
  },
  backButtonText: {
    color: '#333333',
    textAlign: 'center',
    fontSize: 14, // Reduced from 16
    fontWeight: '600',
  },
  error: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 6, // Reduced from 10
    marginBottom: 6, // Added
    fontSize: 12, // Reduced from 14
  }
});

export default RegisterScreen;