import React, { useContext } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal,
  SafeAreaView,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../Context/Store/AuthGlobal';
import { logoutUser } from '../Context/Actions/Auth.actions';

const { height } = Dimensions.get('window');

const SimpleDrawer = ({ isVisible, onClose, navigation }) => {
  const { stateUser, dispatch } = useContext(AuthContext);
  const user = stateUser.user || {};

  const handleLogout = () => {
    logoutUser(dispatch);
    onClose();
  };

  const navigateTo = (screenName) => {
    navigation.navigate(screenName);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeArea} onPress={onClose} />
        <SafeAreaView style={styles.drawer}>
          <View style={styles.drawerHeader}>
            <View style={styles.profileIcon}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
            <Text style={styles.headerName}>{user.name || 'Guest'}</Text>
            <Text style={styles.headerEmail}>{user.email || ''}</Text>
          </View>

          <ScrollView style={styles.menuItems}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigateTo('Main')}
            >
              <Ionicons name="home-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigateTo('Products')}
            >
              <Ionicons name="grid-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Products</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigateTo('Profile')}
            >
              <Ionicons name="person-outline" size={24} color="#333" />
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#ff6b6b" />
              <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>ChairUp v1.0.0</Text>
          </View>
        </SafeAreaView>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    width: '70%',
    backgroundColor: '#fff',
    height: height,
  },
  drawerHeader: {
    padding: 20,
    backgroundColor: '#4a6da7',
    alignItems: 'center',
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#fff',
  },
  headerEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
    marginHorizontal: 20,
  },
  logoutText: {
    color: '#ff6b6b',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
  },
});

export default SimpleDrawer;