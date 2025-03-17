import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ProductNavigator from './ProductNavigator';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import AdminNavigator from './AdminNavigator';
import { AuthContext } from '../Context/Store/AuthGlobal';

const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  const { stateUser } = useContext(AuthContext);
  const isAdmin = stateUser.user && stateUser.user.isAdmin;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ProductNavigator') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'AdminTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4a6da7',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ 
          headerShown: true,
          title: 'Home'
        }}
      />
      <Tab.Screen 
        name="ProductNavigator" 
        component={ProductNavigator} 
        options={{ 
          headerShown: true,
          title: 'Chairs'
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ 
          headerShown: true,
          title: 'My Profile' 
        }}
      />
      {isAdmin && (
        <Tab.Screen 
          name="AdminTab" 
          component={AdminNavigator} 
          options={{ 
            headerShown: false,
            title: 'Admin'
          }}
        />
      )}
    </Tab.Navigator>
  );
};

export default MainNavigator;