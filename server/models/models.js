import { defineModel } from '../config/db.js';

export const User = defineModel('User', {
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' }, // user, admin
  status: { type: String, default: 'active' }, // active, suspended
  phone: String,
  country: { type: String, default: 'India' },
  lastLogin: String,
  otp: String,
  otpExpires: Date,
  is2FAEnabled: { type: Boolean, default: false },
  twoFASecret: String,
  isPremium: { type: Boolean, default: false },
  premiumExpires: Date,
  // Gamification
  level: { type: Number, default: 1 },
  coins: { type: Number, default: 0 },
  xp: { type: Number, default: 0 }
});

export const Wallet = defineModel('Wallet', {
  userId: { type: String, required: true },
  name: { type: String, required: true }, 
  type: { type: String, required: true }, // cash, bank, credit_card, e_wallet
  balance: { type: Number, default: 0 }
});

export const Transaction = defineModel('Transaction', {
  userId: { type: String, required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true }, // income, expense, transfer
  category: String, 
  date: { type: String, required: true }, // YYYY-MM-DD
  time: String,
  location: String,
  paymentMode: String, // cash, bank, upi, credit_card
  receiptImage: String,
  notes: String,
  tags: [String],
  sourceWalletId: String, 
  targetWalletId: String, 
  isRecurring: { type: Boolean, default: false },
  recurringId: String
});

export const Budget = defineModel('Budget', {
  userId: { type: String, required: true },
  month: { type: String, required: true }, // YYYY-MM
  category: { type: String, default: 'All' }, 
  amount: { type: Number, required: true },
  spent: { type: Number, default: 0 }
});

export const Goal = defineModel('Goal', {
  userId: { type: String, required: true },
  name: { type: String, required: true }, 
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  category: String,
  dueDate: String, 
  status: { type: String, default: 'active' } // active, completed
});

export const Subscription = defineModel('Subscription', {
  userId: { type: String, required: true },
  name: { type: String, required: true }, 
  amount: { type: Number, required: true },
  frequency: { type: String, default: 'monthly' }, 
  nextBillingDate: { type: String, required: true }, // YYYY-MM-DD
  category: { type: String, default: 'Entertainment' },
  active: { type: Boolean, default: true }
});

export const Bill = defineModel('Bill', {
  userId: { type: String, required: true },
  title: { type: String, required: true }, 
  amount: { type: Number, required: true },
  dueDate: { type: String, required: true }, // YYYY-MM-DD
  category: String,
  paid: { type: Boolean, default: false }
});

export const Investment = defineModel('Investment', {
  userId: { type: String, required: true },
  name: { type: String, required: true }, 
  type: { type: String, required: true }, // FD, Mutual Fund, Stocks, Crypto, Gold, PPF
  investedAmount: { type: Number, required: true },
  currentValue: { type: Number, required: true },
  quantity: { type: Number, default: 0 }
});

export const Debt = defineModel('Debt', {
  userId: { type: String, required: true },
  personName: { type: String, required: true },
  type: { type: String, required: true }, // borrow, lend
  amount: { type: Number, required: true },
  dueDate: String,
  interestRate: { type: Number, default: 0 },
  status: { type: String, default: 'pending' } 
});

export const Emi = defineModel('Emi', {
  userId: { type: String, required: true },
  name: { type: String, required: true }, 
  totalAmount: { type: Number, required: true },
  monthlyPayment: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  interestRate: { type: Number, default: 0 },
  dueDate: { type: String, required: true }, // 1-31
  walletId: String
});

export const Notification = defineModel('Notification', {
  userId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info' }, // budget, bill, goal, emi, system
  read: { type: Boolean, default: false },
  date: { type: String, default: () => new Date().toISOString() }
});

export const Setting = defineModel('Setting', {
  userId: { type: String, required: true },
  currency: { type: String, default: 'INR' }, 
  theme: { type: String, default: 'dark' },
  language: { type: String, default: 'en' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  notificationsEnabled: { type: Boolean, default: true }
});

// ==========================================
// ADMIN MODULE COLLECTIONS
// ==========================================

export const Category = defineModel('Category', {
  name: { type: String, required: true, unique: true },
  color: { type: String, default: '#7c3aed' },
  icon: { type: String, default: 'Tag' }
});

export const Payment = defineModel('Payment', {
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentId: { type: String, required: true }, // Razorpay payment id
  status: { type: String, default: 'captured' },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] }
});

export const Feedback = defineModel('Feedback', {
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  reply: String,
  date: { type: String, default: () => new Date().toISOString().split('T')[0] }
});

export const AdminLog = defineModel('AdminLog', {
  adminId: { type: String, required: true },
  action: { type: String, required: true }, // suspend, make_premium, delete_user, etc.
  targetUser: String, // email or id of affected user
  timestamp: { type: String, default: () => new Date().toISOString() },
  ip: String
});
