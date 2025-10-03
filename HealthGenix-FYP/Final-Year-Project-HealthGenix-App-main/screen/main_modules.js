import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

// Screen dimensions for responsive design
const screenWidth = Dimensions.get('window').width;

// Module data with high-quality online images and detailed info
const modules = [
  {
    id: 1,
    name: 'Diet',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
    screen: 'DietBot',
    description: 'Personalized nutrition plans tailored to your goals—weight loss, muscle gain, or balanced living. Powered by AI, this module creates meal plans based on your dietary preferences, restrictions, and health objectives.',
    features: [
      'Weekly updated meal plans customized for you',
      'Detailed nutritional tracking with calorie analysis',
      'Allergy-friendly recipes and dietary-specific options',
      'Integration with wearables for real-time dietary insights',
    ],
    benefits: 'Achieve optimal health with delicious, easy-to-follow meal plans designed just for you.',
    stats: { recipesLogged: 45, caloriesTracked: 12000, goalsMet: 3 },
    progress: 0.75,
    motivationalQuote: '“Good nutrition is the foundation of a healthy life.”',
  },
  {
    id: 2,
    name: 'Rehabilitation',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
    screen: 'Rehabilitation_Chatbot',
    description: 'Recover smarter with guided rehabilitation programs for injuries or post-surgery recovery. This module offers step-by-step exercises, progress tracking, and AI-driven adjustments to ensure a safe and effective healing journey.',
    features: [
      'Personalized recovery plans based on your injury',
      'Video-guided exercises with real-time form feedback',
      'Progress monitoring with adaptive program adjustments',
      '24/7 chatbot support for recovery-related queries',
    ],
    benefits: 'Regain strength and mobility with expert-guided programs tailored to your needs.',
    stats: { sessionsCompleted: 20, mobilityImproved: '30%', recoveryGoals: 4 },
    progress: 0.60,
    motivationalQuote: '“Every step forward is a victory in your recovery journey.”',
  },
  {
    id: 3,
    name: 'Gym',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
    screen: 'CameraScreen',
    description: 'Elevate your fitness with custom workout routines designed for strength, endurance, and flexibility. This module provides tailored exercise plans, AI-powered form correction, and detailed progress tracking to maximize your gym results.',
    features: [
      'Custom workouts for beginners to advanced levels',
      'AI-powered form correction using your camera',
      'Workout scheduling with smart reminders',
      'Performance analytics to monitor strength gains',
    ],
    benefits: 'Unleash your fitness potential with personalized routines and real-time guidance.',
    stats: { workoutsCompleted: 30, repsTracked: 1500, fitnessGoals: 5 },
    progress: 0.85,
    motivationalQuote: '“Strength doesn’t come from what you can do; it comes from overcoming what you couldn’t.”',
  },
];

const MainModules = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default profile image
  const defaultProfileImage = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

  useEffect(() => {
    // Fade-in animation for the header
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Fetch user data
    fetchUserData();
  }, [fadeAnim]);

  const fetchUserData = () => {
    fetch('http://10.54.12.63:3001/profile', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user data');
        return res.json();
      })
      .then(data => {
        if (data.message) {
          navigation.replace('LoginScreen');
        } else {
          setUser({
            ...data,
            profile_image: data.profile_image || defaultProfileImage,
          });
        }
      })
      .catch(err => {
        console.error('Error fetching user data:', err);
        Alert.alert('Error', 'Failed to fetch user data');
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <Animatable.View animation="rotate" iterationCount="infinite" duration={1500}>
          <Ionicons name="fitness" size={50} color="#00CED1" />
        </Animatable.View>
        <Text style={styles.loaderText}>Loading your wellness journey...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0F24" />
      <View style={styles.background}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header with Profile and Motivational Tagline */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <TouchableOpacity onPress={() => navigation.navigate('UserDashboard')}>
              <Image
                source={{ uri: user?.profile_image }}
                style={styles.avatar}
                onError={() => setUser(prevUser => ({ ...prevUser, profile_image: defaultProfileImage }))}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Welcome ! {user?.username || 'User'}!</Text>
            <Text style={styles.headerSubtitle}>Choose a module to elevate your wellness journey</Text>
          </Animated.View>

          {/* Module Cards */}
          <View style={styles.moduleContainer}>
            {modules.map((module, index) => (
              <ModuleCard key={module.id} module={module} navigation={navigation} index={index} />
            ))}
          </View>

          {/* Footer Motivational Message */}
          <Animatable.View animation="fadeInUp" duration={2000} style={styles.footer}>
            <Text style={styles.footerText}>
              Transform your life today—select a module and start your journey to better health!
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => Alert.alert('Explore More', 'More features coming soon! Stay tuned.')}
            >
              <Text style={styles.exploreButtonText}>Explore More Features</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" style={styles.exploreIcon} />
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const ModuleCard = ({ module, navigation, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequential fade-in animation for each card
    Animated.timing(fadeInAnim, {
      toValue: 1,
      duration: 800,
      delay: index * 300,
      useNativeDriver: true,
    }).start();

    // Pulsing glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeInAnim, glowAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 6,
      tension: 90,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 90,
      useNativeDriver: true,
    }).start();
  };

  const handleStart = () => {
    navigation.navigate(module.screen);
  };

  return (
    <Animated.View
      style={[
        styles.moduleCard,
        {
          opacity: fadeInAnim,
          transform: [{ scale: scaleAnim }],
          shadowOpacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 0.6],
          }),
        },
      ]}
    >
      <View style={styles.cardBackground}>
        {/* Module Image with Gradient Overlay */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: module.image }} style={styles.moduleImage} resizeMode="cover" />
          <View style={styles.imageOverlay} />
        </View>

        {/* Module Title and Description */}
        <Animatable.View animation="fadeInDown" duration={1000} style={styles.moduleHeader}>
          <Text style={styles.moduleTitle}>{module.name}</Text>
          <Text style={styles.moduleDescription}>{module.description}</Text>
        </Animatable.View>

        {/* Key Features */}
        <Animatable.View animation="fadeInUp" duration={1200} style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Key Features:</Text>
          {module.features.map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#00CED1" style={styles.featureIcon} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </Animatable.View>

        {/* Benefits and Motivational Quote */}
        <Animatable.View animation="fadeInUp" duration={1400}>
          <Text style={styles.benefitsTitle}>Why Choose {module.name}?</Text>
          <Text style={styles.benefitsText}>{module.benefits}</Text>
          <View style={styles.quoteContainer}>
            <Ionicons name="chatbubble-ellipses" size={16} color="#FFD700" style={styles.quoteIcon} />
            <Text style={styles.quoteText}>{module.motivationalQuote}</Text>
          </View>
        </Animatable.View>

        {/* Stats Preview */}
        <Animatable.View animation="fadeInUp" duration={1600} style={styles.statsContainer}>
          <View style={styles.statItem}>
            <FontAwesome5 name="chart-bar" size={16} color="#00CED1" />
            <Text style={styles.statValue}>
              {module.name === 'Diet'
                ? module.stats.recipesLogged
                : module.name === 'Rehabilitation'
                ? module.stats.sessionsCompleted
                : module.stats.workoutsCompleted}
            </Text>
            <Text style={styles.statLabel}>
              {module.name === 'Diet'
                ? 'Recipes Logged'
                : module.name === 'Rehabilitation'
                ? 'Sessions Done'
                : 'Workouts Completed'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trending-up" size={16} color="#00CED1" />
            <Text style={styles.statValue}>
              {module.name === 'Diet'
                ? module.stats.caloriesTracked
                : module.name === 'Rehabilitation'
                ? module.stats.mobilityImproved
                : module.stats.repsTracked}
            </Text>
            <Text style={styles.statLabel}>
              {module.name === 'Diet'
                ? 'Calories Tracked'
                : module.name === 'Rehabilitation'
                ? 'Mobility Improved'
                : 'Reps Tracked'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="emoji-events" size={16} color="#00CED1" />
            <Text style={styles.statValue}>
              {module.stats.goalsMet || module.stats.recoveryGoals || module.stats.fitnessGoals}
            </Text>
            <Text style={styles.statLabel}>Goals Achieved</Text>
          </View>
        </Animatable.View>

        {/* Progress Preview */}
        <Animatable.View animation="fadeInUp" duration={1800} style={styles.progressContainer}>
          <Text style={styles.progressTitle}>Your Progress</Text>
          <View style={styles.progressBar}>
            <Animated.View
              style={[styles.progressFill, { width: `${module.progress * 100}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{(module.progress * 100).toFixed(0)}% Complete</Text>
        </Animatable.View>

        {/* Start Button */}
        <Animatable.View animation="bounceIn" duration={2000}>
          <TouchableOpacity
            style={styles.startButton}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleStart}
          >
            <LinearGradientBackground style={styles.startButtonBackground}>
              <Text style={styles.startButtonText}>Start {module.name} Now</Text>
              <Ionicons name="play-circle" size={20} color="#FFF" style={styles.startIcon} />
            </LinearGradientBackground>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </Animated.View>
  );
};

// Custom Linear Gradient Component (Simulated since React Native doesn't have a direct LinearGradient)
const LinearGradientBackground = ({ children, style }) => {
  return (
    <View style={[style, { backgroundColor: '#00CED1', borderRadius: 12 }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0F24',
  },
  background: {
    flex: 1,
    backgroundColor: '#0A0F24',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#00CED1',
    shadowColor: '#00CED1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 206, 209, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#B0BEC5',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '400',
    paddingHorizontal: 20,
  },
  moduleContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  moduleCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    marginBottom: 30,
    elevation: 12,
    shadowColor: '#00CED1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 206, 209, 0.4)',
    overflow: 'hidden',
  },
  cardBackground: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#1E1E1E',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  moduleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 206, 209, 0.2)',
  },
  moduleHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  moduleTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 206, 209, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginBottom: 10,
  },
  moduleDescription: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    color: '#00CED1',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'left',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#B0BEC5',
    lineHeight: 20,
    flex: 1,
  },
  benefitsTitle: {
    fontSize: 18,
    color: '#00CED1',
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  benefitsText: {
    fontSize: 14,
    color: '#B0BEC5',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  quoteContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  quoteIcon: {
    marginRight: 10,
  },
  quoteText: {
    fontSize: 14,
    color: '#FFD700',
    fontStyle: 'italic',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 10,
    borderRadius: 8,
    width: '30%',
  },
  statValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#B0BEC5',
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 16,
    color: '#00CED1',
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00CED1',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#B0BEC5',
    textAlign: 'right',
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    elevation: 5,
  },
  startButtonBackground: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 8,
  },
  startIcon: {
    marginLeft: 5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#B0BEC5',
    textAlign: 'center',
    fontWeight: '400',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  exploreButton: {
    flexDirection: 'row',
    backgroundColor: '#00CED1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  exploreButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 10,
  },
  exploreIcon: {
    marginLeft: 5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0F24',
  },
  loaderText: {
    fontSize: 16,
    color: '#B0BEC5',
    marginTop: 15,
  },
});

export default MainModules;