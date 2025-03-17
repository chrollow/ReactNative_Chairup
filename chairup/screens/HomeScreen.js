// screens/HomeScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../Context/Store/AuthGlobal';
import { logoutUser } from '../Context/Actions/Auth.actions';

// Sample chair data
const chairsData = [
  {
    id: '1',
    name: 'Modern Office Chair',
    price: 199.99,
    image: 'https://picsum.photos/id/1/200/200', // Placeholder image
    description: 'Ergonomic design with lumbar support for all-day comfort'
  },
  {
    id: '2',
    name: 'Classic Wooden Chair',
    price: 149.99,
    image: 'https://picsum.photos/id/2/200/200', // Placeholder image
    description: 'Timeless wooden design that fits any decor'
  },
  {
    id: '3',
    name: 'Lounge Chair',
    price: 299.99,
    image: 'https://picsum.photos/id/3/200/200', // Placeholder image
    description: 'Perfect for relaxation with premium cushioning'
  },
  {
    id: '4',
    name: 'Dining Chair Set',
    price: 399.99,
    image: 'https://picsum.photos/id/4/200/200', // Placeholder image
    description: 'Set of 4 elegant dining chairs with sturdy construction'
  },
];

const HomeScreen = () => {
  const [userData, setUserData] = useState(null);
  const { dispatch } = useContext(AuthContext);
  
  useEffect(() => {
    const getUserData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('userData');
        if(jsonValue != null) {
          setUserData(JSON.parse(jsonValue));
        }
      } catch(e) {
        console.log('Failed to fetch user data', e);
      }
    };
    
    getUserData();
  }, []);

  const handleLogout = () => {
    logoutUser(dispatch);
  };

  const renderChairItem = ({ item }) => (
    <TouchableOpacity style={styles.chairItem}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.chairImage}
        // If you can't use external images, uncomment this:
        // style={[styles.chairImage, {backgroundColor: '#ddd'}]}
      />
      <View style={styles.chairInfo}>
        <Text style={styles.chairName}>{item.name}</Text>
        <Text style={styles.chairPrice}>${item.price}</Text>
        <Text style={styles.chairDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <TouchableOpacity style={styles.addToCartButton}>
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ChairUp</Text>
        
        {userData?.profileImage && (
          <TouchableOpacity style={styles.profileContainer}>
            <Image 
              source={{ uri: userData.profileImage }} 
              style={styles.profileImage} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>
          Welcome{userData?.name ? `, ${userData.name}` : ''}!
        </Text>
        <Text style={styles.subText}>Find your perfect chair today</Text>
      </View>
      
      <View style={styles.categoryContainer}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categories}>
          <TouchableOpacity style={styles.categoryItem}>
            <Text style={styles.categoryText}>Office</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryItem}>
            <Text style={styles.categoryText}>Living Room</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryItem}>
            <Text style={styles.categoryText}>Dining</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryItem}>
            <Text style={styles.categoryText}>Outdoor</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.productContainer}>
        <Text style={styles.sectionTitle}>Featured Chairs</Text>
        <FlatList
          data={chairsData}
          renderItem={renderChairItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4a6da7',
  },
  profileContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  welcomeContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  categoryContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  categoryText: {
    color: '#555',
  },
  productContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  chairItem: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chairImage: {
    width: 100,
    height: 100,
  },
  chairInfo: {
    flex: 1,
    padding: 10,
  },
  chairName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  chairPrice: {
    color: '#4a6da7',
    fontWeight: 'bold',
    marginVertical: 5,
  },
  chairDescription: {
    fontSize: 12,
    color: '#777',
    marginBottom: 5,
  },
  addToCartButton: {
    backgroundColor: '#4a6da7',
    padding: 5,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
    padding: 10,
    margin: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HomeScreen;