from flask import Flask, jsonify, request
from flask_cors import CORS
import cv2
import mediapipe as mp
import numpy as np
import time
import threading
import requests

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.8, min_tracking_confidence=0.8)

# Exercise configurations
exercise_configs = {
    "Bodyweight Squats": {"joints": ["HIP", "KNEE", "ANKLE"], "angle_range": (80, 160), "threshold": 0.8},
    "Lunges": {"joints": ["HIP", "KNEE", "ANKLE"], "angle_range": (70, 150), "threshold": 0.8},
    "Calf Raises": {"joints": ["KNEE", "ANKLE", "TOE"], "angle_range": (160, 180), "threshold": 0.8},
    "Wall Sits": {"joints": ["HIP", "KNEE", "ANKLE"], "angle_range": (85, 95), "threshold": 0.8},
    "Step-Ups": {"joints": ["HIP", "KNEE", "ANKLE"], "angle_range": (70, 150), "threshold": 0.8},
    "Glute Bridges": {"joints": ["SHOULDER", "HIP", "KNEE"], "angle_range": (140, 180), "threshold": 0.8},
    "Push-Ups": {"joints": ["SHOULDER", "ELBOW", "WRIST"], "angle_range": (70, 160), "threshold": 0.8},
    "Incline Push-Ups": {"joints": ["SHOULDER", "ELBOW", "WRIST"], "angle_range": (70, 160), "threshold": 0.8},
    "Dumbbell Bench Press": {"joints": ["SHOULDER", "ELBOW", "WRIST"], "angle_range": (70, 160), "threshold": 0.8},
    "Dumbbell Flyes": {"joints": ["SHOULDER", "ELBOW", "WRIST"], "angle_range": (90, 170), "threshold": 0.8},
    "Chest Dips (Assisted)": {"joints": ["SHOULDER", "ELBOW", "WRIST"], "angle_range": (70, 150), "threshold": 0.8},
    "Wall Push-Ups": {"joints": ["SHOULDER", "ELBOW", "WRIST"], "angle_range": (70, 160), "threshold": 0.8},
    "Dumbbell Shoulder Press": {"joints": ["SHOULDER", "ELBOW", "WRIST"], "angle_range": (70, 170), "threshold": 0.8},
    "Lateral Raises": {"joints": ["SHOULDER", "ELBOW", "WRIST"], "angle_range": (80, 100), "threshold": 0.8},
    "Front Raises": {"joints": ["SHOULDER", "ELBOW", "WRIST"], "angle_range": (80, 100), "threshold": 0.8},
    "Pike Push-Ups": {"joints": ["SHOULDER", "ELBOW", "WRIST"], "angle_range": (70, 150), "threshold": 0.8},
    "Rear Delt Flyes": {"joints": ["SHOULDER", "ELBOW", "WRIST"], "angle_range": (80, 100), "threshold": 0.8},
    "Shoulder Shrugs": {"joints": ["SHOULDER", "NECK"], "angle_range": (0, 20), "threshold": 0.8},
    "Deadlifts (Light)": {"joints": ["HIP", "KNEE", "ANKLE"], "angle_range": (70, 170), "threshold": 0.8},
    "Pull-Ups (Assisted)": {"joints": ["SHOULDER", "ELBOW", "WRIST"], "angle_range": (70, 150), "threshold": 0.8},
    "Dumbbell Rows": {"joints": ["SHOULDER", "ELBOW", "WRIST"], "angle_range": (70, 150), "threshold": 0.8},
    "Plank": {"joints": ["SHOULDER", "HIP", "KNEE"], "angle_range": (160, 180), "threshold": 0.8},
    "Mountain Climbers": {"joints": ["HIP", "KNEE", "ANKLE"], "angle_range": (70, 150), "threshold": 0.8},
    "Burpees": {"joints": ["HIP", "KNEE", "ANKLE"], "angle_range": (70, 170), "threshold": 0.8},
}

# Joint mappings for MediaPipe landmarks
joint_mappings = {
    "SHOULDER": mp_pose.PoseLandmark.LEFT_SHOULDER,
    "HIP": mp_pose.PoseLandmark.LEFT_HIP,
    "KNEE": mp_pose.PoseLandmark.LEFT_KNEE,
    "ANKLE": mp_pose.PoseLandmark.LEFT_ANKLE,
    "TOE": mp_pose.PoseLandmark.LEFT_FOOT_INDEX,
    "ELBOW": mp_pose.PoseLandmark.LEFT_ELBOW,
    "WRIST": mp_pose.PoseLandmark.LEFT_WRIST,
    "NECK": mp_pose.PoseLandmark.NOSE,  # Approximate for shrugs
}

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    if angle > 180.0:
        angle = 360 - angle
    return angle

def is_pose_correct(landmarks, exercise_config):
    try:
        joint_names = exercise_config["joints"]
        joint_a = joint_mappings[joint_names[0]]
        joint_b = joint_mappings[joint_names[1]]
        joint_c = joint_mappings.get(joint_names[2], joint_mappings.get("ANKLE"))

        lm_a = landmarks[joint_a]
        lm_b = landmarks[joint_b]
        lm_c = landmarks[joint_c]

        point_a = [lm_a.x, lm_a.y]
        point_b = [lm_b.x, lm_b.y]
        point_c = [lm_c.x, lm_c.y]

        angle = calculate_angle(point_a, point_b, point_c)
        min_angle, max_angle = exercise_config["angle_range"]
        confidence = (lm_a.visibility + lm_b.visibility + lm_c.visibility) / 3

        print(f"Angle: {angle:.2f}, Confidence: {confidence:.2f}")
        return min_angle <= angle <= max_angle and confidence >= exercise_config["threshold"]
    except Exception as e:
        print(f"Error in pose detection: {e}")
        return False

# Node.js server URL for database operations
NODE_SERVER_URL = "http://192.168.130.42:3001"

def fetch_task_counts(email, game):
    try:
        response = requests.post(
            f"{NODE_SERVER_URL}/get_task_counts",
            json={"email": email, "game": game},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            data = response.json()
            if data["success"]:
                # Convert list of counts to a dictionary for easier lookup
                counts = {item["task_name"]: item["count"] for item in data["counts"]}
                return counts
        print(f"Failed to fetch counts: {response.status_code}, {response.text}")
        return {}
    except Exception as e:
        print(f"Error fetching task counts: {e}")
        return {}

def update_task_count(email, game, task_name, count):
    try:
        response = requests.post(
            f"{NODE_SERVER_URL}/update_task_count",
            json={"email": email, "game": game, "task_name": task_name, "count": count},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            data = response.json()
            if data["success"]:
                return True
        print(f"Failed to update count: {response.status_code}, {response.text}")
        return False
    except Exception as e:
        print(f"Error updating task count: {e}")
        return False

# Global state
current_task = None
task_count = 0
max_counts = 10
is_counting = False
last_count_time = 0
count_cooldown = 1.0  # 1 second cooldown between counts
current_email = None
current_game = None

@app.route('/start_counting', methods=['POST'])
def start_counting():
    global current_task, task_count, is_counting, last_count_time, current_email, current_game
    data = request.get_json()
    current_email = data.get("email")
    current_game = data.get("game")
    current_task = data.get("task_name")
    if not all([current_email, current_game, current_task]):
        return jsonify({"success": False, "message": "Missing required parameters"}), 400

    # Fetch current counts from the database
    counts = fetch_task_counts(current_email, current_game)
    task_count = counts.get(current_task, 0)

    if task_count >= max_counts:
        return jsonify({"success": False, "message": "Task already completed"}), 400

    is_counting = True
    last_count_time = time.time()
    threading.Thread(target=process_frame, daemon=True).start()
    print(f"Started counting for {current_task} (Email: {current_email}, Game: {current_game})")
    return jsonify({"success": True, "message": "Counting started"}), 200

@app.route('/stop_counting', methods=['POST'])
def stop_counting():
    global is_counting
    is_counting = False
    print("Counting stopped")
    return jsonify({"success": True, "message": "Counting stopped"}), 200

@app.route('/get_counts', methods=['GET'])
def get_counts():
    try:
        # Fetch counts for the current email and game
        if not current_email or not current_game:
            return jsonify({"success": False, "message": "Email or game not set"}), 400
        counts = fetch_task_counts(current_email, current_game)
        # Format counts as a dictionary with keys in the format "email:game:task_name"
        formatted_counts = {
            f"{current_email}:{current_game}:{task_name}": count
            for task_name, count in counts.items()
        }
        return jsonify(formatted_counts), 200
    except Exception as e:
        print(f"Error serving task counts: {e}")
        return jsonify({"success": False, "message": "Failed to fetch counts"}), 500

def process_frame():
    global task_count, last_count_time, is_counting
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Failed to open camera")
        return

    exercise_config = exercise_configs.get(current_task)
    if not exercise_config:
        print(f"Invalid task: {current_task}")
        cap.release()
        return

    last_pose_state = False
    while is_counting:
        ret, frame = cap.read()
        if not ret:
            print("Failed to capture frame")
            break

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(frame_rgb)

        if results.pose_landmarks:
            mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
            pose_correct = is_pose_correct(results.pose_landmarks.landmark, exercise_config)
            current_time = time.time()

            if pose_correct and not last_pose_state and task_count < max_counts:
                if current_time - last_count_time >= count_cooldown:
                    task_count += 1
                    last_count_time = current_time
                    # Update the count in the database
                    if update_task_count(current_email, current_game, current_task, task_count):
                        print(f"Count updated: {current_task} - {task_count}")
                    else:
                        print(f"Failed to update count for {current_task}")

            last_pose_state = pose_correct

        cv2.putText(frame, f"Count: {task_count}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.imshow("Pose Estimation", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

        if task_count >= max_counts:
            is_counting = False
            break

        time.sleep(0.1)  # Prevent CPU overload

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)