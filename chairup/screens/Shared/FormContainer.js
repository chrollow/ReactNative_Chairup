import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const FormContainer = (props) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formContainer}>
        {props.title && (
          <Text style={styles.title}>{props.title}</Text>
        )}
        {props.children}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
});

export default FormContainer;