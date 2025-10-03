import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated } from 'react-native';

const games = [
  { 
    label: 'Leg', 
    value: 'leg', 
    icon: 'walk', 
    description: 'Focus on lower body strength with exercises like squats and lunges.', 
    benefits: 'Improves leg strength, balance, and mobility.', 
    exercises: ['Squats', 'Lunges', 'Calf Raises'] 
  },
  { 
    label: 'Chest', 
    value: 'chest', 
    icon: 'barbell', 
    description: 'Build your chest muscles with bench presses and push-ups.', 
    benefits: 'Enhances upper body strength and posture.', 
    exercises: ['Bench Press', 'Push-Ups', 'Chest Flys'] 
  },
  { 
    label: 'Shoulder', 
    value: 'shoulder', 
    icon: 'body', 
    description: 'Strengthen your shoulders with overhead presses and lateral raises.', 
    benefits: 'Boosts shoulder stability and prevents injuries.', 
    exercises: ['Overhead Press', 'Lateral Raises', 'Front Raises'] 
  },
  { 
    label: 'Muscle', 
    value: 'muscle', 
    icon: 'fitness', 
    description: 'Target overall muscle growth with compound lifts and isolation exercises.', 
    benefits: 'Promotes full-body muscle growth and endurance.', 
    exercises: ['Deadlifts', 'Bicep Curls', 'Tricep Dips'] 
  },
];

const GymGameSelect = ({ route, navigation }) => {
  const { email } = route.params || {};
  const [game, setGame] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const handleProceed = () => {
    if (!email) {
      Alert.alert('Error', 'Email not provided. Please go back and verify your email.');
      navigation.navigate('EmailVerification');
      return;
    }
    if (!game) {
      Alert.alert('Error', 'Please select a gym game');
      return;
    }
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, friction: 3 }).start(() =>
      navigation.navigate('GymTaskRegister', { email, game })
    );
  };

  const selectedGame = games.find(g => g.value === game);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Animatable.View animation="fadeInLeft" duration={1000}>
          <Image
            source={require('../assets/img/project_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animatable.View>
        <Animatable.Text animation="fadeInDown" duration={1000} style={styles.headerTitle}>
          Choose Your Gym Game
        </Animatable.Text>
        <Animatable.Text animation="fadeInDown" duration={1200} style={styles.headerSubtitle}>
          Kickstart Your Fitness Journey Today!
        </Animatable.Text>
      </View>

      {/* Date and Time */}
      <Animatable.Text animation="fadeIn" duration={1400} style={styles.dateTime}>
        Thursday, May 15, 2025 | 04:56 AM PKT
      </Animatable.Text>

      {/* Progress Bar */}
      <Animatable.View animation="fadeInUp" duration={1500} style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: game ? '33%' : '0%' }]} />
        </View>
        <Text style={styles.progressText}>Step 1 of 3: Select Game</Text>
      </Animatable.View>

      {/* What Are Gym Games Section */}
      <Animatable.View animation="fadeInUp" duration={1600} delay={200}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#FFD700" style={styles.infoIcon} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>What Are Gym Games?</Text>
            <Text style={styles.infoDescription}>
              Gym Games are fun, guided workout plans targeting specific body parts (like legs or chest). They include easy exercises to boost your strength and health!
            </Text>
          </View>
        </View>
      </Animatable.View>

      {/* Why Start Today Section */}
      <Animatable.View animation="fadeInUp" duration={1700} delay={400}>
        <Text style={styles.sectionTitle}>Why Start Today?</Text>
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Ionicons name="flame" size={20} color="#FF4500" style={styles.benefitIcon} />
            <Text style={styles.benefitText}>Burn calories and feel energized!</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="heart" size={20} color="#FF4500" style={styles.benefitIcon} />
            <Text style={styles.benefitText}>Improve your heart health now.</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="happy" size={20} color="#FF4500" style={styles.benefitIcon} />
            <Text style={styles.benefitText}>Boost your mood instantly!</Text>
          </View>
        </View>
      </Animatable.View>

      {/* How to Use This Screen Section */}
      <Animatable.View animation="fadeInUp" duration={1800} delay={600}>
        <Text style={styles.sectionTitle}>How to Get Started</Text>
        <View style={styles.stepsContainer}>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Tap the box below to pick a game.</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Read about the game and its perks.</Text>
          </View>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Hit "Proceed" to begin your workout!</Text>
          </View>
        </View>
      </Animatable.View>

      {/* Custom Dropdown for Game Selection */}
      <Animatable.View animation="fadeInUp" duration={1900} delay={800}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.dropdownText}>
            {game ? selectedGame.label : 'Pick Your Game'}
          </Text>
          <Ionicons name="chevron-down" size={24} color="#00CED1" />
        </TouchableOpacity>
      </Animatable.View>

      {/* Modal for Game Selection */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            {games.map((item, index) => (
              <Animatable.View
                animation="fadeInUp"
                duration={500 + index * 100}
                key={item.value}
              >
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setGame(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Ionicons name={item.icon} size={24} color="#00CED1" style={styles.modalIcon} />
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              </Animatable.View>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Game Info Section */}
      {game && (
        <Animatable.View animation="fadeInUp" duration={2000} delay={1000} style={styles.gameInfo}>
          <Ionicons name={selectedGame.icon} size={40} color="#00CED1" style={styles.gameIcon} />
          <Text style={styles.gameTitle}>{selectedGame.label} Workout</Text>
          <Text style={styles.gameDescription}>{selectedGame.description}</Text>
          <Text style={styles.benefitsText}>Benefits: {selectedGame.benefits}</Text>
          <Text style={styles.exerciseTitle}>Sample Exercises:</Text>
          {selectedGame.exercises.map((exercise, idx) => (
            <Text key={idx} style={styles.exerciseText}>- {exercise}</Text>
          ))}
        </Animatable.View>
      )}

      {/* Exercise Library Preview Section */}
      <Animatable.View animation="fadeInUp" duration={2100} delay={1200}>
        <Text style={styles.sectionTitle}>Exercise Library Preview</Text>
        <View style={styles.exerciseContainer}>
          {games.map((item, index) => (
            <Animatable.View
              animation="fadeInRight"
              duration={1000 + index * 200}
              key={item.value}
              style={styles.exerciseCard}
            >
              <Ionicons name={item.icon} size={20} color="#00CED1" style={styles.exerciseIcon} />
              <Text style={styles.exerciseLabel}>{item.label}</Text>
              <Text style={styles.exerciseSample}>{item.exercises[0]}</Text>
            </Animatable.View>
          ))}
        </View>
      </Animatable.View>

      {/* Benefits of Each Game Section */}
      <Animatable.View animation="fadeInUp" duration={2200} delay={1400}>
        <Text style={styles.sectionTitle}>Why Choose These Games?</Text>
        <View style={styles.benefitsContainer}>
          {games.map((item, index) => (
            <Animatable.View
              animation="fadeInLeft"
              duration={1000 + index * 200}
              key={item.value}
              style={styles.benefitCard}
            >
              <Ionicons name={item.icon} size={24} color="#00CED1" style={styles.benefitIcon} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitTitle}>{item.label}</Text>
                <Text style={styles.benefitDescription}>{item.benefits}</Text>
              </View>
            </Animatable.View>
          ))}
        </View>
      </Animatable.View>

      {/* User Stats Snapshot Section */}
      <Animatable.View animation="fadeInUp" duration={2300} delay={1600}>
        <View style={styles.statsCard}>
          <Ionicons name="stats-chart" size={24} color="#FFD700" style={styles.statsIcon} />
          <View style={styles.statsTextContainer}>
            <Text style={styles.statsTitle}>Your Stats Snapshot</Text>
            <Text style={styles.statsText}>Workouts Completed: 5</Text>
            <Text style={styles.statsText}>Last Workout: May 14, 2025</Text>
          </View>
        </View>
      </Animatable.View>

      {/* Safety Guidelines Section */}
      <Animatable.View animation="fadeInUp" duration={2400} delay={1800}>
        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark" size={24} color="#FF4500" style={styles.safetyIcon} />
          <View style={styles.safetyTextContainer}>
            <Text style={styles.safetyTitle}>Safety Guidelines</Text>
            <Text style={styles.safetyText}>- Use proper form to avoid injury.</Text>
            <Text style={styles.safetyText}>- Start with light weights if new.</Text>
            <Text style={styles.safetyText}>- Stop if you feel pain.</Text>
          </View>
        </View>
      </Animatable.View>

      {/* Quick Tip Section */}
      <Animatable.View animation="fadeInUp" duration={2500} delay={2000}>
        <View style={styles.tipContainer}>
          <Ionicons name="bulb" size={24} color="#FFD700" style={styles.tipIcon} />
          <View style={styles.tipTextContainer}>
            <Text style={styles.tipTitle}>Quick Tip</Text>
            <Text style={styles.tipDescription}>
              Warm up for 5-10 minutes with light cardio to prepare your muscles.
            </Text>
          </View>
        </View>
      </Animatable.View>

      {/* Motivational Quote Section */}
      <Animatable.View animation="fadeInUp" duration={2600} delay={2200}>
        <View style={styles.quoteContainer}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#FFD700" style={styles.quoteIcon} />
          <View style={styles.quoteTextContainer}>
            <Text style={styles.quoteTitle}>Motivational Quote</Text>
            <Text style={styles.quoteText}>
              "The only bad workout is the one you didn’t do!"
            </Text>
          </View>
        </View>
      </Animatable.View>

      {/* Sidebar Navigation Preview */}
      <Animatable.View animation="fadeInRight" duration={2700} delay={2400} style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Next Steps</Text>
        <TouchableOpacity style={styles.sidebarItem}>
          <Ionicons name="calendar" size={20} color="#FFF" />
          <Text style={styles.sidebarText}>Task Register</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem}>
          <Ionicons name="trophy" size={20} color="#FFF" />
          <Text style={styles.sidebarText}>Progress Tracker</Text>
        </TouchableOpacity>
      </Animatable.View>

      {/* Buttons */}
      <View style={styles.buttonWrapper}>
        <Animatable.View animation="bounceInUp" duration={2800} delay={2600}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#444', '#666']}
              style={styles.buttonInner}
            >
              <Ionicons name="arrow-back" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
        <Animatable.View animation="bounceInUp" duration={2900} delay={2800}>
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={handleProceed}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#00CED1', '#00CED1']}
              style={styles.buttonInner}
            >
              <Text style={styles.buttonText}>Proceed</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
    padding: 15,
    paddingBottom: 60,
    backgroundImage: 'linear-gradient(135deg, #121212 0%, #1E1E1E 100%)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#00CED1',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#00CED1',
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0FFFF',
    fontStyle: 'italic',
  },
  dateTime: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 15,
  },
  progressBarContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00CED1',
    borderRadius: 5,
  },
  progressText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(3, 218, 198, 0.2)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 6,
    borderLeftWidth: 5,
    borderLeftColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#00CED1',
  },
  infoIcon: {
    marginRight: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  infoDescription: {
    color: '#FFF',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#00CED1',
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 15,
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  stepsContainer: {
    marginBottom: 15,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumber: {
    backgroundColor: '#00CED1',
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    lineHeight: 30,
    marginRight: 10,
  },
  stepText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00CED1',
    marginBottom: 15,
    elevation: 6,
    shadowColor: '#00CED1',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  dropdownText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    borderWidth: 2,
    borderColor: '#00CED1',
    elevation: 6,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  modalIcon: {
    marginRight: 15,
  },
  modalItemText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  gameInfo: {
    backgroundColor: 'rgba(3, 218, 198, 0.25)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#00CED1',
    elevation: 6,
  },
  gameIcon: {
    marginBottom: 10,
  },
  gameTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  gameDescription: {
    color: '#E0FFFF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  benefitsText: {
    color: '#FFD700',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  exerciseTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  exerciseText: {
    color: '#E0FFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  exerciseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  exerciseCard: {
    backgroundColor: 'rgba(3, 218, 198, 0.2)',
    padding: 10,
    borderRadius: 10,
    width: '48%',
    marginBottom: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#00CED1',
  },
  exerciseIcon: {
    marginBottom: 5,
  },
  exerciseLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  exerciseSample: {
    color: '#E0FFFF',
    fontSize: 12,
  },
  benefitsContainer: {
    marginBottom: 15,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(3, 218, 198, 0.2)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#00CED1',
  },
  benefitIcon: {
    marginRight: 15,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  benefitDescription: {
    color: '#E0FFFF',
    fontSize: 14,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 10,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 69, 0, 0.2)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 6,
    borderLeftWidth: 5,
    borderLeftColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FF4500',
  },
  statsIcon: {
    marginRight: 15,
  },
  statsTextContainer: {
    flex: 1,
  },
  statsTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  statsText: {
    color: '#FFF',
    fontSize: 14,
  },
  safetyCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 69, 0, 0.2)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 6,
    borderLeftWidth: 5,
    borderLeftColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#FF4500',
  },
  safetyIcon: {
    marginRight: 15,
  },
  safetyTextContainer: {
    flex: 1,
  },
  safetyTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  safetyText: {
    color: '#FFF',
    fontSize: 14,
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(3, 218, 198, 0.2)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 6,
    borderLeftWidth: 5,
    borderLeftColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#00CED1',
  },
  tipIcon: {
    marginRight: 15,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  tipDescription: {
    color: '#FFF',
    fontSize: 14,
  },
  quoteContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(3, 218, 198, 0.2)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 6,
    borderLeftWidth: 5,
    borderLeftColor: '#FFD700',
    borderWidth: 2,
    borderColor: '#00CED1',
  },
  quoteIcon: {
    marginRight: 15,
  },
  quoteTextContainer: {
    flex: 1,
  },
  quoteTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  quoteText: {
    color: '#FFF',
    fontSize: 14,
    fontStyle: 'italic',
  },
  sidebar: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#00CED1',
    elevation: 6,
  },
  sidebarTitle: {
    color: '#00CED1',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sidebarText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 10,
  },
  buttonWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 15,
    borderRadius: 25,
    overflow: 'hidden',
  },
  proceedButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 6,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
});

export default GymGameSelect;