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
  StatusBar,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../Context/Store/AuthGlobal';
import { logoutUser } from '../Context/Actions/Auth.actions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SimpleDrawer from '../components/SimpleDrawer';

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

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const { dispatch } = useContext(AuthContext);
  const [showDrawer, setShowDrawer] = useState(false);

  const toggleDrawer = () => {
    setShowDrawer(!showDrawer);
  };

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
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={toggleDrawer}>
            <Icon name="menu" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <Image
            source={require('../assets/chair-logo.png')}
            style={styles.headerLogo}
          />
        </View>
      </View>

      <SimpleDrawer
        isVisible={showDrawer}
        onClose={toggleDrawer}
        navigation={navigation}
      />
      
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
        <Icon name="logout" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#333333',
    elevation: 4,
  },
  headerLeft: {
    width: '50%',
    alignItems: 'flex-start',
  },
  headerRight: {
    width: '50%',
    alignItems: 'flex-end',
  },
  headerLogo: {
    width: 100,
    height: 40,
    resizeMode: 'contain',
  },
  welcomeContainer: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: '#666666',
    letterSpacing: 0.5,
  },
  categoryContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  categoryItem: {
    backgroundColor: '#F8F6F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6D5B8',
    width: '23%', // This ensures equal width with proper spacing
  },
  categoryText: {
    color: '#333333',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  productContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chairItem: {
    backgroundColor: '#F8F6F3',  // Changed to match category background
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E6D5B8',
  },
  chairImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  chairInfo: {
    padding: 16,
  },
  chairName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  chairPrice: {
    fontSize: 18,
    color: '#D7A86E',
    fontWeight: '700',
    marginBottom: 8,
  },
  chairDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  addToCartButton: {
    backgroundColor: '#333333',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#333333',
    padding: 12,
    borderRadius: 30,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default HomeScreen;