import bcrypt from 'bcryptjs';
import { User, Feedback, Payment, Category, Wallet } from '../models/models.js';

export async function seedDatabase() {
  try {
    // 1. Seed Admin Account
    const adminEmail = 'admin@budgetwise.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      console.log('[Seeding] Creating default admin account...');
      const hashedAdminPassword = await bcrypt.hash('adminpassword', 10);
      const admin = await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: hashedAdminPassword,
        role: 'admin',
        country: 'India',
        phone: '+919999999999'
      });
      console.log(`[Seeding] Admin pre-seeded: ${adminEmail} (password: adminpassword)`);
    }

    // 2. Seed a few Mock Users
    const mockUsersCount = await User.countDocuments({ role: 'user' });
    if (mockUsersCount === 0) {
      console.log('[Seeding] Pre-populating active users...');
      const userPwd = await bcrypt.hash('password123', 10);
      
      const u1 = await User.create({
        name: 'Piyush Dubey',
        email: 'piyush@gmail.com',
        password: userPwd,
        role: 'user',
        isPremium: true,
        premiumExpires: new Date(Date.now() + 300*24*60*60*1000).toISOString(),
        level: 3,
        coins: 450,
        xp: 280,
        country: 'India',
        phone: '+919876543210'
      });

      const u2 = await User.create({
        name: 'Aarav Sharma',
        email: 'aarav@gmail.com',
        password: userPwd,
        role: 'user',
        isPremium: false,
        level: 1,
        coins: 10,
        xp: 30,
        country: 'India'
      });

      // Create default wallets for them
      await Wallet.create({ userId: u1._id, name: 'Cash Wallet', type: 'cash', balance: 5200 });
      await Wallet.create({ userId: u1._id, name: 'Main Bank Account', type: 'bank', balance: 84000 });
      await Wallet.create({ userId: u2._id, name: 'Cash Wallet', type: 'cash', balance: 1200 });

      console.log('[Seeding] User accounts pre-seeded.');
    }

    // 3. Seed Mock Payments (Revenue Dashboard)
    const paymentsCount = await Payment.countDocuments({});
    if (paymentsCount === 0) {
      console.log('[Seeding] Pre-populating mock payments history...');
      const activeUsers = await User.find({ role: 'user' });
      if (activeUsers.length > 0) {
        await Payment.create({
          userId: activeUsers[0]._id,
          amount: 399,
          paymentId: 'pay_RPXy28491024',
          status: 'captured',
          date: new Date().toISOString().split('T')[0]
        });
        await Payment.create({
          userId: activeUsers[0]._id,
          amount: 399,
          paymentId: 'pay_RPXy94820138',
          status: 'captured',
          date: new Date(Date.now() - 5*24*60*60*1000).toISOString().split('T')[0]
        });
      }
    }

    // 4. Seed Mock Feedbacks
    const feedbacksCount = await Feedback.countDocuments({});
    if (feedbacksCount === 0) {
      console.log('[Seeding] Populating mock system feedback logs...');
      const activeUsers = await User.find({ role: 'user' });
      if (activeUsers.length > 0) {
        await Feedback.create({
          userId: activeUsers[0]._id,
          userName: activeUsers[0].name,
          rating: 5,
          comment: 'Gemini recommendations saved me ₹3000 this month! Absolutely loving this tracker.',
          date: new Date(Date.now() - 3*24*60*60*1000).toISOString().split('T')[0]
        });
        await Feedback.create({
          userId: activeUsers[0]._id,
          userName: activeUsers[0].name,
          rating: 4,
          comment: 'Can we add multi-currency transfers or joint accounts in the next major build?',
          date: new Date(Date.now() - 1*24*60*60*1000).toISOString().split('T')[0]
        });
      }
    }

  } catch (err) {
    console.error('[Seeding] Error pre-seeding database:', err.message);
  }
}
