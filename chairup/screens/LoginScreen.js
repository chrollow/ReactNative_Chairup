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
  ActivityIndicator,
  TouchableOpacity
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
          tintColor="#333333"
        />
        <Text style={styles.title}>ChairUp</Text>
        <Text style={styles.subtitle}>Premium Chair Marketplace</Text>
      </View>
      <FormContainer style={styles.formContainer}>
        <Input
          placeholder="Email"
          name="email"
          id="email"
          value={email}
          onChangeText={(text) => setEmail(text.toLowerCase())}
          containerStyle={styles.inputContainer}
        />
        <Input
          placeholder="Password"
          name="password"
          id="password"
          secureTextEntry={true}
          value={password}
          onChangeText={(text) => setPassword(text)}
          containerStyle={styles.inputContainer}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <View style={styles.buttonGroup}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#333333" />
          ) : (
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleSubmit}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
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
          <Text style={styles.middleText}>Don't have an account yet?</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate("Register")}
            style={styles.registerButton}
          >
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </FormContainer>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F3',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: '10%', // Changed from fixed 60 to percentage
    marginBottom: '5%', // Changed from fixed 30 to percentage
  },
  logo: {
    width: 80, // Reduced from 120
    height: 80, // Reduced from 120
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28, // Reduced from 32
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 8, // Reduced from 16
  },
  subtitle: {
    fontSize: 14, // Reduced from 16
    color: '#666666',
    marginTop: 4, // Reduced from 8
  },
  formContainer: {
    flex: 1, // Added flex: 1
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20, // Reduced from 30
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputContainer: {
    backgroundColor: '#F8F6F3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6D5B8',
    marginBottom: 12, // Reduced from 16
    paddingHorizontal: 16,
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16, // Reduced from 20
  },
  loginButton: {
    backgroundColor: '#333333',
    width: '100%',
    padding: 14, // Reduced from 16
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16, // Reduced from 24
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E6D5B8',
  },
  orText: {
    marginHorizontal: 16,
    color: '#666666',
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16, // Reduced from 24
    marginBottom: 20, // Added to ensure space at bottom
  },
  middleText: {
    color: '#666666',
    marginRight: 8,
    fontSize: 14, // Added to reduce text size
  },
  registerButton: {
    backgroundColor: '#E6D5B8',
    paddingVertical: 6, // Reduced from 8
    paddingHorizontal: 12, // Reduced from 16
    borderRadius: 8,
  },
  registerButtonText: {
    color: '#333333',
    fontWeight: '600',
    fontSize: 14, // Added to reduce text size
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 12, // Reduced from 16
    textAlign: 'center',
    fontSize: 13, // Added to reduce text size
  },
});

export default LoginScreen;