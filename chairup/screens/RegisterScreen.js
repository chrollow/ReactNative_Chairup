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

import FormContainer from './Shared/FormContainer';
import Input from './Shared/Input';
import { registerUser } from '../Context/Actions/Auth.actions';

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
    // Basic validation
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
      const result = await registerUser({
        name,
        email,
        phone,
        password,
        profileImage: image
      });
      
      if (result.success) {
        Alert.alert(
          "Registration Successful",
          "You have successfully registered!",
          [{ text: "OK", onPress: () => navigation.navigate('Login') }]
        );
      } else {
        setError(result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  return (
    <KeyboardAwareScrollView
      viewIsInsideTabBar={true}
      extraHeight={200}
      enableOnAndroid={true}
      style={{ backgroundColor: '#fff' }}
    >
      <FormContainer title={"Register"}>
        <View style={styles.imageContainer}>
          {mainImage ? (
            <Image source={{ uri: mainImage }} style={styles.image} />
          ) : (
            <View style={[styles.image, { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: '#888' }}>No Image</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={takePhoto}
            style={styles.imagePicker}
          >
            <Ionicons name="camera" size={18} color="white" />
          </TouchableOpacity>
        </View>

        <Input
          placeholder="Email"
          name="email"
          id="email"
          value={email}
          onChangeText={(text) => setEmail(text.toLowerCase())}
        />
        <Input
          placeholder="Name"
          name="name"
          id="name"
          value={name}
          onChangeText={(text) => setName(text)}
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
        />
        <Input
          placeholder="Confirm Password"
          name="confirmPassword"
          id="confirmPassword"
          value={confirmPassword}
          secureTextEntry={true}
          onChangeText={(text) => setConfirmPassword(text)}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.buttonContainer}>
          <Button
            title="Register"
            onPress={handleRegister}
            color="#4a6da7"
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Back to Login"
            onPress={() => navigation.navigate("Login")}
            color="#888"
          />
        </View>
      </FormContainer>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: 200,
    height: 200,
    borderStyle: "solid",
    borderWidth: 8,
    padding: 0,
    justifyContent: "center",
    borderRadius: 100,
    borderColor: "#E0E0E0",
    elevation: 10,
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 100
  },
  imagePicker: {
    position: "absolute",
    right: 5,
    bottom: 5,
    backgroundColor: "grey",
    padding: 8,
    borderRadius: 100,
    elevation: 20
  },
  buttonContainer: {
    width: "80%",
    marginVertical: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  }
});

export default RegisterScreen;