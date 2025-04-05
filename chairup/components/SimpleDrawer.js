import React, { useContext } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../Context/Store/AuthGlobal';
import { logoutUser } from '../Context/Actions/Auth.actions';

const { height } = Dimensions.get('window');

const SimpleDrawer = ({ isVisible, onClose, navigation }) => {
  const { stateUser, dispatch } = useContext(AuthContext);
  const user = stateUser.user || {};
  const slideAnim = React.useRef(new Animated.Value(100)).current;  // Add this

  React.useEffect(() => {
    if (isVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const handleLogout = () => {
    logoutUser(dispatch);
    onClose();
  };

  const navigateTo = (screenName) => {
    // Close the drawer first
    onClose();
    
    // Handle navigation based on screen name
    switch (screenName) {
      case 'Main':
        // Navigate to HomeTab in the main navigator
        navigation.navigate('HomeTab');
        break;
      case 'Products':
        // Navigate to the Products screen inside ProductNavigator
        navigation.navigate('ProductNavigator', { screen: 'Products' });
        break;
      case 'Profile':
        // Navigate to Profile
        navigation.navigate('Profile');
        break;
      default:
        // Just navigate to the screen name directly
        navigation.navigate(screenName);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeArea} onPress={onClose} />
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: [0, 300],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.drawerHeader}>
              <View style={styles.profileIcon}>
                <Ionicons name="person" size={40} color="#F8F6F3" />
              </View>
              <Text style={styles.headerName}>{user.name || 'Guest'}</Text>
              <Text style={styles.headerEmail}>{user.email || ''}</Text>
            </View>

            <ScrollView style={styles.menuItems}>
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => navigateTo('Main')}
              >
                <Ionicons name="home-outline" size={24} color="#333333" />
                <Text style={styles.menuText}>Home</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => navigateTo('Products')}
              >
                <Ionicons name="grid-outline" size={24} color="#333333" />
                <Text style={styles.menuText}>Products</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => navigateTo('Profile')}
              >
                <Ionicons name="person-outline" size={24} color="#333333" />
                <Text style={styles.menuText}>Profile</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={[styles.menuItem, styles.logoutButton]} 
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color="#333333" />
                <Text style={styles.menuText}>Logout</Text>
              </TouchableOpacity>
              <Text style={styles.footerText}>ChairUp v1.0.0</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  closeArea: {
    flex: 1,
    backgroundColor: 'rgba(51, 51, 51, 0.5)', // Using #333333 with opacity
  },
  drawer: {
    position: 'absolute',
    right: 0,  // Add this to position from right side
    width: '75%',
    backgroundColor: '#F8F6F3',
    height: height,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },  // Changed to negative for left side shadow
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  drawerHeader: {
    padding: 24,
    backgroundColor: '#333333',
    alignItems: 'center',
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6D5B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    color: '#F8F6F3',
  },
  headerEmail: {
    fontSize: 14,
    color: '#E6D5B8',
  },
  menuItems: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#333333',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E6D5B8',
    marginVertical: 16,
    marginHorizontal: 24,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E6D5B8',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  logoutButton: {
    marginBottom: 16,
  },
});

export default SimpleDrawer;