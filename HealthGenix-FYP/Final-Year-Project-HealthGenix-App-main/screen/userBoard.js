import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const screenWidth = Dimensions.get('window').width;
const NOTIFICATION_API = 'http://10.54.12.63:3001/api/notifications';
const FEEDBACK_API = 'http://10.54.12.63:3001/api/feedback';

const UserDashboard = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [dailyTasks, setDailyTasks] = useState([
    { id: 1, task: 'Drink 8 glasses of water', completed: false },
    { id: 2, task: 'Walk 10,000 steps', completed: false },
    { id: 3, task: '30 min workout', completed: false },
  ]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [mood, setMood] = useState(null);

  // Default profile image if user image is not available
  const defaultProfileImage = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

  useEffect(() => {
    fetchUserData();
    fetchNotifications();
  }, []);

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

  const fetchNotifications = () => {
    fetch(`${NOTIFICATION_API}/user`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch notifications');
        return res.json();
      })
      .then(data => setNotifications(data))
      .catch(err => console.error('Error fetching notifications:', err));
  };

  const markAsSeen = (id) => {
    fetch(`${NOTIFICATION_API}/${id}/seen`, {
      method: 'PUT',
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to mark as seen');
        return res.json();
      })
      .then(() => {
        setNotifications(notifications.map(n => (n.id === id ? { ...n, is_seen: true } : n)));
      })
      .catch(err => console.error('Error marking as seen:', err));
  };

  const submitFeedback = () => {
    if (!feedback || !selectedNotification) {
      Alert.alert('Error', 'Please enter feedback before submitting.');
      return;
    }

    fetch(FEEDBACK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ user_email: user.email, notification_id: selectedNotification.id, feedback }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to submit feedback');
        return res.json();
      })
      .then(() => {
        Alert.alert('Success', 'Feedback submitted successfully');
        setShowFeedbackModal(false);
        setFeedback('');
        setSelectedNotification(null);
      })
      .catch(err => {
        console.error('Error submitting feedback:', err);
        Alert.alert('Error', 'Failed to submit feedback. Please try again.');
      });
  };

  const toggleProfileModal = () => {
    setModalVisible(!modalVisible);
  };

  const handleChangeProfilePhoto = () => {
    Alert.alert('Change Profile Photo', 'Image picker functionality would be implemented here.');
    setUser(prevUser => ({
      ...prevUser,
      profile_image: defaultProfileImage,
    }));
  };

  const toggleTaskCompletion = (id) => {
    setDailyTasks(tasks =>
      tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const logWaterIntake = () => {
    setWaterIntake(prev => prev + 1);
    Alert.alert('Success', 'Water intake logged! You’ve had ' + (waterIntake + 1) + ' glasses today.');
  };

  const logMood = (moodEmoji) => {
    setMood(moodEmoji);
    Alert.alert('Mood Logged', `You’re feeling ${moodEmoji} today!`);
  };

  if (loading) return <ActivityIndicator size="large" color="#00CED1" style={styles.loader} />;

  return (
    <ScrollView style={styles.container}>
      {/* Logo in Top-Left Corner with Contrasting Background */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/img/project_logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Header with Solid Background */}
      <View style={styles.header}>
        <Animatable.Text animation="fadeInDown" duration={1000} style={styles.headerTitle}>
          Welcome, {user?.username || 'User'}!
        </Animatable.Text>
        <Animatable.Text animation="fadeInDown" duration={1200} style={styles.headerSubtitle}>
          Let’s Track Your Fitness Journey
        </Animatable.Text>
        {/* Top Bar with Profile and Notifications */}
        <View style={styles.topBar}>
          <Animatable.View animation="fadeInRight" duration={1000}>
            <TouchableOpacity onPress={() => setShowNotifications(!showNotifications)}>
              <Ionicons name="notifications-outline" size={30} color="#FFF" style={styles.notificationIcon} />
              {notifications.filter(n => !n.is_seen).length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{notifications.filter(n => !n.is_seen).length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animatable.View>
          <Animatable.View animation="fadeInRight" duration={1200}>
            <TouchableOpacity onPress={toggleProfileModal}>
              <Image
                source={{ uri: user?.profile_image }}
                style={styles.avatar}
                onError={() => setUser(prevUser => ({ ...prevUser, profile_image: defaultProfileImage }))}
              />
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </View>

      {/* Quote of the Day */}
      <Animatable.View animation="fadeInUp" duration={1000}>
        <View style={styles.quoteContainer}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#FFD700" style={styles.quoteIcon} />
          <View style={styles.quoteTextContainer}>
            <Text style={styles.quoteTitle}>Quote of the Day</Text>
            <Text style={styles.quoteText}>
              "The only bad workout is the one that didn’t happen."
            </Text>
          </View>
        </View>
      </Animatable.View>

      {/* User Stats Cards */}
      <View style={styles.statsContainer}>
        <Animatable.View animation="zoomIn" duration={1000} style={styles.statCard}>
          <View style={styles.statCardBackground}>
            <Text style={styles.statValue}>$1,200</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
        </Animatable.View>
        <Animatable.View animation="zoomIn" duration={1200} style={styles.statCard}>
          <View style={styles.statCardBackground}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Subscriptions</Text>
          </View>
        </Animatable.View>
      </View>
      <View style={styles.statsContainer}>
        <Animatable.View animation="zoomIn" duration={1400} style={styles.statCard}>
          <View style={styles.statCardBackground}>
            <Text style={styles.statValue}>450</Text>
            <Text style={styles.statLabel}>Calories Burned</Text>
          </View>
        </Animatable.View>
        <Animatable.View animation="zoomIn" duration={1600} style={styles.statCard}>
          <View style={styles.statCardBackground}>
            <Text style={styles.statValue}>7.5</Text>
            <Text style={styles.statLabel}>Hours Slept</Text>
          </View>
        </Animatable.View>
      </View>

      {/* Quick Actions Section */}
      <Animatable.View animation="fadeInUp" duration={1000}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Start Workout', 'Starting a new workout...')}>
            <Ionicons name="play-circle" size={30} color="#FFF" />
            <Text style={styles.quickActionText}>Start Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Log Meal', 'Logging a meal...')}>
            <Ionicons name="restaurant" size={30} color="#FFF" />
            <Text style={styles.quickActionText}>Log Meal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={logWaterIntake}>
            <Ionicons name="water" size={30} color="#FFF" />
            <Text style={styles.quickActionText}>Track Water</Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>

      {/* Progress Snapshot */}
      <Animatable.View animation="fadeInUp" duration={1200}>
        <Text style={styles.sectionTitle}>Weekly Progress Snapshot</Text>
        <View style={styles.snapshotContainer}>
          <View style={styles.snapshotItem}>
            <Ionicons name="footsteps" size={24} color="#00CED1" style={styles.snapshotIcon} />
            <View>
              <Text style={styles.snapshotValue}>70,000</Text>
              <Text style={styles.snapshotLabel}>Total Steps</Text>
            </View>
          </View>
          <View style={styles.snapshotItem}>
            <Ionicons name="flame" size={24} color="#00CED1" style={styles.snapshotIcon} />
            <View>
              <Text style={styles.snapshotValue}>3,150</Text>
              <Text style={styles.snapshotLabel}>Calories Burned</Text>
            </View>
          </View>
          <View style={styles.snapshotItem}>
            <Ionicons name="bed" size={24} color="#00CED1" style={styles.snapshotIcon} />
            <View>
              <Text style={styles.snapshotValue}>52.5</Text>
              <Text style={styles.snapshotLabel}>Hours Slept</Text>
            </View>
          </View>
        </View>
      </Animatable.View>

      {/* Daily Tasks Checklist */}
      <Animatable.View animation="fadeInUp" duration={1400}>
        <Text style={styles.sectionTitle}>Daily Tasks Checklist</Text>
        <View style={styles.tasksContainer}>
          {dailyTasks.map((task, index) => (
            <Animatable.View animation="fadeInLeft" duration={1000 + index * 200} key={task.id} style={styles.taskCard}>
              <TouchableOpacity onPress={() => toggleTaskCompletion(task.id)}>
                <Ionicons
                  name={task.completed ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={task.completed ? '#00CED1' : '#999'}
                  style={styles.taskIcon}
                />
              </TouchableOpacity>
              <Text style={[styles.taskText, task.completed && styles.taskCompleted]}>
                {task.task}
              </Text>
            </Animatable.View>
          ))}
        </View>
      </Animatable.View>

      {/* Water Intake Tracker */}
      <Animatable.View animation="fadeInUp" duration={1600}>
        <Text style={styles.sectionTitle}>Water Intake Tracker</Text>
        <View style={styles.waterIntakeContainer}>
          <Ionicons name="water" size={24} color="#00CED1" style={styles.waterIntakeIcon} />
          <Text style={styles.waterIntakeText}>
            Glasses today: {waterIntake}/8
          </Text>
          <TouchableOpacity style={styles.waterIntakeButton} onPress={logWaterIntake}>
            <Text style={styles.waterIntakeButtonText}>Add Glass</Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>

      {/* Mood Tracker */}
      <Animatable.View animation="fadeInUp" duration={1800}>
        <Text style={styles.sectionTitle}>Mood Tracker</Text>
        <View style={styles.moodContainer}>
          <Text style={styles.moodText}>How are you feeling today?</Text>
          <View style={styles.moodOptions}>
            {['😊', '😐', '😢', '😡'].map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.moodButton, mood === emoji && styles.moodButtonSelected]}
                onPress={() => logMood(emoji)}
              >
                <Text style={styles.moodEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {mood && <Text style={styles.moodLogged}>Mood logged: {mood}</Text>}
        </View>
      </Animatable.View>

      {/* Meal Planner */}
      <Animatable.View animation="fadeInUp" duration={2000}>
        <Text style={styles.sectionTitle}>Today’s Meal Plan</Text>
        <View style={styles.mealContainer}>
          {[
            { meal: 'Breakfast', description: 'Oatmeal with berries', time: '8:00 AM' },
            { meal: 'Lunch', description: 'Grilled chicken salad', time: '1:00 PM' },
            { meal: 'Dinner', description: 'Salmon with quinoa', time: '7:00 PM' },
            { meal: 'Snack', description: 'Greek yogurt', time: '4:00 PM' },
          ].map((meal, index) => (
            <Animatable.View animation="fadeInLeft" duration={1000 + index * 200} key={index} style={styles.mealCard}>
              <Ionicons name="restaurant" size={24} color="#00CED1" style={styles.mealIcon} />
              <View style={styles.mealTextContainer}>
                <Text style={styles.mealTitle}>{meal.meal}</Text>
                <Text style={styles.mealDescription}>{meal.description}</Text>
                <Text style={styles.mealTime}>{meal.time}</Text>
              </View>
              <TouchableOpacity style={styles.mealLogButton} onPress={() => Alert.alert('Meal Logged', `Logged ${meal.meal}: ${meal.description}`)}>
                <Text style={styles.mealLogButtonText}>Log</Text>
              </TouchableOpacity>
            </Animatable.View>
          ))}
        </View>
      </Animatable.View>

      {/* Workout Schedule */}
      <Animatable.View animation="fadeInUp" duration={2200}>
        <Text style={styles.sectionTitle}>Today’s Workout Schedule</Text>
        <View style={styles.workoutContainer}>
          {[
            { workout: 'Morning Run', duration: '30 min', time: '7:00 AM' },
            { workout: 'Strength Training', duration: '45 min', time: '6:00 PM' },
          ].map((workout, index) => (
            <Animatable.View animation="fadeInLeft" duration={1000 + index * 200} key={index} style={styles.workoutCard}>
              <FontAwesome5 name="dumbbell" size={24} color="#00CED1" style={styles.workoutIcon} />
              <View style={styles.workoutTextContainer}>
                <Text style={styles.workoutTitle}>{workout.workout}</Text>
                <Text style={styles.workoutDetails}>{workout.duration}</Text>
                <Text style={styles.workoutTime}>{workout.time}</Text>
              </View>
              <TouchableOpacity style={styles.workoutStartButton} onPress={() => Alert.alert('Workout Started', `Starting ${workout.workout}`)}>
                <Text style={styles.workoutStartButtonText}>Start</Text>
              </TouchableOpacity>
            </Animatable.View>
          ))}
        </View>
      </Animatable.View>

      {/* Community Challenges */}
      <Animatable.View animation="fadeInUp" duration={2400}>
        <Text style={styles.sectionTitle}>Community Challenges</Text>
        <View style={styles.challengesContainer}>
          {[
            { challenge: '30-Day Step Challenge', participants: 1200, goal: '300,000 steps' },
            { challenge: 'Yoga Streak', participants: 850, goal: '30 sessions' },
          ].map((challenge, index) => (
            <Animatable.View animation="fadeInLeft" duration={1000 + index * 200} key={index} style={styles.challengeCard}>
              <Ionicons name="people" size={24} color="#00CED1" style={styles.challengeIcon} />
              <View style={styles.challengeTextContainer}>
                <Text style={styles.challengeTitle}>{challenge.challenge}</Text>
                <Text style={styles.challengeDetails}>{challenge.participants} participants</Text>
                <Text style={styles.challengeDetails}>Goal: {challenge.goal}</Text>
              </View>
              <TouchableOpacity style={styles.challengeJoinButton} onPress={() => Alert.alert('Challenge Joined', `You’ve joined the ${challenge.challenge}`)}>
                <Text style={styles.challengeJoinButtonText}>Join</Text>
              </TouchableOpacity>
            </Animatable.View>
          ))}
        </View>
      </Animatable.View>

      {/* Fitness Goals Section */}
      <Animatable.View animation="fadeInUp" duration={2600}>
        <Text style={styles.sectionTitle}>Your Fitness Goals</Text>
        <View style={styles.goalsContainer}>
          {[
            { title: 'Lose 5kg', progress: 0.6, target: '5kg', current: '3kg' },
            { title: 'Run 50km', progress: 0.8, target: '50km', current: '40km' },
            { title: 'Drink 2L Water Daily', progress: 0.9, target: '2L', current: '1.8L' },
          ].map((goal, index) => (
            <Animatable.View animation="fadeInLeft" duration={1000 + index * 200} key={index} style={styles.goalCard}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${goal.progress * 100}%` }]} />
              </View>
              <Text style={styles.goalProgress}>
                {goal.current}/{goal.target} ({(goal.progress * 100).toFixed(0)}%)
              </Text>
            </Animatable.View>
          ))}
        </View>
      </Animatable.View>

      {/* Recent Activity Section */}
      <Animatable.View animation="fadeInUp" duration={2800}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityContainer}>
          {[
            { icon: 'dumbbell', title: 'Workout Completed', time: 'Today, 10:30 AM', details: '30 min Strength Training' },
            { icon: 'heartbeat', title: 'Heart Rate Check', time: 'Yesterday, 3:15 PM', details: '75 bpm' },
            { icon: 'walking', title: 'Steps Goal Achieved', time: 'Yesterday, 9:00 AM', details: '10,000 steps' },
            { icon: 'bed', title: 'Sleep Tracked', time: 'Yesterday, 8:00 AM', details: '7.5 hours' },
          ].map((activity, index) => (
            <Animatable.View animation="fadeInLeft" duration={1000 + index * 200} key={index} style={styles.activityCard}>
              <FontAwesome5 name={activity.icon} size={24} color="#00CED1" style={styles.activityIcon} />
              <View style={styles.activityTextContainer}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDetails}>{activity.details}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </Animatable.View>
          ))}
        </View>
      </Animatable.View>

      {/* Upcoming Events Section */}
      <Animatable.View animation="fadeInUp" duration={3000}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <View style={styles.eventsContainer}>
          {[
            { title: 'Yoga Class', date: 'May 16, 2025', time: '8:00 AM', location: 'Community Center' },
            { title: 'Marathon Prep', date: 'May 18, 2025', time: '6:00 PM', location: 'City Park' },
            { title: 'Nutrition Workshop', date: 'May 20, 2025', time: '2:00 PM', location: 'Online' },
          ].map((event, index) => (
            <Animatable.View animation="fadeInLeft" duration={1000 + index * 200} key={index} style={styles.eventCard}>
              <Ionicons name="calendar" size={24} color="#00CED1" style={styles.eventIcon} />
              <View style={styles.eventTextContainer}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDetails}>{event.date} at {event.time}</Text>
                <Text style={styles.eventDetails}>Location: {event.location}</Text>
              </View>
            </Animatable.View>
          ))}
        </View>
      </Animatable.View>

      {/* Achievements Section */}
      <Animatable.View animation="fadeInUp" duration={3200}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsContainer}>
          {[
            { title: '10K Steps Streak', description: 'Achieved 10,000 steps for 7 days straight!', icon: 'medal' },
            { title: 'Workout Warrior', description: 'Completed 50 workouts this year!', icon: 'trophy' },
            { title: 'Hydration Hero', description: 'Drank 2L of water daily for a month!', icon: 'water' },
          ].map((achievement, index) => (
            <Animatable.View animation="fadeInLeft" duration={1000 + index * 200} key={index} style={styles.achievementCard}>
              <Ionicons name={achievement.icon} size={24} color="#FFD700" style={styles.achievementIcon} />
              <View style={styles.achievementTextContainer}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
              </View>
            </Animatable.View>
          ))}
        </View>
      </Animatable.View>

      {/* Health Tips Section */}
      <Animatable.View animation="fadeInUp" duration={3400}>
        <Text style={styles.sectionTitle}>Health Tips</Text>
        <View style={styles.tipsContainer}>
          {[
            { tip: 'Stay Hydrated', description: 'Drink at least 2 liters of water daily to keep your body functioning optimally.' },
            { tip: 'Balanced Diet', description: 'Include a variety of fruits, vegetables, and proteins in your meals for optimal nutrition.' },
            { tip: 'Regular Exercise', description: 'Aim for at least 30 minutes of physical activity every day to stay fit and healthy.' },
            { tip: 'Sleep Well', description: 'Ensure 7-8 hours of quality sleep to aid recovery and improve mental health.' },
          ].map((tip, index) => (
            <Animatable.View animation="fadeInLeft" duration={1000 + index * 200} key={index} style={styles.tipCard}>
              <Ionicons name="bulb" size={24} color="#00CED1" style={styles.tipIcon} />
              <View style={styles.tipTextContainer}>
                <Text style={styles.tipTitle}>{tip.tip}</Text>
                <Text style={styles.tipDescription}>{tip.description}</Text>
              </View>
            </Animatable.View>
          ))}
        </View>
      </Animatable.View>

      {/* Notifications Popup */}
      {showNotifications && (
        <Animatable.View animation="fadeInDown" duration={500} style={styles.notificationPopup}>
          <ScrollView>
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <TouchableOpacity
                  key={notif.id}
                  style={[styles.notificationItem, notif.is_seen ? styles.seenNotification : null]}
                  onPress={() => {
                    markAsSeen(notif.id);
                    setSelectedNotification(notif);
                    setShowFeedbackModal(true);
                  }}
                >
                  <Text style={styles.notificationText}>{notif.message}</Text>
                  <Text style={styles.notificationTime}>{new Date(notif.created_at).toLocaleString()}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noNotificationText}>No notifications</Text>
            )}
          </ScrollView>
        </Animatable.View>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedNotification && (
        <Modal visible={showFeedbackModal} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Feedback for Notification</Text>
              <Text style={styles.notificationText}>{selectedNotification.message}</Text>
              <TextInput
                style={[styles.input, { height: 100 }]}
                placeholder="Your feedback..."
                placeholderTextColor="#999"
                value={feedback}
                onChangeText={setFeedback}
                multiline
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={submitFeedback}>
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={() => setShowFeedbackModal(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Bottom Navigation Buttons */}
      <View style={styles.bottomNav}>
        <Animatable.View animation="bounceIn" duration={1000} style={styles.navButton}>
          <TouchableOpacity onPress={() => navigation.navigate('main_modules')}>
            <View style={styles.navButtonBackground}>
              <Ionicons name="home" size={30} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.navButtonText}>Modules</Text>
        </Animatable.View>
        <Animatable.View animation="bounceIn" duration={1200} style={styles.navButton}>
          <TouchableOpacity onPress={() => navigation.navigate('Admin_Analytics')}>
            <View style={styles.navButtonBackground}>
              <FontAwesome5 name="chart-line" size={30} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.navButtonText}>Analytics</Text>
        </Animatable.View>
        <Animatable.View animation="bounceIn" duration={1400} style={styles.navButton}>
          <TouchableOpacity onPress={() => navigation.navigate('profile')}>
            <View style={styles.navButtonBackground}>
              <Ionicons name="settings" size={30} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.navButtonText}>Settings</Text>
        </Animatable.View>
        <Animatable.View animation="bounceIn" duration={1600} style={styles.navButton}>
          <TouchableOpacity onPress={() => navigation.navigate('UserLogin')}>
            <View style={styles.navButtonBackground}>
              <Ionicons name="log-out" size={30} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.navButtonText}>Logout</Text>
        </Animatable.View>
      </View>

      {/* Profile Image Modal */}
      <Modal transparent={true} visible={modalVisible} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.profileModalContent}>
            <Image
              source={{ uri: user?.profile_image }}
              style={styles.fullscreenImage}
              onError={() => setUser(prevUser => ({ ...prevUser, profile_image: defaultProfileImage }))}
            />
            <TouchableOpacity style={styles.changePhotoButton} onPress={handleChangeProfilePhoto}>
              <Text style={styles.changePhotoText}>Change Profile Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeModalButton} onPress={toggleProfileModal}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 10,
  },
  logoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#00CED1', // Changed to aqua for contrast with white logo
    borderRadius: 50,
    padding: 5,
    elevation: 5,
    zIndex: 1000,
  },
  logo: {
    width: 80,
    height: 80,
  },
  header: {
    paddingTop: 120,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    backgroundColor: '#00CED1',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0FFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'absolute',
    top: 20,
    right: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#00CED1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  notificationIcon: {
    marginRight: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: 15,
    backgroundColor: '#FF4500',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quoteContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  quoteIcon: {
    marginRight: 15,
  },
  quoteTextContainer: {
    flex: 1,
  },
  quoteTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  quoteText: {
    color: '#FFF',
    fontSize: 14,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 20,
    marginHorizontal: 10,
  },
  statCard: {
    width: '48%',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    marginBottom: 10,
  },
  statCardBackground: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#00CED1',
  },
  statValue: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#E0FFFF',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  quickActionButton: {
    backgroundColor: '#1E90FF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '30%',
    elevation: 3,
  },
  quickActionText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#00CED1',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
    marginHorizontal: 20,
  },
  snapshotContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  snapshotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  snapshotIcon: {
    marginRight: 15,
  },
  snapshotValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  snapshotLabel: {
    color: '#999',
    fontSize: 12,
  },
  tasksContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  taskIcon: {
    marginRight: 15,
  },
  taskText: {
    color: '#FFF',
    fontSize: 16,
    flex: 1,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  waterIntakeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 3,
  },
  waterIntakeIcon: {
    marginRight: 15,
  },
  waterIntakeText: {
    color: '#FFF',
    fontSize: 16,
    flex: 1,
  },
  waterIntakeButton: {
    backgroundColor: '#00CED1',
    padding: 10,
    borderRadius: 5,
  },
  waterIntakeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  moodContainer: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 3,
  },
  moodText: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 10,
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  moodButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#333',
  },
  moodButtonSelected: {
    backgroundColor: '#00CED1',
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLogged: {
    color: '#E0FFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  mealContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  mealIcon: {
    marginRight: 15,
  },
  mealTextContainer: {
    flex: 1,
  },
  mealTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mealDescription: {
    color: '#E0FFFF',
    fontSize: 12,
    marginVertical: 3,
  },
  mealTime: {
    color: '#999',
    fontSize: 12,
  },
  mealLogButton: {
    backgroundColor: '#00CED1',
    padding: 10,
    borderRadius: 5,
  },
  mealLogButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  workoutContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  workoutIcon: {
    marginRight: 15,
  },
  workoutTextContainer: {
    flex: 1,
  },
  workoutTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  workoutDetails: {
    color: '#E0FFFF',
    fontSize: 12,
    marginVertical: 3,
  },
  workoutTime: {
    color: '#999',
    fontSize: 12,
  },
  workoutStartButton: {
    backgroundColor: '#00CED1',
    padding: 10,
    borderRadius: 5,
  },
  workoutStartButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  challengesContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  challengeIcon: {
    marginRight: 15,
  },
  challengeTextContainer: {
    flex: 1,
  },
  challengeTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  challengeDetails: {
    color: '#999',
    fontSize: 12,
    marginTop: 3,
  },
  challengeJoinButton: {
    backgroundColor: '#00CED1',
    padding: 10,
    borderRadius: 5,
  },
  challengeJoinButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  goalsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  goalCard: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  goalTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00CED1',
  },
  goalProgress: {
    color: '#999',
    fontSize: 12,
  },
  activityContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  activityIcon: {
    marginRight: 15,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  activityDetails: {
    color: '#E0FFFF',
    fontSize: 12,
    marginVertical: 3,
  },
  activityTime: {
    color: '#999',
    fontSize: 12,
  },
  eventsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  eventIcon: {
    marginRight: 15,
  },
  eventTextContainer: {
    flex: 1,
  },
  eventTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  eventDetails: {
    color: '#999',
    fontSize: 12,
    marginTop: 3,
  },
  achievementsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  achievementIcon: {
    marginRight: 15,
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
  },
  achievementDescription: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 3,
  },
  tipsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  tipIcon: {
    marginRight: 15,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tipDescription: {
    color: '#E0FFFF',
    fontSize: 12,
    marginTop: 3,
    flexShrink: 1, // Prevents overflow
  },
  notificationPopup: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 300,
    maxHeight: 400,
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 15,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#00CED1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  notificationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  seenNotification: {
    backgroundColor: '#333',
  },
  notificationText: {
    color: '#FFF',
    fontSize: 14,
  },
  notificationTime: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  noNotificationText: {
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalContent: {
    padding: 20,
    borderRadius: 15,
    width: '85%',
    elevation: 5,
    backgroundColor: '#00CED1',
  },
  profileModalContent: {
    width: '90%',
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#333',
    color: '#FFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#121212',
    fontSize: 14,
    fontWeight: 'bold',
  },
  changePhotoButton: {
    backgroundColor: '#00CED1',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  changePhotoText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeModalButton: {
    backgroundColor: '#FF4500',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  closeModalText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 30,
    marginHorizontal: 20,
  },
  navButton: {
    alignItems: 'center',
  },
  navButtonBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    backgroundColor: '#00CED1',
  },
  navButtonText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 5,
  },
  fullscreenImage: {
    width: '100%',
    height: 300,
    borderRadius: 15,
    resizeMode: 'cover',
  },
  loader: {
    marginTop: 20,
  },
});

export default UserDashboard;