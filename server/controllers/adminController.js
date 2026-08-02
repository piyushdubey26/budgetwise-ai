import { 
  User, 
  Transaction, 
  Wallet, 
  Budget, 
  Goal, 
  Subscription, 
  Bill, 
  Investment, 
  Debt, 
  Emi, 
  Notification, 
  Setting,
  Category,
  Payment,
  Feedback,
  AdminLog
} from '../models/models.js';

// Helper to log admin actions
const logAdminAction = async (adminId, action, targetUser, ip = '127.0.0.1') => {
  try {
    await AdminLog.create({ adminId, action, targetUser, ip });
  } catch (err) {
    console.error('Failed to log admin action:', err.message);
  }
};

// ==========================================
// DASHBOARD OVERVIEW METRICS
// ==========================================
export const getDashboardMetrics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ status: 'active' });
    const premiumUsers = await User.countDocuments({ isPremium: true });

    const transactions = await Transaction.find({});
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const flaggedCount = transactions.filter(t => t.amount >= 100000).length;

    const payments = await Payment.find({});
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    const feedbacks = await Feedback.find({});
    const avgRating = feedbacks.length > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length 
      : 5.0;

    res.status(200).json({
      totalUsers,
      activeUsers,
      totalIncome,
      totalExpense,
      premiumUsers,
      totalRevenue,
      flaggedTransactions: flaggedCount,
      averageRating: avgRating.toFixed(1)
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving metrics.', error: err.message });
  }
};

// ==========================================
// USER MANAGEMENT
// ==========================================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    // Remove passwords before sending down
    const sanitized = users.map(u => {
      const { password, ...rest } = u;
      return rest;
    });
    res.status(200).json(sanitized);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users.', error: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isPremium, phone, country, role } = req.body;
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    let updateData = {};
    if (status !== undefined) {
      updateData.status = status;
      await logAdminAction(req.user.id, `Toggle User Status to: ${status}`, user.email);
    }
    if (isPremium !== undefined) {
      updateData.isPremium = isPremium;
      updateData.premiumExpires = isPremium ? new Date(Date.now() + 365*24*60*60*1000).toISOString() : null;
      await logAdminAction(req.user.id, isPremium ? 'Grant Premium Plan' : 'Remove Premium Plan', user.email);
    }
    if (role !== undefined) {
      updateData.role = role;
      await logAdminAction(req.user.id, `Toggle User Role to: ${role}`, user.email);
    }
    if (phone !== undefined) updateData.phone = phone;
    if (country !== undefined) updateData.country = country;

    const updated = await User.findByIdAndUpdate(id, updateData);
    res.status(200).json({ message: 'User updated successfully.', user: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user.', error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Wipes all user child resources recursively
    await Promise.all([
      User.findByIdAndDelete(id),
      Wallet.deleteOne({ userId: id }),
      Transaction.deleteOne({ userId: id }),
      Budget.deleteOne({ userId: id }),
      Goal.deleteOne({ userId: id }),
      Subscription.deleteOne({ userId: id }),
      Bill.deleteOne({ userId: id }),
      Investment.deleteOne({ userId: id }),
      Debt.deleteOne({ userId: id }),
      Emi.deleteOne({ userId: id }),
      Notification.deleteOne({ userId: id }),
      Setting.deleteOne({ userId: id })
    ]);

    await logAdminAction(req.user.id, 'Permanently Delete User & Sub-data', user.email);

    res.status(200).json({ message: 'User wiped successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user.', error: err.message });
  }
};

// ==========================================
// TRANSACTIONS WATCHER
// ==========================================
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({});
    // Hydrate transactions with user email/name details
    const users = await User.find({});
    const userMap = {};
    users.forEach(u => {
      userMap[u._id] = { name: u.name, email: u.email };
    });

    const populated = transactions.map(t => ({
      ...t,
      user: userMap[t.userId] || { name: 'Unknown', email: 'deleted@user.com' }
    }));

    // Sort by date descending
    populated.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving system transactions.', error: err.message });
  }
};

// ==========================================
// SYSTEM ALERTS BROADCASTER
// ==========================================
export const broadcastNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required.' });
    }

    const allUsers = await User.find({ role: 'user' });
    
    // Create notifications for all users
    for (const u of allUsers) {
      await Notification.create({
        userId: u._id,
        title,
        message,
        type: type || 'system'
      });
    }

    await logAdminAction(req.user.id, `Broadcast Notification: ${title}`, 'All Users');

    res.status(201).json({ message: `Alert successfully broadcasted to ${allUsers.length} active users.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to broadcast alert.', error: err.message });
  }
};

// ==========================================
// CATEGORIES CONTROLLERS
// ==========================================
export const addCategory = async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required.' });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Category already exists.' });

    const newCat = await Category.create({ name, color, icon });
    res.status(201).json(newCat);
  } catch (err) {
    res.status(500).json({ message: 'Error creating category.', error: err.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: 'Category deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting category.', error: err.message });
  }
};

// ==========================================
// FEEDBACK REPLIES
// ==========================================
export const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({});
    res.status(200).json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews.', error: err.message });
  }
};

export const replyFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    if (!reply) return res.status(400).json({ message: 'Reply comment is required.' });

    const updated = await Feedback.findByIdAndUpdate(id, { reply });
    res.status(200).json({ message: 'Reply posted successfully.', feedback: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to post reply.', error: err.message });
  }
};

// ==========================================
// RAZORPAY / REVENUE ANALYTICS
// ==========================================
export const getRevenueDetails = async (req, res) => {
  try {
    const payments = await Payment.find({});
    const todayStr = new Date().toISOString().split('T')[0];
    const thisMonthStr = new Date().toISOString().substring(0, 7);
    const thisYearStr = new Date().getFullYear().toString();

    const todayRev = payments.filter(p => p.date === todayStr).reduce((sum, p) => sum + p.amount, 0);
    const monthRev = payments.filter(p => p.date.substring(0, 7) === thisMonthStr).reduce((sum, p) => sum + p.amount, 0);
    const yearRev = payments.filter(p => p.date.substring(0, 4) === thisYearStr).reduce((sum, p) => sum + p.amount, 0);
    const totalRev = payments.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      todayRevenue: todayRev,
      monthlyRevenue: monthRev,
      yearlyRevenue: yearRev,
      totalEarnings: totalRev,
      paymentsLog: payments
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving revenue.', error: err.message });
  }
};

// ==========================================
// SYSTEM AUDIT & MONITORING LOGS (Mocks for local workspace)
// ==========================================
export const getAdminLogs = async (req, res) => {
  try {
    const logs = await AdminLog.find({});
    // Sort by timestamp desc
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching logs.', error: err.message });
  }
};

export const getSystemTelemetry = async (req, res) => {
  try {
    // Generate mock system monitoring details
    res.status(200).json({
      aiMonitoring: {
        totalRequests: 1422,
        mostUsedPrompt: 'Analyze my expenses & find unnecessary spendings',
        averageResponseTime: '820ms',
        geminiApiErrors: 3
      },
      securityDashboard: {
        failedLoginCount: 42,
        blockedIpsCount: 2,
        unusualLoginAttempts: [
          { ip: '194.22.181.9', date: '2026-07-28', reason: 'Repeated wrong password' }
        ]
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving telemetry.', error: err.message });
  }
};
