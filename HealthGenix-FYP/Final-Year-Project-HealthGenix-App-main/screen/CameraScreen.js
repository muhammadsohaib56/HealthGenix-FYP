import React, { useState } from 'react';
   import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
   import axios from 'axios';

   const EmailVerificationScreen = ({ navigation }) => {
     const [email, setEmail] = useState('');

     const verifyEmail = async () => {
       if (!email.trim()) {
         Alert.alert('Error', 'Please enter an email address');
         return;
       }
       try {
         const response = await axios.post('http://10.54.12.63:3001/email_testing', { email: email.trim() }, {
           headers: { 'Content-Type': 'application/json' },
           timeout: 10000
         });
         if (response.data.success) {
           Alert.alert('Success', 'Email verified! Proceed to select a gym game.');
           navigation.navigate('GymGameSelect', { email: email.trim() });
         } else {
           Alert.alert('Error', response.data.message || 'Email verification failed');
         }
       } catch (error) {
         console.error('Email verification error:', error.response ? JSON.stringify(error.response.data) : error.message);
         Alert.alert('Error', error.response?.data?.message || 'Failed to verify email. Please check your connection and try again.');
       }
     };

     return (
       <View style={styles.container}>
         <Text style={styles.header}>Verify Your Email</Text>
         <Text style={styles.subHeader}>Enter your email to proceed with gym registration</Text>
         <TextInput
           style={styles.input}
           value={email}
           onChangeText={setEmail}
           placeholder="Enter your email"
           placeholderTextColor="#999"
           keyboardType="email-address"
           autoCapitalize="none"
         />
         <TouchableOpacity style={styles.button} onPress={verifyEmail}>
           <Text style={styles.buttonText}>Verify Email</Text>
         </TouchableOpacity>
       </View>
     );
   };

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: '#121212',
       padding: 20,
       justifyContent: 'center',
     },
     header: {
       fontSize: 28,
       fontWeight: 'bold',
       color: '#00CED1',
       textAlign: 'center',
       marginBottom: 10,
     },
     subHeader: {
       fontSize: 16,
       color: '#B0B0B0',
       textAlign: 'center',
       marginBottom: 30,
     },
     input: {
       backgroundColor: '#1E1E1E',
       color: '#FFF',
       borderColor: '#00CED1',
       borderWidth: 1,
       borderRadius: 8,
       padding: 12,
       fontSize: 16,
       marginBottom: 20,
     },
     button: {
       backgroundColor: '#00CED1',
       padding: 15,
       borderRadius: 8,
       alignItems: 'center',
     },
     buttonText: {
       color: '#121212',
       fontSize: 18,
       fontWeight: 'bold',
     },
   });

   export default EmailVerificationScreen;