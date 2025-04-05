import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../Context/Store/AuthGlobal';
import { logoutUser } from '../Context/Actions/Auth.actions';
import { Ionicons } from '@expo/vector-icons';
import SimpleDrawer from '../components/SimpleDrawer';
import API from '../utils/api';
import { useFocusEffect } from '@react-navigation/native';
import PromotionDetailModal from '../components/Promotions/PromotionDetailModal';

const API_URL = "http://192.168.1.39:3000/api";
const BASE_URL = "http://192.168.1.39:3000"; // Base URL without /api

const HomeScreen = ({ navigation, route }) => {
  const [userData, setUserData] = useState(null);
  const { dispatch } = useContext(AuthContext);
  const [showDrawer, setShowDrawer] = useState(false);
  const [latestProducts, setLatestProducts] = useState([]);
  const [bestsellingProducts, setBestsellingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePromotions, setActivePromotions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [promotionModalVisible, setPromotionModalVisible] = useState(false);

  const toggleDrawer = () => {
    setShowDrawer(!showDrawer);
  };

  // Fetch user data
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

  // Fetch products whenever screen comes into focus
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Calculate date one week ago for latest arrivals
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoFormatted = oneWeekAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      // Fetch latest products (added within the last week)
      const latestResponse = await API.get(`/products?created_after=${oneWeekAgoFormatted}&sort=created_at&order=desc&limit=10`);
      setLatestProducts(latestResponse.data || []);
      
      // Fetch all products to filter by rating
      const allProductsResponse = await API.get('/products');
      const allProducts = allProductsResponse.data || [];
      
      // Get products with reviews
      const productsWithReviews = await Promise.all(
        allProducts.map(async (product) => {
          try {
            // Fetch reviews for each product
            const reviewsResponse = await API.get(`/products/${product._id}/reviews`);
            const reviews = reviewsResponse.data || [];
            
            // Calculate average rating
            let avgRating = 0;
            if (reviews.length > 0) {
              const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
              avgRating = totalRating / reviews.length;
            }
            
            return {
              ...product,
              reviews,
              avgRating,
              reviewCount: reviews.length
            };
          } catch (error) {
            console.error(`Error fetching reviews for product ${product._id}:`, error);
            return {
              ...product,
              reviews: [],
              avgRating: 0,
              reviewCount: 0
            };
          }
        })
      );
      
      // Filter products with rating >= 4 and has at least one review
      const highRatedProducts = productsWithReviews
        .filter(product => product.avgRating >= 4 && product.reviewCount > 0)
        .sort((a, b) => b.avgRating - a.avgRating) // Sort by highest rating first
        .slice(0, 10); // Take more products for horizontal scrolling
      
      setBestsellingProducts(highRatedProducts);

      // Fetch active promotions
      const promotionsResponse = await API.get('/promotions?active=true');
      setActivePromotions(promotionsResponse.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a function to fetch a single promotion by ID
  const fetchPromotion = useCallback(async (promoId) => {
    try {
      const response = await API.get(`/promotions/${promoId}`);
      if (response.data) {
        setSelectedPromotion(response.data);
        setPromotionModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching promotion:', error);
    }
  }, []);

  // Add a function to fetch a promotion by code
  const fetchPromotionByCode = useCallback(async (code) => {
    try {
      const response = await API.get(`/promotions/validate/${code}`);
      if (response.data && response.data.valid) {
        setSelectedPromotion(response.data.promotion);
        setPromotionModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching promotion by code:', error);
    }
  }, []);

  // Handle navigation params to display promotion modal
  useEffect(() => {
    if (route.params?.showPromoModal) {
      if (route.params.promoId) {
        fetchPromotion(route.params.promoId);
      } else if (route.params.promoCode) {
        fetchPromotionByCode(route.params.promoCode);
      }
      
      // Clear params after handling
      navigation.setParams({
        showPromoModal: undefined,
        promoId: undefined,
        promoCode: undefined
      });
    }
  }, [route.params, fetchPromotion, fetchPromotionByCode, navigation]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("HomeScreen is focused - fetching fresh data");
      fetchProducts();
    }, [fetchProducts])
  );

  const handleLogout = () => {
    logoutUser(dispatch);
  };

  const handlePromoPress = (promotion) => {
    setSelectedPromotion(promotion);
    setPromotionModalVisible(true);
  };

  const renderHorizontalChairItem = ({ item }) => {
    // Check if image URL is valid
    const imageUrl = item.image?.startsWith('/uploads/') 
      ? `${BASE_URL}${item.image}` 
      : item.image || 'https://via.placeholder.com/200';
      
    return (
      <TouchableOpacity 
        style={styles.horizontalChairItem}
        onPress={() => navigation.navigate('ProductNavigator', {
          screen: 'ProductDetail',
          params: { productId: item._id, name: item.name }
        })}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.horizontalChairImage}
          onError={(e) => console.log('Error loading image:', e.nativeEvent?.error)}
        />
        <View style={styles.horizontalChairInfo}>
          <Text style={styles.chairName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.chairPrice}>${parseFloat(item.price).toFixed(2)}</Text>
          
          {item.avgRating > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>
                ⭐ {item.avgRating.toFixed(1)} ({item.reviewCount})
              </Text>
            </View>
          )}
          
          <Text style={styles.chairDescription} numberOfLines={2}>
            {item.description || 'No description available'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPromoItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.promoItem}
      onPress={() => handlePromoPress(item)}
    >
      <View>
        <Text style={styles.promoCode}>{item.code}</Text>
        <Text style={styles.promoDescription}>{item.description || `${item.discountPercent}% off your purchase`}</Text>
      </View>
      <View style={styles.promoPressIndicator}>
        <Ionicons name="information-circle-outline" size={16} color="#4a6da7" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={toggleDrawer}>
            <Ionicons name="menu" size={28} color="#fff" />
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
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            Welcome{userData?.name ? `, ${userData.name}` : ''}!
          </Text>
          <Text style={styles.subText}>Find your perfect chair today</Text>
        </View>

        <View style={styles.promoContainer}>
          <Text style={styles.sectionTitle}>Special Offers</Text>
          <Text style={styles.sectionSubtitle}>Use these codes at checkout</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#4a6da7" style={styles.loader} />
          ) : (
            activePromotions.length > 0 ? (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={activePromotions}
                keyExtractor={item => item._id}
                renderItem={renderPromoItem}
                contentContainerStyle={styles.horizontalList}
                nestedScrollEnabled={true}
              />
            ) : (
              <Text style={styles.noProductsText}>No active promotions at this time</Text>
            )
          )}
        </View>
        
        <View style={styles.productContainer}>
          <Text style={styles.sectionTitle}>Latest Arrivals</Text>
          <Text style={styles.sectionSubtitle}>New this week</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#4a6da7" style={styles.loader} />
          ) : (
            latestProducts.length > 0 ? (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={latestProducts}
                keyExtractor={item => item._id}
                renderItem={renderHorizontalChairItem}
                contentContainerStyle={styles.horizontalList}
                nestedScrollEnabled={true}
              />
            ) : (
              <Text style={styles.noProductsText}>No new products added this week</Text>
            )
          )}
        </View>
        
        <View style={styles.productContainer}>
          <Text style={styles.sectionTitle}>Best Sellers</Text>
          <Text style={styles.sectionSubtitle}>Our highest rated chairs</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#4a6da7" style={styles.loader} />
          ) : (
            bestsellingProducts.length > 0 ? (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={bestsellingProducts}
                keyExtractor={item => item._id}
                renderItem={renderHorizontalChairItem}
                contentContainerStyle={styles.horizontalList}
                nestedScrollEnabled={true}
              />
            ) : (
              <Text style={styles.noProductsText}>No highly rated products available</Text>
            )
          )}
        </View>
        
        <View style={{ height: 80 }} />
      </ScrollView>
      
      {/* <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#fff" />
      </TouchableOpacity> */}

      <PromotionDetailModal 
        visible={promotionModalVisible}
        onClose={() => setPromotionModalVisible(false)}
        promotion={selectedPromotion}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F3',
  },
  scrollContainer: {
    flex: 1,
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
  promoContainer: {
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
  promoItem: {
    width: 220,
    backgroundColor: '#F8F6F3',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E6D5B8',
    padding: 12,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  promoCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  promoDescription: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
    lineHeight: 18,
  },
  promoPressIndicator: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  productContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  horizontalList: {
    paddingRight: 16,
  },
  horizontalChairItem: {
    width: 220,
    backgroundColor: '#F8F6F3',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E6D5B8',
  },
  horizontalChairImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  horizontalChairInfo: {
    padding: 12,
    height: 140,
  },
  chairName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  chairPrice: {
    fontSize: 16,
    color: '#D7A86E',
    fontWeight: '700',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 13,
    color: '#4a6da7',
    fontWeight: '600',
  },
  chairDescription: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
    lineHeight: 18,
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
  loader: {
    marginVertical: 20,
  },
  noProductsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default HomeScreen;