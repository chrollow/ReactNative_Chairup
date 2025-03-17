import React, { useContext } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TouchableOpacity 
} from 'react-native';
import { 
  DrawerContentScrollView,
  DrawerItemList 
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../Context/Store/AuthGlobal';
import { logoutUser } from '../Context/Actions/Auth.actions';

const CustomDrawerContent = (props) => {
  const { stateUser, dispatch } = useContext(AuthContext);
  const user = stateUser.user || {};

  const handleLogout = () => {
    logoutUser(dispatch);
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        <View style={styles.drawerHeader}>
          {user.profileImage ? (
            <Image 
              source={{ uri: user.profileImage }} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={[styles.profileImage, styles.noProfileImage]}>
              <Ionicons name="person" size={40} color="#aaa" />
            </View>
          )}
          <Text style={styles.headerName}>{user.name || 'Guest'}</Text>
          <Text style={styles.headerEmail}>{user.email || ''}</Text>
        </View>
        
        <DrawerItemList {...props} />
        
        <View style={styles.divider} />
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#ff6b6b" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>ChairUp v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  noProfileImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerEmail: {
    fontSize: 14,
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
    marginHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  logoutText: {
    marginLeft: 15,
    fontSize: 16,
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

export default CustomDrawerContent;