import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const taskLists = {
  leg: [
    'Bodyweight Squats',
    'Lunges',
    'Calf Raises',
    'Wall Sits',
    'Step-Ups',
    'Glute Bridges',
  ],
  chest: [
    'Push-Ups',
    'Incline Push-Ups',
    'Dumbbell Bench Press',
    'Dumbbell Flyes',
    'Chest Dips (Assisted)',
    'Wall Push-Ups',
  ],
  shoulder: [
    'Dumbbell Shoulder Press',
    'Lateral Raises',
    'Front Raises',
    'Pike Push-Ups',
    'Rear Delt Flyes',
    'Shoulder Shrugs',
  ],
  muscle: [
    'Deadlifts (Light)',
    'Pull-Ups (Assisted)',
    'Dumbbell Rows',
    'Plank',
    'Mountain Climbers',
    'Burpees',
  ],
};

const TaskRegisterScreen = ({ route, navigation }) => {
  const { email, game } = route.params || {};
  const [tasks, setTasks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (!email || !game) {
      Alert.alert('Error', 'Email or game not provided. Please go back and select a game.', [
        { text: 'OK', onPress: () => navigation.navigate('GymGameSelect', { email: email || '' }) },
      ]);
      return;
    }
    console.log('TaskRegisterScreen params:', { email, game });
    setTasks(taskLists[game] || []);
  }, [email, game, navigation]);

  const submitTasks = async () => {
    if (!email || !game) {
      Alert.alert('Error', 'Email or game not provided');
      return;
    }
    if (tasks.length !== 6) {
      Alert.alert('Error', 'Exactly 6 tasks are required for the selected game');
      return;
    }
    console.log('Submitting tasks:', { email, game, tasks });
    try {
      const response = await axios.post(
        'http://10.54.12.63:3001/register-tasks',
        { email, game, tasks },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      if (response.data.success) {
        setModalVisible(true);
        setTasks([]);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to register tasks');
      }
    } catch (error) {
      console.error('Task registration error:', error.response ? JSON.stringify(error.response.data) : error.message);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to register tasks. Please check your connection and try again.'
      );
    }
  };

  const handleStartPractice = () => {
    setModalVisible(false);
    console.log('Navigating to gym_pose_estimation_camera with:', { email, game, tasks: taskLists[game] });
    navigation.navigate('camera_for_estimation', { email, game, tasks: taskLists[game] });
  };

  const handleLater = () => {
    setModalVisible(false);
    navigation.navigate('GymGameSelect', { email });
  };

  if (!email || !game) {
    return (
      <View style={styles.container}>
        <Animatable.View animation="fadeInUp" duration={1000}>
          <Text style={styles.header}>Oops, Something’s Missing!</Text>
          <Text style={styles.subHeader}>Please select a gym game to proceed.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('GymGameSelect', { email: email || '' })}
          >
            <LinearGradient colors={['#444', '#666']} style={styles.buttonInner}>
              <Ionicons name="arrow-back" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    );
  }

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
          Register Your Tasks
        </Animatable.Text>
        <Animatable.Text animation="fadeInDown" duration={1200} style={styles.headerSubtitle}>
          Let’s Get Moving, {email.split('@')[0]}!
        </Animatable.Text>
      </View>

      {/* Date and Time */}
      <Animatable.Text animation="fadeIn" duration={1400} style={styles.dateTime}>
        Thursday, May 15, 2025 | 04:59 AM PKT
      </Animatable.Text>

      {/* Progress Bar */}
      <Animatable.View animation="fadeInUp" duration={1500} style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: tasks.length === 6 ? '66%' : '0%' }]} />
        </View>
        <Text style={styles.progressText}>Step 2 of 3: Register Tasks (6/6)</Text>
      </Animatable.View>

      {/* Task Summary */}
      <Animatable.View animation="fadeInUp" duration={1600} delay={200}>
        <Text style={styles.sectionTitle}>
          Your {game.charAt(0).toUpperCase() + game.slice(1)} Tasks
        </Text>
        <Text style={styles.subHeader}>
          Here are the 6 tasks for your {game} workout. Tap each to learn more!
        </Text>
      </Animatable.View>

      {/* Task List */}
      {tasks.length === 6 ? (
        <Animatable.View animation="fadeInUp" duration={1700} delay={400}>
          {tasks.map((task, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.taskCard,
                selectedTask === task && styles.taskCardSelected,
              ]}
              onPress={() => setSelectedTask(task === selectedTask ? null : task)}
            >
              <Ionicons
                name={taskLists[game].includes(task) ? 'barbell' : 'alert-circle'}
                size={24}
                color={selectedTask === task ? '#FFD700' : '#00CED1'}
                style={styles.taskIcon}
              />
              <Text style={styles.taskText}>{task}</Text>
              {selectedTask === task && (
                <Animatable.Text
                  animation="fadeIn"
                  duration={500}
                  style={styles.taskDetail}
                >
                  Focus on proper form to maximize benefits and avoid injury.
                </Animatable.Text>
              )}
            </TouchableOpacity>
          ))}
        </Animatable.View>
      ) : (
        <Text style={styles.noTasksText}>No tasks available for the selected game.</Text>
      )}

      {/* Task Benefits Section */}
      <Animatable.View animation="fadeInUp" duration={1800} delay={600}>
        <Text style={styles.sectionTitle}>Why These Tasks?</Text>
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Ionicons name="flame" size={20} color="#FF4500" style={styles.benefitIcon} />
            <Text style={styles.benefitText}>Burn calories and build strength!</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="heart" size={20} color="#FF4500" style={styles.benefitIcon} />
            <Text style={styles.benefitText}>Improve your endurance.</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="happy" size={20} color="#FF4500" style={styles.benefitIcon} />
            <Text style={styles.benefitText}>Feel stronger and more confident!</Text>
          </View>
        </View>
      </Animatable.View>

      {/* Pro Tip Section */}
      <Animatable.View animation="fadeInUp" duration={1900} delay={800}>
        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={24} color="#FFD700" style={styles.tipIcon} />
          <View style={styles.tipTextContainer}>
            <Text style={styles.tipTitle}>Pro Tip</Text>
            <Text style={styles.tipText}>
              Perform each task with slow, controlled movements to engage your muscles fully.
            </Text>
          </View>
        </View>
      </Animatable.View>

      {/* What’s Next Section */}
      <Animatable.View animation="fadeInUp" duration={2000} delay={1000}>
        <View style={styles.nextCard}>
          <Ionicons name="information-circle" size={24} color="#FFD700" style={styles.nextIcon} />
          <View style={styles.nextTextContainer}>
            <Text style={styles.nextTitle}>What’s Next?</Text>
            <Text style={styles.nextText}>
              After confirming, you can start practicing with our pose estimation camera or save for later.
            </Text>
          </View>
        </View>
      </Animatable.View>

      {/* Sidebar Navigation Preview */}
      <Animatable.View animation="fadeInRight" duration={2100} delay={1200} style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Next Steps</Text>
        <TouchableOpacity style={styles.sidebarItem}>
          <Ionicons name="camera" size={20} color="#FFF" />
          <Text style={styles.sidebarText}>Pose Estimation Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem}>
          <Ionicons name="trophy" size={20} color="#FFF" />
          <Text style={styles.sidebarText}>Progress Tracker</Text>
        </TouchableOpacity>
      </Animatable.View>

      {/* Buttons */}
      <View style={styles.buttonWrapper}>
        <Animatable.View animation="bounceInUp" duration={2200} delay={1400}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('GymGameSelect', { email })}
          >
            <LinearGradient colors={['#444', '#666']} style={styles.buttonInner}>
              <Ionicons name="arrow-back" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
        <Animatable.View animation="bounceInUp" duration={2300} delay={1600}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={submitTasks}
          >
            <LinearGradient colors={['#00CED1', '#00CED1']} style={styles.buttonInner}>
              <Text style={styles.buttonText}>Confirm & Submit</Text>
              <Ionicons name="checkmark" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
      </View>

      {/* Popup Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View
            animation="zoomIn"
            duration={500}
            style={styles.modalContainer}
          >
            <Ionicons name="checkmark-circle" size={50} color="#00CED1" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Tasks Registered Successfully!</Text>
            <Text style={styles.modalMessage}>
              Great job! Would you like to start practicing now?
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleStartPractice}
              >
                <LinearGradient colors={['#00CED1', '#1E90FF']} style={styles.modalButtonInner}>
                  <Text style={styles.modalButtonText}>Start Now</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.laterButton]}
                onPress={handleLater}
              >
                <LinearGradient colors={['#444', '#666']} style={styles.modalButtonInner}>
                  <Text style={styles.modalButtonText}>Later</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </Modal>
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
  sectionTitle: {
    color: '#00CED1',
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 15,
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  subHeader: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 15,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(3, 218, 198, 0.2)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#00CED1',
  },
  taskCardSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  taskIcon: {
    marginRight: 15,
  },
  taskText: {
    color: '#FFF',
    fontSize: 16,
    flex: 1,
  },
  taskDetail: {
    color: '#E0FFFF',
    fontSize: 12,
    marginTop: 5,
  },
  benefitsContainer: {
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitIcon: {
    marginRight: 10,
  },
  benefitText: {
    color: '#FFF',
    fontSize: 14,
  },
  tipCard: {
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
  tipText: {
    color: '#FFF',
    fontSize: 14,
  },
  nextCard: {
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
  nextIcon: {
    marginRight: 15,
  },
  nextTextContainer: {
    flex: 1,
  },
  nextTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  nextText: {
    color: '#FFF',
    fontSize: 14,
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
  submitButton: {
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
  noTasksText: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00CED1',
    elevation: 6,
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00CED1',
    marginBottom: 10,
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  modalMessage: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  laterButton: {
    backgroundColor: '#444',
  },
  modalButtonInner: {
    padding: 12,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TaskRegisterScreen;