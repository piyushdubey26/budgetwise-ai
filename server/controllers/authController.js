import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Setting, Wallet } from '../models/models.js';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_budget_key_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_super_secret_budget_key_54321';

// Configure Nodemailer mock transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: process.env.EMAIL_USER || 'mock@budgetwise.ai',
    pass: process.env.EMAIL_PASS || 'mockpassword',
  },
});

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    // Create default setting
    await Setting.create({ userId: newUser._id });

    // Create default wallets
    await Wallet.create({ userId: newUser._id, name: 'Cash Wallet', type: 'cash', balance: 0 });
    await Wallet.create({ userId: newUser._id, name: 'Main Bank Account', type: 'bank', balance: 0 });
    await Wallet.create({ userId: newUser._id, name: 'Credit Card', type: 'credit_card', balance: 0 });

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ id: newUser._id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Signup successful.',
      token,
      refreshToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        level: newUser.level,
        coins: newUser.coins,
        xp: newUser.xp,
        isPremium: newUser.isPremium,
        role: newUser.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.', error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const expiresIn = rememberMe ? '30d' : '1d';
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn });
    const refreshToken = jwt.sign({ id: user._id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    res.status(200).json({
      message: 'Login successful.',
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        level: user.level,
        coins: user.coins,
        xp: user.xp,
        isPremium: user.isPremium,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.', error: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await User.findByIdAndUpdate(user._id, { otp, otpExpires });

    // In local dev, we print the OTP to the console so the user can easily see it
    console.log(`[OTP Verification Code] For email: ${email} -> ${otp}`);

    res.status(200).json({
      message: 'OTP sent to your email (and logged in server console).',
      // For easy debug, we can also return OTP in response in dev mode
      otp: process.env.NODE_ENV === 'production' ? undefined : otp
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.', error: err.message });
  }
};

export const verifyOtpAndReset = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and new password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.otp || user.otp !== otp || new Date() > new Date(user.otpExpires)) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      otp: null,
      otpExpires: null
    });

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.', error: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const setting = await Setting.findOne({ userId: user._id }) || {};
    
    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        level: user.level,
        coins: user.coins,
        xp: user.xp,
        isPremium: user.isPremium,
        premiumExpires: user.premiumExpires,
        role: user.role,
      },
      settings: setting
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.', error: err.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { currency, theme, language, timezone, notificationsEnabled } = req.body;
    const userId = req.user.id;

    let setting = await Setting.findOne({ userId });
    if (!setting) {
      setting = await Setting.create({ userId });
    }

    const updated = await Setting.findByIdAndUpdate(setting._id, {
      currency,
      theme,
      language,
      timezone,
      notificationsEnabled
    });

    res.status(200).json({ message: 'Settings updated successfully.', settings: updated });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.', error: err.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { email, name, googleId } = req.body;
    if (!email || !name) {
      return res.status(400).json({ message: 'Email and name are required.' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Create user
      const mockPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: mockPassword
      });
      await Setting.create({ userId: user._id });
      await Wallet.create({ userId: user._id, name: 'Cash Wallet', type: 'cash', balance: 0 });
      await Wallet.create({ userId: user._id, name: 'Main Bank Account', type: 'bank', balance: 0 });
      await Wallet.create({ userId: user._id, name: 'Credit Card', type: 'credit_card', balance: 0 });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    const refreshToken = jwt.sign({ id: user._id }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

    res.status(200).json({
      message: 'Google login successful.',
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        level: user.level,
        coins: user.coins,
        xp: user.xp,
        isPremium: user.isPremium,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.', error: err.message });
  }
};

export const upgradeToPremium = async (req, res) => {
  try {
    const userId = req.user.id;
    // Mock successful premium upgrade (simulate Razorpay backend webhooks/verifications)
    const premiumExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    const user = await User.findByIdAndUpdate(userId, {
      isPremium: true,
      premiumExpires,
      coins: (await User.findById(userId)).coins + 500 // Gamification bonus
    });

    res.status(200).json({
      message: 'Upgraded to premium plan successfully! Enjoy unlimited wallets, goals, and AI advisor.',
      user: {
        ...user,
        isPremium: true,
        premiumExpires
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.', error: err.message });
  }
};
