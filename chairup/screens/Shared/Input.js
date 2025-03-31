import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

const Input = (props) => {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder={props.placeholder}
        name={props.name}
        id={props.id}
        value={props.value}
        autoCorrect={props.autoCorrect}
        onChangeText={props.onChangeText}
        secureTextEntry={props.secureTextEntry}
        keyboardType={props.keyboardType}
        placeholderTextColor="#666666" 
        autoCapitalize="none" 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E6D5B8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    width: '100%',
    padding: 15,
    fontSize: 16,
    color: '#333333',
    textAlign: 'center', // Center the input text
  },
});

export default Input;