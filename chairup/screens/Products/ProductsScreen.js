import React, { useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductContext } from '../../Context/Store/ProductGlobal';
import Slider from '@react-native-community/slider';  // Make sure this is the only slider import
import SimpleDrawer from '../../components/SimpleDrawer';
import styles from './styles/ProductsScreen.styles';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import API from '../../utils/api';

const API_URL = "http://192.168.100.11:3000/api";
const BASE_URL = "http://192.168.100.11:3000"; // Base URL without /api

const ProductsScreen = ({ navigation }) => {
  const { stateProducts, dispatch } = useContext(ProductContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(stateProducts.products || []);
  const [showFilters, setShowFilters] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [activeFilters, setActiveFilters] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Add this line to get reviews from Redux
  const { productReviews } = useSelector(state => state.reviews);
  
  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      console.log("⏳ Fetching products from:", `${API_URL}/products`);
      
      // Use the API utility which handles authentication
      const response = await API.get('/products');
      
      console.log("📦 Raw API response:", JSON.stringify(response.data));
      
      // Update the global state with fetched products
      dispatch({
        type: 'SET_PRODUCTS',
        payload: response.data
      });
      
      console.log('✅ Products fetched successfully:', response.data.length);
    } catch (error) {
      console.error("❌ Error fetching products:", error.message);
      console.error("Error details:", error.response?.data || error);
      Alert.alert("Error", "Failed to load products: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch products when component mounts and when it comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProducts();
      return () => {}; // cleanup function
    }, [])
  );

  // Add this helper function to calculate average ratings
  const calculateAverageRating = (productId) => {
    const reviews = productReviews[productId] || [];
    if (reviews.length === 0) return 0;
    
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  // Extract all unique categories from products
  const allCategories = stateProducts.products && stateProducts.products.length > 0 
    ? [...new Set(stateProducts.products.map(p => p.category).filter(Boolean))]
    : ['Office', 'Gaming', 'Living Room', 'Dining', 'Outdoor'];
  
  // Find product price range
  const productMaxPrice = stateProducts.products && stateProducts.products.length > 0 ? 
    Math.max(...stateProducts.products.map(p => p.price || 0), 0) + 50 : 500;
  const productMinPrice = stateProducts.products && stateProducts.products.length > 0 ?
    Math.min(...stateProducts.products.map(p => p.price || 0), 0) : 0;
  
  useEffect(() => {
    // Initialize price range
    setMinPrice(productMinPrice);
    setMaxPrice(productMaxPrice);
  }, [productMinPrice, productMaxPrice]);
  
  // Filter products based on search query, price range, and categories
  useEffect(() => {
    if (!stateProducts.products || stateProducts.products.length === 0) {
      console.log('No products to filter');
      setFilteredProducts([]);
      return;
    }
    
    console.log('Filtering products. Available products:', stateProducts.products.length);
    
    try {
      const filtered = stateProducts.products.filter(item => {
        // Check if product is in stock
        const inStock = (item.stockQuantity > 0);
        
        // Check if name includes search query (case insensitive)
        const matchesSearch = !searchQuery || 
          (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Check if price is within range
        const itemPrice = parseFloat(item.price) || 0;
        const matchesPrice = itemPrice >= minPrice && itemPrice <= maxPrice;
        
        // Check if category matches (if categories are selected)
        const matchesCategory = selectedCategories.length === 0 || 
          (item.category && selectedCategories.includes(item.category));
        
        // Return true only if product is in stock AND matches all other filters
        return inStock && matchesSearch && matchesPrice && matchesCategory;
      });
      
      console.log('Filtered products:', filtered.length);
      setFilteredProducts(filtered);
      
      // Count active filters
      let count = 0;
      if (searchQuery) count++;
      if (minPrice > productMinPrice || maxPrice < productMaxPrice) count++;
      if (selectedCategories.length > 0) count++;
      setActiveFilters(count);
    } catch (error) {
      console.error('Error filtering products:', error);
      setFilteredProducts([]);
    }
  }, [searchQuery, minPrice, maxPrice, selectedCategories, stateProducts.products]);
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const toggleDrawer = () => {
    setShowDrawer(!showDrawer);
  };
  
  const handleResetFilters = () => {
    setSearchQuery('');
    setMinPrice(productMinPrice);
    setMaxPrice(productMaxPrice);
    setSelectedCategories([]);
  };
  
  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProducts().then(() => setRefreshing(false));
  }, []);

  const renderProductItem = ({ item }) => {
    // Debug product ID information
    console.log(`Product ${item.name} has ID:`, item._id || item.id || 'NO ID');
    
    // Check if the image URL is valid and properly formatted
    const isValidImageUrl = item.image && (
      item.image.startsWith('http') || 
      item.image.startsWith('file:///') || 
      item.image.startsWith('data:image') ||
      item.image.startsWith('/uploads/') // Add this condition
    );
    
    // Define isLowStock variable here
    const isLowStock = item.stockQuantity > 0 && item.stockQuantity <= 5;
    
    console.log(`Rendering product: ${item.name}, Image URL: ${item.image}`);
    
    return (
      <TouchableOpacity 
        style={styles.productItem}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id, name: item.name })}
      >
        {isValidImageUrl ? (
          <Image 
            source={{ 
              uri: item.image.startsWith('/uploads/') 
                ? `${BASE_URL}${item.image}` // Use BASE_URL for server images
                : item.image // Use as-is for complete URLs
            }}
            style={styles.productImage}
            onError={(e) => {
              console.log('Error loading image for:', item.name, e.nativeEvent?.error);
            }}
          />
        ) : (
          <View style={[styles.productImage, { 
            backgroundColor: '#e1e1e1', 
            justifyContent: 'center', 
            alignItems: 'center' 
          }]}>
            <Ionicons name="image-outline" size={40} color="#999" />
          </View>
        )}
        
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}
        
        {/* Add low stock indicator */}
        {isLowStock && (
          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>Low Stock</Text>
          </View>
        )}
        
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name || 'Unnamed Product'}</Text>
          <Text style={styles.productPrice}>${parseFloat(item.price).toFixed(2) || '0.00'}</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map(star => {
              const avgRating = parseFloat(calculateAverageRating(item._id) || 0);
              return (
                <Ionicons 
                  key={star}
                  name={star <= avgRating ? "star" : (star - avgRating < 1 && star - avgRating > 0) ? "star-half" : "star-outline"} 
                  size={16} 
                  color="#FFD700" 
                />
              );
            })}
            <Text style={styles.ratingText}>({(productReviews[item._id] || []).length})</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer}>
          <Ionicons name="menu-outline" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Image
          source={require('../../assets/chair-logo.png')}
          style={styles.headerLogo}
        />
        
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
          <Ionicons name="cart-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Chairs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={toggleFilters}
        >
          {activeFilters > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilters}</Text>
            </View>
          )}
          <Ionicons name="filter" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Display selected filters as chips */}
      {(selectedCategories.length > 0 || minPrice > productMinPrice || maxPrice < productMaxPrice) && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filtersChipsContainer}
          contentContainerStyle={styles.filtersChipsContent}
        >
          {selectedCategories.map(category => (
            <TouchableOpacity
              key={category}
              style={styles.filterChip}
              onPress={() => toggleCategory(category)}
            >
              <Text style={styles.filterChipText}>{category}</Text>
              <Ionicons name="close-circle" size={16} color="#4a6da7" />
            </TouchableOpacity>
          ))}
          
          {(minPrice > productMinPrice || maxPrice < productMaxPrice) && (
            <TouchableOpacity
              style={styles.filterChip}
              onPress={toggleFilters}
            >
              <Text style={styles.filterChipText}>
                Price: ${Math.round(minPrice)} - ${Math.round(maxPrice)}
              </Text>
              <Ionicons name="options-outline" size={16} color="#4a6da7" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.clearFilterChip}
            onPress={handleResetFilters}
          >
            <Text style={styles.clearFilterText}>Clear All</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          numColumns={2}
          contentContainerStyle={styles.productList}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <View style={styles.noResultsContainer}>
          <Ionicons name="sad-outline" size={50} color="#ccc" />
          <Text style={styles.noResultsText}>No products found</Text>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetFilters}>
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.resetButton, {marginTop: 10, backgroundColor: '#4a6da7'}]} 
            onPress={fetchProducts}
          >
            <Text style={[styles.resetButtonText, {color: 'white'}]}>Reload Products</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilters}
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFilters(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filters</Text>
                  <TouchableOpacity onPress={() => setShowFilters(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                {/* Categories section */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Categories</Text>
                  <View style={styles.categoriesContainer}>
                    {allCategories.map(category => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryButton,
                          selectedCategories.includes(category) && styles.selectedCategoryButton
                        ]}
                        onPress={() => toggleCategory(category)}
                      >
                        <Text 
                          style={[
                            styles.categoryButtonText,
                            selectedCategories.includes(category) && styles.selectedCategoryText
                          ]}
                        >
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Price Range section */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Price Range</Text>
                  <View style={styles.priceLabels}>
                    <Text>${Math.round(minPrice)}</Text>
                    <Text>${Math.round(maxPrice)}</Text>
                  </View>
                  
                  {/* Min price slider */}
                  <Text>Minimum Price</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={productMinPrice}
                    maximumValue={productMaxPrice}
                    value={minPrice}
                    onValueChange={setMinPrice}
                    step={10}
                    minimumTrackTintColor="#4a6da7"
                    maximumTrackTintColor="#d3d3d3"
                  />
                  
                  {/* Max price slider */}
                  <Text>Maximum Price</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={productMinPrice}
                    maximumValue={productMaxPrice}
                    value={maxPrice}
                    onValueChange={setMaxPrice}
                    step={10}
                    minimumTrackTintColor="#4a6da7"
                    maximumTrackTintColor="#d3d3d3"
                  />
                </View>
                
                <View style={styles.filterActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.resetFilterButton]}
                    onPress={handleResetFilters}
                  >
                    <Text style={styles.resetFilterText}>Reset All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.applyButton]}
                    onPress={() => setShowFilters(false)}
                  >
                    <Text style={styles.applyText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* Simple Drawer */}
      <SimpleDrawer
        isVisible={showDrawer}
        onClose={toggleDrawer}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

export default ProductsScreen;