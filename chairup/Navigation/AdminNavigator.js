import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminProductsScreen from '../screens/Admin/AdminProductsScreen';
import AdminProductEditScreen from '../screens/Admin/AdminProductEditScreen';

const Stack = createStackNavigator();

const AdminNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AdminProducts" 
        component={AdminProductsScreen}
        options={{ title: 'Product Management' }}
      />
      <Stack.Screen 
        name="AdminProductEdit" 
        component={AdminProductEditScreen}
        options={({ route }) => ({ 
          title: route.params?.product ? 'Edit Product' : 'Add Product' 
        })}
      />
    </Stack.Navigator>
  );
};

export default AdminNavigator;