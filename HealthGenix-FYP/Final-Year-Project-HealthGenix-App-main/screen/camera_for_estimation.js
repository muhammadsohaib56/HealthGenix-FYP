import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const GymCountScreen = ({ route, navigation }) => {
  const { email = 'test@example.com', game = 'leg' } = route.params || {};
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [counts, setCounts] = useState({});
  const [isCounting, setIsCounting] = useState(false);
  const [tasks, setTasks] = useState([]);
  const scaleAnim = new Animated.Value(1);

  const FLASK_SERVER_URL = 'http://10.54.12.63:5000';
  const NODE_SERVER_URL = 'http://10.54.12.63:3001';

  useEffect(() => {
    const fetchTasks = async () => {
      if (!email || !game) {
        Alert.alert('Error', 'Missing required parameters. Please go back.', [
          { text: 'OK', onPress: () => navigation.navigate('GymGameSelect', { email }) },
        ]);
        return;
      }

      try {
        const response = await fetch(`${NODE_SERVER_URL}/get-tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, game }),
        });
        const data = await response.json();
        if (data.success) {
          setTasks(data.tasks);
        } else {
          Alert.alert('Error', data.message || 'Failed to fetch tasks');
        }
      } catch (error) {
        console.error('Fetch tasks error:', error.message);
        Alert.alert('Error', 'Failed to fetch tasks. Please try again.');
      }
    };

    fetchTasks();
  }, [email, game, navigation]);

  useEffect(() => {
    let interval;
    const fetchCounts = async () => {
      try {
        const response = await fetch(`${FLASK_SERVER_URL}/get_counts`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
          console.error('Failed to fetch counts:', response.status);
          return;
        }
        const data = await response.json();
        const countMap = {};
        Object.keys(data).forEach((key) => {
          const [keyEmail, keyGame, taskName] = key.split(':');
          if (keyEmail === email && keyGame === game) {
            countMap[taskName] = data[key];
          }
        });
        setCounts(countMap);

        // Trigger confetti animation if task is completed
        const currentTask = tasks[currentTaskIndex];
        if (currentTask && countMap[currentTask] >= 10 && isCounting) {
          stopCounting();
          Alert.alert('Great Job!', `${currentTask} completed!`, [
            { text: 'Next', onPress: nextTask },
          ]);
        }
      } catch (error) {
        console.error('Error fetching counts:', error.message);
      }
    };

    fetchCounts();
    interval = setInterval(fetchCounts, 1000);

    return () => clearInterval(interval);
  }, [email, game, tasks, currentTaskIndex, isCounting]);

  const startCounting = async () => {
    if (isCounting || tasks.length === 0) return;
    const currentTask = tasks[currentTaskIndex];
    if (counts[currentTask] >= 10) {
      Alert.alert('Task Already Completed', 'Please proceed to the next task.');
      return;
    }
    try {
      const response = await fetch(`${FLASK_SERVER_URL}/start_counting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, game, task_name: currentTask }),
      });
      const data = await response.json();
      if (data.success) {
        setIsCounting(true);
        Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true, friction: 3 }).start();
      } else {
        Alert.alert('Error', data.message || 'Failed to start counting');
      }
    } catch (error) {
      console.error('Start counting error:', error.message);
      Alert.alert('Error', 'Failed to start counting. Please check your connection and try again.');
    }
  };

  const stopCounting = async () => {
    if (!isCounting) return;
    try {
      const response = await fetch(`${FLASK_SERVER_URL}/stop_counting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        setIsCounting(false);
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 3 }).start();
      } else {
        Alert.alert('Error', data.message || 'Failed to stop counting');
      }
    } catch (error) {
      console.error('Stop counting error:', error.message);
      Alert.alert('Error', 'Failed to stop counting. Please try again.');
    }
  };

  const nextTask = () => {
    stopCounting();
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      Alert.alert('Completed', 'All tasks finished!', [
        { text: 'OK', onPress: () => navigation.navigate('GymGameSelect', { email }) },
      ]);
    }
  };

  const currentCount = counts[tasks[currentTaskIndex]] || 0;
  const progressPercentage = (currentCount / 10) * 100;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Animatable.View animation="fadeInLeft" duration={1000}>
          <Image
            source={{ uri: 'https://via.placeholder.com/90x90.png?text=HealthGenix' }}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animatable.View>
        <Animatable.Text animation="fadeInDown" duration={1000} style={styles.headerTitle}>
         {game.charAt(0).toUpperCase() + game.slice(1)} Workout
        </Animatable.Text>
        <Animatable.Text animation="fadeInDown" duration={1200} style={styles.headerSubtitle}>
          Keep Pushing, {email.split('@')[0]}!
        </Animatable.Text>
      </View>

      {/* Date and Time */}
      <Animatable.Text animation="fadeIn" duration={1400} style={styles.dateTime}>
        Thursday, May 15, 2025 | 05:03 AM PKT
      </Animatable.Text>

      {/* Progress Indicator */}
      <Animatable.View animation="fadeInUp" duration={1500} style={styles.progressContainer}>
        <View style={styles.circularProgress}>
          <LinearGradient
            colors={['#00CED1', '#1E90FF']}
            style={[styles.circularProgressFill, { transform: [{ rotate: `${progressPercentage * 3.6}deg` }] }]}
          />
          <View style={styles.circularProgressInner}>
            <Text style={styles.countText}>{currentCount} / 10</Text>
            <Text style={styles.currentTaskText}>{tasks[currentTaskIndex] || 'N/A'}</Text>
          </View>
        </View>
        <Text style={styles.progressText}>Step 3 of 3: Complete Tasks ({currentTaskIndex + 1}/{tasks.length})</Text>
      </Animatable.View>

      {/* Buttons */}
      <Animatable.View animation="bounceInUp" duration={1600} delay={200} style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isCounting && styles.buttonDisabled]}
          onPress={startCounting}
          disabled={isCounting}
        >
          <LinearGradient colors={isCounting ? ['#B0B0B0', '#B0B0B0'] : ['#00CED1', '#1E90FF']} style={styles.buttonInner}>
            <Ionicons name="play" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Start</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, !isCounting && styles.buttonDisabled]}
          onPress={stopCounting}
          disabled={!isCounting}
        >
          <LinearGradient colors={isCounting ? ['#FF4500', '#FF6347'] : ['#B0B0B0', '#B0B0B0']} style={styles.buttonInner}>
            <Ionicons name="pause" size={20} color="#FFF" />
            <Text style={styles.buttonText}>Stop</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={nextTask}>
          <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.buttonInner}>
            <Ionicons name={currentTaskIndex < tasks.length - 1 ? 'arrow-forward' : 'checkmark'} size={20} color="#FFF" />
            <Text style={styles.buttonText}>{currentTaskIndex < tasks.length - 1 ? 'Next' : 'Finish'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>

      {/* Task Progress Section */}
      <Animatable.View animation="fadeInUp" duration={1700} delay={400}>
        <Text style={styles.sectionTitle}>Task Progress</Text>
        <View style={styles.taskGrid}>
          {tasks.map((task, index) => (
            <View key={index} style={styles.taskCard}>
              <Ionicons
                name={counts[task] >= 10 ? 'checkmark-circle' : 'barbell'}
                size={20}
                color={counts[task] >= 10 ? '#FFD700' : '#00CED1'}
                style={styles.taskIcon}
              />
              <View style={styles.taskContent}>
                <Text style={styles.taskText}>{task}</Text>
                <View style={styles.taskProgressBar}>
                  <View
                    style={[
                      styles.taskProgressFill,
                      { width: `${((counts[task] || 0) / 10) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.taskCount}>{counts[task] || 0} / 10</Text>
              </View>
            </View>
          ))}
        </View>
      </Animatable.View>

      {/* Workout Stats Section */}
      <Animatable.View animation="fadeInUp" duration={1800} delay={600}>
        <View style={styles.statsCard}>
          <Ionicons name="stats-chart" size={24} color="#FFD700" style={styles.statsIcon} />
          <View style={styles.statsTextContainer}>
            <Text style={styles.statsTitle}>Workout Stats</Text>
            <Text style={styles.statsText}>Total Reps: {Object.values(counts).reduce((a, b) => a + b, 0)}</Text>
            <Text style={styles.statsText}>Calories Burned: {Math.round(Object.values(counts).reduce((a, b) => a + b, 0) * 0.5)} kcal</Text>
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
              Keep your movements controlled and focus on your breathing to maximize results.
            </Text>
          </View>
        </View>
      </Animatable.View>

      {/* Motivational Quote Section */}
      <Animatable.View animation="fadeInUp" duration={2000} delay={1000}>
        <View style={styles.quoteCard}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#FFD700" style={styles.quoteIcon} />
          <View style={styles.quoteTextContainer}>
            <Text style={styles.quoteTitle}>Motivational Quote</Text>
            <Text style={styles.quoteText}>
              "Every rep brings you closer to your goals!"
            </Text>
          </View>
        </View>
      </Animatable.View>
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
    backgroundImage: 'radial-gradient(circle at center, #1E1E1E 0%, #121212 100%)',
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
  progressContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  circularProgress: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 10,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 10,
    elevation: 6,
    shadowColor: '#00CED1',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  circularProgressFill: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 10,
    borderColor: 'transparent',
    borderRightColor: '#00CED1',
    borderTopColor: '#00CED1',
  },
  circularProgressInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00CED1',
  },
  currentTaskText: {
    fontSize: 14,
    color: '#FFF',
    textAlign: 'center',
    marginTop: 5,
  },
  progressText: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
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
    marginLeft: 8,
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
  taskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  taskCard: {
    backgroundColor: 'rgba(3, 218, 198, 0.2)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    borderWidth: 2,
    borderColor: '#00CED1',
  },
  taskIcon: {
    marginRight: 10,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  taskProgressBar: {
    height: 5,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  taskProgressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 5,
  },
  taskCount: {
    color: '#E0FFFF',
    fontSize: 12,
    textAlign: 'right',
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
  quoteCard: {
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
});

export default GymCountScreen;