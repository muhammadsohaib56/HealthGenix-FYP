const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3001;
const host = '10.54.12.63';

app.use(express.json());
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

if (!fs.existsSync('./Uploads')) fs.mkdirSync('./Uploads');

app.use(cors({
  origin: ['http://10.54.12.63:8081', 'http://10.54.12.63:3001', 'http://localhost:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 },
}));

const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: '1234',
  database: 'userinformation',
};

const db = require('mysql2').createConnection(dbConfig);
db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
});

const pool = mysql.createPool(dbConfig);

const dbConnect = async (req, res, next) => {
  try {
    req.db = await pool.getConnection();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
};

const isAuthenticated = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ message: 'Unauthorized' });
  next();
};

const isAdmin = (req, res, next) => {
  if (!req.session.admin) return res.status(403).json({ message: 'Forbidden: Admin access required' });
  next();
};

const EMAIL_ADDRESS = 'f219111@cfd.nu.edu.pk';
const APP_PASSWORD = 'wjwf jjsk wqsd gdnz';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: EMAIL_ADDRESS, pass: APP_PASSWORD },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP configuration error:', error);
    process.exit(1);
  }
  console.log('SMTP server ready');
});

const otpStore = new Map();

function isValidEmail(email) {
  return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email);
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(to, otp) {
  const mailOptions = {
    from: EMAIL_ADDRESS,
    to,
    subject: 'HealthGenix Account Verification',
    html: `
      <h2>HealthGenix Account Verification</h2>
      <p>Your OTP is:</p>
      <div style='background:#FFA500;color:#000;font-size:30px;font-weight:bold;width:200px;height:100px;text-align:center;line-height:100px;margin:20px auto;border-radius:10px;'>${otp}</div>
      <p>Thank you for using our service!</p>
    `,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to} with OTP: ${otp}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error;
  }
}

app.get('/exercise-results', (req, res) => {
  const filePath = path.join(__dirname, './ChatBot/exercise_results.csv');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading CSV:', err);
      return res.status(500).json({ error: 'Error reading data' });
    }
    res.setHeader('Content-Type', 'text/csv');
    res.send(data);
  });
});

app.post('/signup', upload.single('profileImage'), async (req, res) => {
  const { email, username, country, phone, password } = req.body;
  const profileImage = req.file ? `http://${host}:${port}/Uploads/${req.file.filename}` : null;
  const session_id = crypto.randomUUID();

  if (!email || !username || !country || !phone || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!/^[A-Za-z\s]+$/.test(username)) {
    return res.status(400).json({ message: 'Username must contain only letters and spaces' });
  }
  if (!/^[0-9]+$/.test(phone)) {
    return res.status(400).json({ message: 'Phone must contain only digits' });
  }
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters, contain one uppercase letter, and one special character' });
  }

  let retries = 3;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      const [existingEmail] = await pool.execute('SELECT email FROM users WHERE email = ?', [email]);
      if (existingEmail.length > 0) {
        return res.status(409).json({ message: 'Email already exists' });
      }
      const [existingPhone] = await pool.execute('SELECT phone FROM users WHERE phone = ?', [phone]);
      if (existingPhone.length > 0) {
        return res.status(409).json({ message: 'Phone number already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = `INSERT INTO users (email, username, country, phone, password, profile_image, session_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      await pool.execute(sql, [email, username, country, phone, hashedPassword, profileImage, session_id]);
      console.log(`User signed up: ${email}, session_id: ${session_id}`);
      return res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (err) {
      retries -= 1;
      console.error(`Signup error for ${email} (attempt ${4 - retries}/3):`, err.message);
      if (retries === 0) {
        return res.status(500).json({ message: 'Signup failed', error: err.message });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [results] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (results.length === 0) {
      console.error('Login error: No user found for', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.error('Login error: Invalid password for', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    req.session.user = { email: user.email, profile_image: user.profile_image };
    req.session.save(err => err && console.error('Session save error:', err));
    console.log(`User logged in: ${email}`);
    res.json({ success: true, message: 'Login successful' });
  } catch (err) {
    console.error('Login error for', email, ':', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/profile', isAuthenticated, async (req, res) => {
  const userEmail = req.session.user.email;
  try {
    const [rows] = await pool.execute('SELECT username, email, country, phone, profile_image FROM users WHERE email = ?', [userEmail]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching profile for', userEmail, ':', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/update-profile', isAuthenticated, upload.single('profile_image'), async (req, res) => {
  const userEmail = req.session.user.email;
  const { username, country, phone, password } = req.body;
  const profileImage = req.file ? `http://${host}:${port}/Uploads/${req.file.filename}` : null;

  try {
    if (username && !/^[A-Za-z\s]+$/.test(username)) {
      return res.status(400).json({ message: 'Username must contain only letters and spaces' });
    }
    if (phone && !/^[0-9]+$/.test(phone)) {
      return res.status(400).json({ message: 'Phone must contain only digits' });
    }
    if (password && (password.length < 8 || !/[A-Z]/.test(password) || !/[^A-Za-z0-9]/.test(password))) {
      return res.status(400).json({ message: 'Password must be at least 8 characters, contain one uppercase letter, and one special character' });
    }

    let hashedPassword = password;
    if (password) hashedPassword = await bcrypt.hash(password, 10);

    const updateFields = {};
    if (username) updateFields.username = username;
    if (country) updateFields.country = country;
    if (phone) updateFields.phone = phone;
    if (hashedPassword) updateFields.password = hashedPassword;
    if (profileImage) updateFields.profile_image = profileImage;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const updateSql = `UPDATE users SET ${Object.keys(updateFields).map(key => `${key} = ?`).join(', ')} WHERE email = ?`;
    const values = Object.values(updateFields).concat(userEmail);

    const [result] = await pool.execute(updateSql, values);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    console.log(`Profile updated for ${userEmail}`);
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile for', userEmail, ':', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    console.log('User logged out');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

app.post('/verify-email', async (req, res) => {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    console.error('Invalid email format:', email);
    return res.status(400).json({ message: 'Invalid email format' });
  }
  let retries = 3;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      const [rows] = await pool.execute('SELECT email FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        console.log(`Email not found: ${email}`);
        return res.status(404).json({ message: 'Email not found' });
      }
      console.log(`Email verified: ${email}`);
      return res.status(200).json({ success: true, message: 'Email verified' });
    } catch (error) {
      retries -= 1;
      console.error(`Error verifying email ${email} (attempt ${4 - retries}/3):`, error.message);
      if (retries === 0) {
        return res.status(500).json({ message: 'Server error: Unable to verify email', error: error.message });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});

app.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    console.error('Invalid email format:', email);
    return res.status(400).json({ message: 'Invalid email format' });
  }
  let retries = 3;
  while (retries > 0) {
    try {
      const otp = generateOTP();
      otpStore.set(email.toLowerCase(), { otp, expires: Date.now() + 300000 });
      await sendOTPEmail(email, otp);
      console.log(`OTP sent to ${email}: ${otp}`);
      return res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
      retries -= 1;
      console.error(`Send OTP error for ${email} (attempt ${4 - retries}/3):`, error.message);
      if (retries === 0) {
        return res.status(500).json({ message: 'Failed to send OTP', error: error.message });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});

app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    console.error('Missing email or otp:', { email, otp });
    return res.status(400).json({ message: 'Email and OTP are required' });
  }
  const storedOtp = otpStore.get(email.toLowerCase());
  if (!storedOtp) {
    console.error('No OTP found for', email);
    return res.status(400).json({ message: 'No OTP found or expired' });
  }
  if (storedOtp.expires < Date.now()) {
    otpStore.delete(email.toLowerCase());
    console.error('OTP expired for', email);
    return res.status(400).json({ message: 'OTP expired' });
  }
  if (storedOtp.otp !== otp) {
    console.error('Invalid OTP for', email, ': received', otp, ', expected', storedOtp.otp);
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  otpStore.delete(email.toLowerCase());
  console.log(`OTP verified for ${email}: ${otp}`);
  res.status(200).json({ message: 'OTP verified successfully' });
});

app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
    console.error('Invalid password for', email);
    return res.status(400).json({ message: 'Password must be at least 8 characters, contain one uppercase letter, and one special character' });
  }
  let retries = 3;
  while (retries > 0) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
      console.log(`Password reset for ${email}`);
      return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      retries -= 1;
      console.error(`Reset password error for ${email} (attempt ${4 - retries}/3):`, error.message);
      if (retries === 0) {
        return res.status(500).json({ message: 'Server error', error: error.message });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});

app.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [results] = await pool.execute('SELECT * FROM admins WHERE email = ?', [email]);
    if (results.length === 0) {
      console.error('Admin login error: No admin found for', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const admin = results[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      console.error('Admin login error: Invalid password for', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    req.session.admin = { email: admin.email };
    console.log(`Admin logged in: ${email}`);
    res.json({ success: true, message: 'Login successful' });
  } catch (err) {
    console.error('Admin login error for', email, ':', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/admin-verify-email', async (req, res) => {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    console.error('Invalid admin email format:', email);
    return res.status(400).json({ message: 'Invalid email format' });
  }
  try {
    const [rows] = await pool.execute('SELECT email FROM admins WHERE email = ?', [email]);
    if (rows.length === 0) {
      console.log(`Admin email not found: ${email}`);
      return res.status(404).json({ message: 'Email not found' });
    }
    console.log(`Admin email verified: ${email}`);
    res.status(200).json({ message: 'Email verified' });
  } catch (err) {
    console.error('Error verifying admin email:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/admin-send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    console.error('Invalid admin email format:', email);
    return res.status(400).json({ message: 'Invalid email format' });
  }
  let retries = 3;
  while (retries > 0) {
    try {
      const otp = generateOTP();
      otpStore.set(`admin_${email.toLowerCase()}`, { otp, expires: Date.now() + 300000 });
      await sendOTPEmail(email, otp);
      console.log(`Admin OTP sent to ${email}: ${otp}`);
      return res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
      retries -= 1;
      console.error(`Admin send OTP error for ${email} (attempt ${4 - retries}/3):`, error.message);
      if (retries === 0) {
        return res.status(500).json({ message: 'Failed to send OTP', error: error.message });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});

app.post('/admin-verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    console.error('Missing email or otp for admin:', { email, otp });
    return res.status(400).json({ message: 'Email and OTP are required' });
  }
  const storedOtp = otpStore.get(`admin_${email.toLowerCase()}`);
  if (!storedOtp) {
    console.error('No admin OTP found for', email);
    return res.status(400).json({ message: 'No OTP found or expired' });
  }
  if (storedOtp.expires < Date.now()) {
    otpStore.delete(`admin_${email.toLowerCase()}`);
    console.error('Admin OTP expired for', email);
    return res.status(400).json({ message: 'OTP expired' });
  }
  if (storedOtp.otp !== otp) {
    console.error('Invalid admin OTP for', email, ': received', otp, ', expected', storedOtp.otp);
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  otpStore.delete(`admin_${email.toLowerCase()}`);
  console.log(`Admin OTP verified for ${email}: ${otp}`);
  res.status(200).json({ message: 'OTP verified successfully' });
});

app.post('/admin-reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
    console.error('Invalid admin password for', email);
    return res.status(400).json({ message: 'Password must be at least 8 characters, contain one uppercase letter, and one special character' });
  }
  let retries = 3;
  while (retries > 0) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.execute('UPDATE admins SET password = ? WHERE email = ?', [hashedPassword, email]);
      console.log(`Admin password reset for ${email}`);
      return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      retries -= 1;
      console.error(`Admin reset password error for ${email} (attempt ${4 - retries}/3):`, error.message);
      if (retries === 0) {
        return res.status(500).json({ message: 'Server error', error: error.message });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});

app.get('/api/dashboard', isAdmin, dbConnect, async (req, res) => {
  try {
    const [users] = await req.db.query('SELECT COUNT(*) as totalUsers FROM users');
    const [admins] = await req.db.query('SELECT COUNT(*) as totalAdmins FROM admins');
    res.json({
      totalUsers: users[0].totalUsers,
      totalAdmins: admins[0].totalAdmins
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  } finally {
    req.db.release();
  }
});

app.get('/get-all-users', isAdmin, async (req, res) => {
  try {
    const [results] = await pool.execute('SELECT email, username, country, phone, profile_image FROM users');
    res.json(results);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/delete-user/:email', isAdmin, async (req, res) => {
  const email = req.params.email;
  try {
    const [result] = await pool.execute('DELETE FROM users WHERE email = ?', [email]);
    if (result.affectedRows === 0) {
      console.log(`User not found for deletion: ${email}`);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(`User deleted: ${email}`);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/add-user', isAdmin, async (req, res) => {
  const { email, username, country, phone, password, profileImage } = req.body;
  if (!/^[A-Za-z\s]+$/.test(username)) {
    console.error('Invalid username for add-user:', username);
    return res.status(400).json({ message: 'Username must contain only letters and spaces' });
  }
  if (password && (password.length < 8 || !/[A-Z]/.test(password) || !/[^A-Za-z0-9]/.test(password))) {
    return res.status(400).json({ message: 'Password must be at least 8 characters, contain one uppercase letter, and one special character' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      `INSERT INTO users (email, username, country, phone, password, profile_image) VALUES (?, ?, ?, ?, ?, ?)`,
      [email, username, country, phone, hashedPassword, profileImage]
    );
    console.log(`User added: ${email}`);
    res.status(201).json({ success: true, message: 'User added successfully' });
  } catch (err) {
    console.error('Add user error:', err);
    return res.status(500).json({ message: 'Failed to add user, email or phone may already exist' });
  }
});

app.put('/update-user/:email', isAdmin, async (req, res) => {
  const email = req.params.email;
  const { username, country, phone, password, profileImage } = req.body;
  if (username && !/^[A-Za-z\s]+$/.test(username)) {
    console.error('Invalid username for update-user:', username);
    return res.status(400).json({ message: 'Username must contain only letters and spaces' });
  }
  if (password && (password.length < 8 || !/[A-Z]/.test(password) || !/[^A-Za-z0-9]/.test(password))) {
    return res.status(400).json({ message: 'Password must be at least 8 characters, contain one uppercase letter, and one special character' });
  }
  try {
    let hashedPassword = password;
    if (password) hashedPassword = await bcrypt.hash(password, 10);

    const updateFields = {};
    if (username) updateFields.username = username;
    if (country) updateFields.country = country;
    if (phone) updateFields.phone = phone;
    if (hashedPassword) updateFields.password = hashedPassword;
    if (profileImage) updateFields.profile_image = profileImage;

    if (Object.keys(updateFields).length === 0) {
      console.log('No fields to update for', email);
      return res.status(400).json({ message: 'No fields to update' });
    }

    const updateSql = `UPDATE users SET ${Object.keys(updateFields).map(key => `${key} = ?`).join(', ')} WHERE email = ?`;
    const values = Object.values(updateFields).concat(email);
    const [result] = await pool.execute(updateSql, values);
    if (result.affectedRows === 0) {
      console.log(`User not found for update: ${email}`);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(`User updated: ${email}`);
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Update user error for', email, ':', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/notifications', isAdmin, dbConnect, async (req, res) => {
  const { sender_email, receiver_email, message } = req.body;
  try {
    if (!sender_email || !message) {
      console.error('Missing sender_email or message for notification');
      return res.status(400).json({ error: 'Sender email and message are required' });
    }
    const [result] = await req.db.query(
      'INSERT INTO notifications (sender_email, receiver_email, message) VALUES (?, ?, ?)',
      [sender_email, receiver_email || null, message]
    );
    console.log(`Notification sent from ${sender_email} to ${receiver_email || 'all'}`);
    res.status(201).json({ id: result.insertId, sender_email, receiver_email, message });
  } catch (err) {
    console.error('Error sending notification:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  } finally {
    req.db.release();
  }
});

app.get('/api/notifications/admin', isAdmin, dbConnect, async (req, res) => {
  try {
    const adminEmail = req.session.admin.email;
    const [notifications] = await req.db.query('SELECT * FROM notifications WHERE sender_email = ?', [adminEmail]);
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching admin notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  } finally {
    req.db.release();
  }
});

app.get('/api/notifications/user', isAuthenticated, dbConnect, async (req, res) => {
  const userEmail = req.session.user.email;
  try {
    const [notifications] = await req.db.query(
      'SELECT * FROM notifications WHERE receiver_email = ? OR receiver_email IS NULL',
      [userEmail]
    );
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching user notifications for', userEmail, ':', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  } finally {
    req.db.release();
  }
});

app.put('/api/notifications/:id/seen', isAuthenticated, dbConnect, async (req, res) => {
  const { id } = req.params;
  try {
    await req.db.query('UPDATE notifications SET is_seen = TRUE WHERE id = ?', [id]);
    console.log(`Notification ${id} marked as seen`);
    res.json({ message: 'Notification marked as seen' });
  } catch (err) {
    console.error('Error marking notification as seen:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  } finally {
    req.db.release();
  }
});

app.post('/api/feedback', isAuthenticated, dbConnect, async (req, res) => {
  const { user_email, notification_id, feedback } = req.body;
  try {
    if (!user_email || !notification_id || !feedback) {
      console.error('Missing fields for feedback:', { user_email, notification_id, feedback });
      return res.status(400).json({ error: 'All fields are required' });
    }
    const [result] = await req.db.query(
      'INSERT INTO feedback (user_email, notification_id, feedback) VALUES (?, ?, ?)',
      [user_email, notification_id, feedback]
    );
    console.log(`Feedback submitted by ${user_email} for notification ${notification_id}`);
    res.status(201).json({ id: result.insertId, user_email, notification_id, feedback });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  } finally {
    req.db.release();
  }
});

app.get('/api/feedback', isAdmin, dbConnect, async (req, res) => {
  let retries = 3;
  while (retries > 0) {
    try {
      const [feedback] = await req.db.query('SELECT * FROM feedback');
      res.json(feedback);
    } catch (err) {
      retries -= 1;
      console.error(`Error fetching feedback (attempt ${4 - retries}/3):`, err);
      if (retries === 0) {
        res.status(500).json({ error: 'Failed to fetch feedback' });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      req.db.release();
    }
  }
});

app.get('/api/notifications/last7days', async (req, res) => {
  try {
    const [results] = await pool.execute(
      'SELECT COUNT(*) AS count FROM notifications WHERE created_at >= NOW() - INTERVAL 7 DAY'
    );
    res.json({ count: results[0].count });
  } catch (err) {
    console.error('Error fetching notification stats:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/users/registered/last7days', async (req, res) => {
  try {
    const [results] = await pool.execute(
      'SELECT COUNT(*) AS count FROM users WHERE created_at >= NOW() - INTERVAL 7 DAY'
    );
    res.json({ count: results[0].count });
  } catch (err) {
    console.error('Error fetching user registration stats:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/users/area-stats', async (req, res) => {
  try {
    const [results] = await pool.execute(
      'SELECT country AS area, COUNT(*) AS count FROM users GROUP BY country ORDER BY count DESC LIMIT 4'
    );
    res.json(results);
  } catch (err) {
    console.error('Error fetching area stats:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/users/daily-registrations', async (req, res) => {
  try {
    const [results] = await pool.execute(
      'SELECT DATE(created_at) AS date, COUNT(*) AS count FROM users WHERE created_at >= NOW() - INTERVAL 7 DAY GROUP BY DATE(created_at) ORDER BY date ASC'
    );
    res.json(results);
  } catch (err) {
    console.error('Error fetching daily registrations:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/admins/notification-stats', async (req, res) => {
  try {
    const [results] = await pool.execute(
      'SELECT a.username, COUNT(n.id) AS count FROM admins a LEFT JOIN notifications n ON a.email = n.sender_email GROUP BY a.username'
    );
    res.json(results);
  } catch (err) {
    console.error('Error fetching admin notification stats:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/users/country-breakdown', async (req, res) => {
  try {
    const [results] = await pool.execute(
      'SELECT country, COUNT(*) AS count FROM users GROUP BY country LIMIT 5'
    );
    res.json(results);
  } catch (err) {
    console.error('Error fetching country breakdown:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/users/progress', async (req, res) => {
  try {
    const [results] = await pool.execute('SELECT COUNT(*) AS count FROM users');
    const totalUsers = results[0].count;
    const goal = 1000;
    res.json({ count: totalUsers, percentage: (totalUsers / goal) * 100 });
  } catch (err) {
    console.error('Error fetching user progress:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/email_testing', async (req, res) => {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) {
    console.log(`Invalid email format: ${email}`);
    return res.status(400).json({ message: 'Invalid email format' });
  }
  let retries = 3;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      const [rows] = await pool.execute('SELECT email FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        console.log(`Email not found: ${email}`);
        return res.status(404).json({ message: 'Email not found' });
      }
      console.log(`Email verified: ${email}`);
      return res.status(200).json({ success: true, message: 'Email exists' });
    } catch (error) {
      retries -= 1;
      console.error(`Error testing email ${email} (attempt ${4 - retries}/3):`, error.message);
      if (retries === 0) {
        return res.status(500).json({ 
          message: 'Server error: Unable to test email after multiple attempts',
          error: error.message 
        });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});

app.post('/register-gym', async (req, res) => {
  const { email, game, exercises } = req.body;
  if (!email || !game || !exercises || !Array.isArray(exercises)) {
    console.log('Invalid request data');
    return res.status(400).json({ message: 'Email, game, and exercises are required' });
  }
  let retries = 3;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      const [rows] = await pool.execute('SELECT email FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        console.log(`Email not found: ${email}`);
        return res.status(404).json({ message: 'Email not found' });
      }
      const values = exercises.map((exercise) => [
        email,
        game,
        exercise.name,
        exercise.sets,
      ]);
      const sql = `INSERT INTO gym_registrations (email, game, exercise, sets) VALUES ?`;
      await pool.query(sql, [values]);
      console.log(`Gym registration saved for ${email}, game: ${game}`);
      return res.status(201).json({ success: true, message: 'Gym registration saved' });
    } catch (err) {
      retries -= 1;
      console.error(`Register gym error for ${email} (attempt ${4 - retries}/3):`, err.message);
      if (retries === 0) {
        return res.status(500).json({ message: 'Server error', error: err.message });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});

app.post('/register-tasks', async (req, res) => {
  const { email, game, tasks } = req.body;
  if (!email || !game || !tasks || tasks.length !== 6) {
    console.error('Invalid task registration data:', { email, game, tasks });
    return res.status(400).json({ success: false, message: 'Email, game, and exactly 6 tasks are required' });
  }
  let retries = 3;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      const [userRows] = await pool.execute('SELECT email FROM users WHERE email = ?', [email]);
      if (userRows.length === 0) {
        console.log(`User not found for task registration: ${email}`);
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const [existingTasks] = await pool.execute(
        'SELECT id FROM task_registrations WHERE email = ? AND game = ?',
        [email, game]
      );
      if (existingTasks.length > 0) {
        const query = `
          UPDATE task_registrations 
          SET task1 = ?, task2 = ?, task3 = ?, task4 = ?, task5 = ?, task6 = ?
          WHERE email = ? AND game = ?
        `;
        const values = [tasks[0], tasks[1], tasks[2], tasks[3], tasks[4], tasks[5], email, game];
        await pool.execute(query, values);
        console.log(`Tasks updated for ${email}, game: ${game}`);
        return res.json({ success: true, message: 'Tasks updated successfully' });
      } else {
        const query = `
          INSERT INTO task_registrations (email, game, task1, task2, task3, task4, task5, task6)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [email, game, tasks[0], tasks[1], tasks[2], tasks[3], tasks[4], tasks[5]];
        await pool.execute(query, values);
        console.log(`Tasks registered for ${email}, game: ${game}`);
        return res.json({ success: true, message: 'Tasks registered successfully' });
      }
    } catch (err) {
      retries -= 1;
      console.error(`Task registration error for ${email} (attempt ${4 - retries}/3):`, err.message);
      if (retries === 0) {
        return res.status(500).json({ success: false, message: 'Failed to save tasks', error: err.message });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});

app.post('/get-tasks', async (req, res) => {
  const { email, game } = req.body;
  if (!email || !game) {
    console.error('Missing email or game for get-tasks:', { email, game });
    return res.status(400).json({ success: false, message: 'Email and game are required' });
  }
  try {
    const [rows] = await pool.execute(
      'SELECT task1, task2, task3, task4, task5, task6 FROM task_registrations WHERE email = ? AND game = ?',
      [email, game]
    );
    if (rows.length === 0) {
      console.log(`No tasks found for ${email}, game: ${game}`);
      return res.status(404).json({ success: false, message: 'No tasks found for this user and game' });
    }
    const tasks = [
      rows[0].task1,
      rows[0].task2,
      rows[0].task3,
      rows[0].task4,
      rows[0].task5,
      rows[0].task6,
    ];
    res.json({ success: true, tasks });
  } catch (err) {
    console.error('Error fetching tasks for', email, ':', err);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks', error: err.message });
  }
});

app.post('/get_task_counts', async (req, res) => {
  const { email, game } = req.body;
  if (!email || !game) {
    console.error('Missing email or game for get_task_counts:', { email, game });
    return res.status(400).json({ success: false, message: 'Email and game are required' });
  }
  try {
    const [rows] = await pool.execute(
      'SELECT task_name, count FROM task_counts WHERE email = ? AND game = ?',
      [email, game]
    );
    if (rows.length === 0) {
      console.log(`No task counts found for ${email}, game: ${game}`);
      return res.status(200).json({ success: true, counts: [] });
    }
    res.json({ success: true, counts: rows });
  } catch (err) {
    console.error('Error fetching task counts for', email, ':', err);
    res.status(500).json({ success: false, message: 'Failed to fetch task counts', error: err.message });
  }
});

app.post('/update_task_count', async (req, res) => {
  const { email, game, task_name, count } = req.body;
  if (!email || !game || !task_name || count === undefined) {
    console.error('Missing fields for update_task_count:', { email, game, task_name, count });
    return res.status(400).json({ success: false, message: 'Email, game, task_name, and count are required' });
  }
  try {
    const [existing] = await pool.execute(
      'SELECT id FROM task_counts WHERE email = ? AND game = ? AND task_name = ?',
      [email, game, task_name]
    );
    if (existing.length > 0) {
      await pool.execute(
        'UPDATE task_counts SET count = ? WHERE email = ? AND game = ? AND task_name = ?',
        [count, email, game, task_name]
      );
    } else {
      await pool.execute(
        'INSERT INTO task_counts (email, game, task_name, count) VALUES (?, ?, ?, ?)',
        [email, game, task_name, count]
      );
    }
    console.log(`Task count updated for ${email}, game: ${game}, task: ${task_name}`);
    res.json({ success: true, message: 'Task count updated successfully' });
  } catch (err) {
    console.error('Error updating task count for', email, ':', err);
    res.status(500).json({ success: false, message: 'Failed to update task count', error: err.message });
  }
});

app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});