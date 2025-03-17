// screens/LoginScreen.js
import React, { useState, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Button, 
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import FormContainer from './Shared/FormContainer';
import Input from './Shared/Input';
import GoogleLogin from './Shared/GoogleLogin';
import FacebookLogin from './Shared/FacebookLogin'; // Import the new component
import { AuthContext } from '../Context/Store/AuthGlobal';
import { loginUser } from '../Context/Actions/Auth.actions';

const LoginScreen = ({ navigation }) => {
  const { dispatch } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (email === "" || password === "") {
      setError("Please fill in your credentials");
      return;
    }
    
    // Remove the error message if previously shown
    setError("");
    setIsLoading(true);
    
    const user = {
      email,
      password,
    };
    
    try {
      // loginUser now returns a boolean success value
      const success = await loginUser(user, dispatch);
      
      if (!success) {
        setError("Invalid credentials");
      }
    } catch (error) {
      setError(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    dispatch({
      type: 'SET_CURRENT_USER',
      payload: {
        isAuthenticated: true,
        user: userData
      }
    });
    
    // Wait a moment before navigating
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }]
      });
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/chair-logo.png')} 
          style={styles.logo}
        />
        <Text style={styles.title}>ChairUp</Text>
        <Text style={styles.subtitle}>Premium Chair Marketplace</Text>
      </View>
      <FormContainer>
        <Input
          placeholder="Email"
          name="email"
          id="email"
          value={email}
          onChangeText={(text) => setEmail(text.toLowerCase())}
        />
        <Input
          placeholder="Password"
          name="password"
          id="password"
          secureTextEntry={true}
          value={password}
          onChangeText={(text) => setPassword(text)}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <View style={styles.buttonGroup}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#4a6da7" />
          ) : (
            <Button 
              title="Login" 
              onPress={() => handleSubmit()} 
              color="#4a6da7" 
            />
          )}
        </View>
        
        <View style={styles.orContainer}>
          <View style={styles.divider} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.divider} />
        </View>
        
        <GoogleLogin onLoginSuccess={handleLoginSuccess} />
        <FacebookLogin onLoginSuccess={handleLoginSuccess} />
        
        <View style={styles.registerContainer}>
          <Text style={styles.middleText}>Don't have an account yet? </Text>
          <Button 
            title="Register" 
            onPress={() => navigation.navigate("Register")}
            color="#4a6da7" 
          />
        </View>
      </FormContainer>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4a6da7',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  buttonGroup: {
    width: '80%',
    alignItems: 'center',
    marginTop: 10,
  },
  middleText: {
    marginRight: 10,
    color: '#333',
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginVertical: 15,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: 10,
    color: '#666',
  },
});

export default LoginScreen;