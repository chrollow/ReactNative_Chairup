import * as Notifications from 'expo-notifications';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace the import with direct definition
const API_URL = "http://192.168.1.36:3000/api"; // Update with your server IP
const BASE_URL = "http://192.168.1.36:3000"; // Base URL without /api

export const sendOrderStatusNotification = async (orderId, status, userId) => {
  try {
    // In a real app, you would fetch the user's push token from your database
    // For this example, we'll just show a local notification
    
    // Title and body for different statuses
    const messages = {
      'pending': {
        title: 'Order Received',
        body: `Your order #${orderId.substr(-8)} has been received and is pending.`
      },
      'processing': {
        title: 'Order Processing',
        body: `Your order #${orderId.substr(-8)} is now being processed.`
      },
      'shipped': {
        title: 'Order Shipped',
        body: `Good news! Your order #${orderId.substr(-8)} has been shipped.`
      },
      'delivered': {
        title: 'Order Delivered',
        body: `Your order #${orderId.substr(-8)} has been delivered. Enjoy!`
      },
      'cancelled': {
        title: 'Order Cancelled',
        body: `Your order #${orderId.substr(-8)} has been cancelled.`
      }
    };

    const message = messages[status] || {
      title: 'Order Updated',
      body: `Your order #${orderId.substr(-8)} status has been updated to ${status}.`
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        data: { orderId, screen: 'OrderDetails' },
      },
      trigger: null, // Null trigger means the notification fires immediately
    });

  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Save push token to server
export const savePushTokenToServer = async (token) => {
  try {
    const userToken = await SecureStore.getItemAsync('userToken');
    
    if (!userToken) {
      console.log('User not logged in, cannot save push token');
      return;
    }
    
    await axios.post(
      `${API_URL}/users/push-token`, 
      { token },
      {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      }
    );
    
    console.log('Push token saved to server successfully');
  } catch (error) {
    console.error('Error saving push token to server:', error);
  }
};