import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from 'axios';

const SERVER_URL = "http://10.54.12.63:3001";

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let interval;
    if (otpModalVisible && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [otpModalVisible, timer]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (otpModalVisible || resetModalVisible) return;
      e.preventDefault();
      setExitModalVisible(true);
    });
    return unsubscribe;
  }, [navigation, otpModalVisible, resetModalVisible]);

  const validatePassword = (password) => {
    return password.length >= 8 && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password);
  };

  const isConfirmPasswordValid = () => {
    return newPassword === confirmPassword && validatePassword(confirmPassword);
  };

  const handleVerifyEmailAndSendOtp = async (retryCount = 0) => {
    if (!email) {
      Alert.alert("Error", "Please enter an email");
      return;
    }

    setLoading(true);
    try {
      const verifyResponse = await axios.post(`${SERVER_URL}/verify-email`, { email }, {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      });

      if (verifyResponse.status !== 200) {
        setLoading(false);
        Alert.alert("Error", verifyResponse.data.message || "Email not found");
        return;
      }

      const otpResponse = await axios.post(`${SERVER_URL}/send-otp`, { email }, {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      });

      setLoading(false);
      if (otpResponse.status === 200) {
        setOtpModalVisible(true);
        setTimer(60);
        setCanResend(false);
        Alert.alert("Success", "OTP sent to your email.");
      } else {
        Alert.alert("Error", otpResponse.data.message || "Failed to send OTP");
      }
    } catch (error) {
      setLoading(false);
      console.error('Verify email/send OTP error:', error.message);
      if ((error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') && retryCount < 3) {
        setTimeout(() => handleVerifyEmailAndSendOtp(retryCount + 1), 2000);
        Alert.alert('Retrying', `Network timeout. Retry attempt ${retryCount + 1}/3`);
      } else {
        Alert.alert("Error", "Network error or server unavailable");
      }
    }
  };

  const handleVerifyOtp = async (retryCount = 0) => {
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${SERVER_URL}/verify-otp`, { email, otp }, {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      });

      setLoading(false);
      if (response.status === 200) {
        setOtpModalVisible(false);
        setResetModalVisible(true);
        setOtp("");
      } else {
        Alert.alert("Error", response.data.message || "Invalid OTP");
      }
    } catch (error) {
      setLoading(false);
      console.error('Verify OTP error:', error.message);
      if ((error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') && retryCount < 3) {
        setTimeout(() => handleVerifyOtp(retryCount + 1), 2000);
        Alert.alert('Retrying', `Network timeout. Retry attempt ${retryCount + 1}/3`);
      } else {
        Alert.alert("Error", "Network error or server unavailable");
      }
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${SERVER_URL}/send-otp`, { email }, {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      });

      setLoading(false);
      if (response.status === 200) {
        setTimer(60);
        setCanResend(false);
        setOtp("");
        Alert.alert("Success", "New OTP sent to your email.");
      } else {
        Alert.alert("Error", response.data.message || "Failed to resend OTP");
      }
    } catch (error) {
      setLoading(false);
      console.error('Resend OTP error:', error.message);
      Alert.alert("Error", "Network error or server unavailable");
    }
  };

  const handleResetPassword = async (retryCount = 0) => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in both password fields");
      return;
    }
    if (!validatePassword(newPassword)) {
      Alert.alert("Error", "Password must be at least 8 characters, contain one uppercase letter, and one special character");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${SERVER_URL}/reset-password`, { email, newPassword }, {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      });

      setLoading(false);
      if (response.status === 200) {
        setResetModalVisible(false);
        Alert.alert("Success", "Password reset successfully!", [
          { text: "OK", onPress: () => navigation.navigate("UserLogin") },
        ]);
      } else {
        Alert.alert("Error", response.data.message || "Failed to reset password");
      }
    } catch (error) {
      setLoading(false);
      console.error('Reset password error:', error.message);
      if ((error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') && retryCount < 3) {
        setTimeout(() => handleResetPassword(retryCount + 1), 2000);
        Alert.alert('Retrying', `Network timeout. Retry attempt ${retryCount + 1}/3`);
      } else {
        Alert.alert("Error", "Network error or server unavailable");
      }
    }
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
          <Text style={styles.header}>Forgot Password</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={24} color="#aaa" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!otpModalVisible && !resetModalVisible}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyEmailAndSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>

      <Modal visible={otpModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <Text style={styles.timerText}>Time remaining: {timer}s</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="key" size={24} color="#aaa" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resendButton, !canResend && styles.buttonDisabled]}
              onPress={handleResendOtp}
              disabled={!canResend || loading}
            >
              <Text style={styles.resendText}>
                {canResend ? "Resend OTP" : `Resend in ${timer}s`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={resetModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={24} color="#aaa" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={24}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, isConfirmPasswordValid() && styles.validConfirmPassword]}>
              <Ionicons name="lock-closed" size={24} color="#aaa" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#aaa"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? "eye" : "eye-off"}
                  size={24}
                  color="#aaa"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: "#000",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#03DAC6",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: "100%",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#fff",
    paddingVertical: 12,
    fontSize: 16,
  },
  validConfirmPassword: {
    borderColor: "#00FF00",
    borderWidth: 2,
  },
  button: {
    backgroundColor: "#03DAC6",
    paddingVertical: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#028f7e",
    opacity: 0.7,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  resendButton: {
    marginTop: 10,
    padding: 10,
  },
  resendText: {
    color: "#03DAC6",
    fontSize: 14,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#03DAC6",
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  timerText: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 15,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    backgroundColor: "#03DAC6",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ForgotPasswordScreen;