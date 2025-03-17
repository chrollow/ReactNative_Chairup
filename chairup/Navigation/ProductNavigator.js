import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProductsScreen from '../screens/Products/ProductsScreen';
import ProductDetailScreen from '../screens/Products/ProductDetailScreen';
import CartScreen from '../screens/Products/CartScreen';

const Stack = createStackNavigator();

const ProductNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Products" 
        component={ProductsScreen}
        options={{ title: 'All Chairs' }}
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen}
        options={({ route }) => ({ title: route.params?.name || 'Chair Details' })}
      />
      <Stack.Screen 
        name="Cart" 
        component={CartScreen}
        options={{ title: 'Shopping Cart' }}
      />
    </Stack.Navigator>
  );
};

export default ProductNavigator;