import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const SERVER_URL = "http://10.54.12.63:3001";

const SignupScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  useEffect(() => {
    let interval;
    if (otpModalVisible && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setOtpModalVisible(false);
      setOtp('');
      Alert.alert('Error', 'OTP expired. Please try signing up again.');
    }
    return () => clearInterval(interval);
  }, [otpModalVisible, timer]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (otpModalVisible) return;
      e.preventDefault();
      setExitModalVisible(true);
    });
    return unsubscribe;
  }, [navigation, otpModalVisible]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const validateInputs = () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !email || !country || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    if (!/^[A-Za-z\s]+$/.test(trimmedUsername)) {
      Alert.alert('Error', 'Username must contain only letters and spaces (e.g., Waqas Naveed or John   Doe)');
      return false;
    }
    if (!/^[0-9]+$/.test(phone)) {
      Alert.alert('Error', 'Phone must contain only digits');
      return false;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      Alert.alert('Error', 'Password must be at least 8 characters, contain one uppercase letter, and one special character');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const isConfirmPasswordValid = () => {
    return password === confirmPassword && validatePassword(confirmPassword);
  };

  const validatePassword = (password) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password);
  };

  const handleSignup = async (retryCount = 0) => {
    if (!validateInputs()) return;

    const trimmedUsername = username.trim();
    console.log('Submitting username:', trimmedUsername);
    const userData = { username: trimmedUsername, email, country, phone, password, profileImage };

    setLoading(true);
    try {
      const otpResponse = await axios.post(`${SERVER_URL}/send-otp`, { email }, {
        timeout: 10000,
      });

      setLoading(false);
      if (otpResponse.status === 200) {
        setOtpModalVisible(true);
        setTimer(60);
        window.tempUserData = userData;
        Alert.alert('Success', 'OTP sent to your email. Please enter it within 60 seconds.');
      } else {
        Alert.alert('Error', otpResponse.data.message || 'Failed to send OTP');
      }
    } catch (error) {
      setLoading(false);
      console.error('Send OTP error:', error.message);
      if (error.code === 'ECONNABORTED' && retryCount < 3) {
        setTimeout(() => handleSignup(retryCount + 1), 2000);
        Alert.alert('Retrying', `Network timeout. Retry attempt ${retryCount + 1}/3`);
      } else {
        Alert.alert('Network Error', 'Failed to connect to server. Please check your network and try again.');
      }
    }
  };

  const handleVerifyOtp = async (retryCount = 0) => {
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const verifyResponse = await axios.post(`${SERVER_URL}/verify-otp`, { email, otp }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });

      if (verifyResponse.status === 200) {
        const formData = new FormData();
        console.log('Sending username to server:', window.tempUserData.username);
        formData.append('username', window.tempUserData.username);
        formData.append('email', window.tempUserData.email);
        formData.append('country', window.tempUserData.country);
        formData.append('phone', window.tempUserData.phone);
        formData.append('password', window.tempUserData.password);
        if (window.tempUserData.profileImage) {
          formData.append('profileImage', {
            uri: window.tempUserData.profileImage,
            type: 'image/jpeg',
            name: 'profile.jpg',
          });
        }

        const signupResponse = await axios.post(`${SERVER_URL}/signup`, formData, {
          timeout: 10000,
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setLoading(false);
        if (signupResponse.status === 201) {
          setOtpModalVisible(false);
          setOtp('');
          Alert.alert('Success', signupResponse.data.message);
          navigation.navigate('UserLogin');
        } else {
          Alert.alert('Error', signupResponse.data.message || 'Signup failed');
        }
      } else {
        setLoading(false);
        Alert.alert('Error', verifyResponse.data.message || 'Invalid OTP');
      }
    } catch (error) {
      setLoading(false);
      console.error('Verify OTP error:', error.message, error.response?.data);
      if ((error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') && retryCount < 3) {
        setTimeout(() => handleVerifyOtp(retryCount + 1), 2000);
        Alert.alert('Retrying', `Network timeout. Retry attempt ${retryCount + 1}/3`);
      } else {
        Alert.alert('Network Error', 'Failed to verify OTP or signup. Please check your network and try again.');
      }
    }
  };

  const handleCloseOtpModal = () => {
    setOtpModalVisible(false);
    setOtp('');
    setTimer(0);
  };

  const handleExitConfirm = () => {
    setExitModalVisible(false);
    navigation.goBack();
  };

  const handleCancelExit = () => {
    setExitModalVisible(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <TouchableWithoutFeedback onPress={() => setExitModalVisible(true)}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.heading}>Create Account</Text>

          <TouchableOpacity onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="camera-outline" size={40} color="white" />
                <Text style={styles.uploadText}>Upload Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="white" />
            <TextInput
              style={styles.input}
              placeholder="Username "
              placeholderTextColor="gray"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="white" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="gray"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="globe-outline" size={20} color="white" />
            <TextInput
              style={styles.input}
              placeholder="Country"
              placeholderTextColor="gray"
              value={country}
              onChangeText={setCountry}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="white" />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              placeholderTextColor="gray"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.passwordContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="white" />
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="gray"
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <View style={[styles.passwordContainer, isConfirmPasswordValid() && styles.validConfirmPassword]}>
            <Ionicons name="lock-closed-outline" size={20} color="white" />
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              placeholderTextColor="gray"
              secureTextEntry={!confirmPasswordVisible}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
              <Ionicons name={confirmPasswordVisible ? 'eye-off' : 'eye'} size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.signupButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>

      <Modal visible={otpModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={handleCloseOtpModal}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Enter OTP</Text>
                <Text style={styles.timerText}>Time remaining: {timer}s</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="key" size={20} color="white" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="gray"
                    keyboardType="numeric"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.signupButtonText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={exitModalVisible} transparent animationType="fade">
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Confirm Exit</Text>
      <Text style={styles.modalText}>Are you sure you want to leave? Your progress will not be saved.</Text>
      <View style={styles.modalButtonContainer}>
        <TouchableOpacity
          style={styles.modalButton}
          onPress={() => {
            setExitModalVisible(false);
            navigation.navigate('UserLogin');
          }}
        >
          <Text style={styles.modalButtonText}>Yes, Exit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.modalButton}
          onPress={handleCancelExit}
        >
          <Text style={styles.modalButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  heading: {
    fontSize: 28,
    color: '#03DAC6',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#03DAC6',
    marginBottom: 15,
  },
  uploadPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#444',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  uploadText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 10,
    paddingHorizontal: 10,
    width: '100%',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    padding: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#222',
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    padding: 15,
  },
  validConfirmPassword: {
    borderColor: '#00FF00',
    borderWidth: 2,
  },
  signupButton: {
    backgroundColor: '#03DAC6',
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
  signupButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupButtonDisabled: {
    backgroundColor: '#028f7e',
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    color: '#03DAC6',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  timerText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 15,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#03DAC6',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignupScreen;