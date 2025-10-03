import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const slideAnim = new Animated.Value(50);
  const pulseAnim = new Animated.Value(1);
  const particleAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.elastic(1.5),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, []);

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1080&h=1920&fit=crop' }}
      style={styles.background}
    >
      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.7)']}
        style={styles.gradientOverlay}
      />

      {/* Date and Time in Top-Right */}
      <Animatable.Text animation="fadeIn" duration={1000} style={styles.dateTime}>
        Thursday, May 15, 2025 | 05:40 AM PKT
      </Animatable.Text>

      {/* Logo in Top-Left Corner */}
       

      {/* Main Content */}
      <View style={styles.overlay}>
        {/* Heading with Glassmorphism Effect */}
        <Animatable.View animation="fadeInDown" duration={1200} style={styles.headerContainer}>
          <Text style={styles.heading}>HealthGenix</Text>
        </Animatable.View>

        {/* Subtitle with Slide-In Animation */}
        <Animated.Text
          style={[
            styles.subText,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          Elevate your fitness journey with personalized workouts and expert guidance.
        </Animated.Text>

        {/* Get Started Button with Pulsating Glow */}
        <Animated.View style={[styles.buttonContainer, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('UserLogin')}
            accessibilityLabel="Get Started Button"
          >
            <LinearGradient
              colors={['#1E90FF', '#FFD700']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Motivational Tagline */}
        <Animatable.Text animation="fadeInUp" duration={1500} delay={500} style={styles.tagline}>
          Transform Your Life, One Step at a Time
        </Animatable.Text>
      </View>

      {/* Chatbot Button with Animation */}
      <Animatable.View animation="pulse" iterationCount="infinite" style={styles.chatBotButtonContainer}>
        <TouchableOpacity
          style={styles.chatBotButton}
          onPress={() => navigation.navigate('LandingPageChatBot')}
          accessibilityLabel="Chatbot Button"
        >
          <Ionicons name="chatbubble-ellipses" size={30} color="#FFF" />
        </TouchableOpacity>
      </Animatable.View>

      {/* Particle Effects for Energy Vibe */}
      {Array.from({ length: 10 }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              opacity: particleAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [
                {
                  translateY: particleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -100],
                  }),
                },
                { translateX: Math.random() * 200 - 100 },
              ],
            },
          ]}
        />
      ))}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  dateTime: {
    position: 'absolute',
    top: 20,
    right: 20,
    fontSize: 14,
    color: '#E0FFFF',
    textShadowColor: '#333333',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    fontFamily: 'sans-serif',
    zIndex: 2,
  },
  logoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 2,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#1E90FF',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  overlay: {
    width: '100%',
    paddingHorizontal: 30,
    paddingBottom: 60,
    alignItems: 'center',
    zIndex: 2,
  },
  headerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)', // Glassmorphism effect (simulated)
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 20,
    elevation: 10,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heading: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
    fontFamily: 'serif',
  },
  subText: {
    fontSize: 18,
    color: '#E0FFFF',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'sans-serif',
    lineHeight: 24,
    textShadowColor: '#333333',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  buttonContainer: {
    elevation: 10,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  button: {
    borderRadius: 35,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'sans-serif',
    textShadowColor: '#333333',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#A9A9A9',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    fontFamily: 'sans-serif',
    textShadowColor: '#FFF',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  chatBotButtonContainer: {
    position: 'absolute',
    right: 20,
    bottom: 50,
    zIndex: 2,
  },
  chatBotButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)', // Glassmorphism effect (simulated)
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#FFD700',
    borderRadius: 4,
    top: '50%',
    left: '50%',
    zIndex: 1,
  },
});

export default WelcomeScreen;