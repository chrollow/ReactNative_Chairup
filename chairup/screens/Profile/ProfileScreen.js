import React, { useState, useContext, useEffect } from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

import { AuthContext } from '../../Context/Store/AuthGlobal';
import { logoutUser } from '../../Context/Actions/Auth.actions';
import Input from '../Shared/Input';
import styles from './styles/ProfileScreen.styles';

const API_URL = "http://192.168.1.39:3000/api";

const ProfileScreen = () => {
  const { stateUser, dispatch } = useContext(AuthContext);
  const [user, setUser] = useState({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (stateUser.user) {
      setUser(stateUser.user);
      setName(stateUser.user.name || '');
      setEmail(stateUser.user.email || '');
      setPhone(stateUser.user.phone || '');
      setImage(stateUser.user.profileImage || null);
    }
  }, [stateUser]);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status === 'granted') {
      let result = await ImagePicker.launchCameraAsync({
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
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
    }
  };

  const handleLogout = () => {
    logoutUser(dispatch);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      // Reset fields to current values if cancelling edit
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  };

  const updateProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await axios.put(
        `${API_URL}/auth/profile`,
        {
          name,
          email,
          phone,
          profileImage: image
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        // Update local state
        const updatedUser = {
          ...user,
          name,
          email,
          phone,
          profileImage: image
        };
        
        await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
        
        // Update context
        dispatch({
          type: 'SET_CURRENT_USER',
          payload: {
            isAuthenticated: true,
            user: updatedUser
          }
        });
        
        setMessage('Profile updated successfully');
        setIsEditing(false);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const changeProfileImage = () => {
    Alert.alert(
      "Change Profile Picture",
      "Choose an option",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Gallery", onPress: pickImage }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={80} color="#999" />
            </View>
          )}
          <TouchableOpacity
            style={styles.changeImageButton}
            onPress={changeProfileImage}
          >
            <Ionicons name="camera" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      <View style={styles.infoContainer}>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Text style={styles.sectionTitle}>Account Information</Text>

        {isEditing ? (
          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Name</Text>
              <Input
                placeholder="Full Name"
                value={name}
                onChangeText={(text) => setName(text)}
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email</Text>
              <Input
                placeholder="Email Address"
                value={email}
                onChangeText={(text) => setEmail(text.toLowerCase())}
                keyboardType="email-address"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Phone Number</Text>
              <Input
                placeholder="Phone Number"
                value={phone}
                onChangeText={(text) => setPhone(text)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={toggleEdit}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]} 
                onPress={updateProfile}
              >
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoDetails}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user.phone}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.button, styles.editButton]} 
              onPress={toggleEdit}
            >
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.button, styles.logoutButton]} 
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;