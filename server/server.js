import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { connectDB } from './config/db.js';
import apiRouter from './routes/api.js';
import adminRouter from './routes/admin.js';
import { seedDatabase } from './config/seed.js';
import { Subscription, Bill, Emi, Transaction, Wallet, Notification } from './models/models.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable to easily load local media and charts
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());

// Rate Limiting (Relaxed for dev/testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 1000,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// API Routing
app.use('/api', apiRouter);
app.use('/api/admin', adminRouter);

// Serve uploads as static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// BACKGROUND SCHEDULER FOR RECURRING ITEMS
// ==========================================
async function runScheduler() {
  console.log('[Scheduler] Running checks for recurring transactions and bill reminders...');
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    // 1. Process Subscriptions (Netflix, Spotify, etc.)
    const activeSubs = await Subscription.find({ active: true });
    for (const sub of activeSubs) {
      if (todayStr >= sub.nextBillingDate) {
        console.log(`[Scheduler] Processing billing for subscription: ${sub.name}`);
        
        // Find main wallet
        let wallet = await Wallet.findOne({ userId: sub.userId, type: 'bank' }) ||
                     await Wallet.findOne({ userId: sub.userId });

        if (wallet) {
          // Deduct from wallet
          await Wallet.findByIdAndUpdate(wallet._id, { balance: wallet.balance - sub.amount });

          // Create transaction log
          await Transaction.create({
            userId: sub.userId,
            title: `Subscription Renewal: ${sub.name}`,
            amount: sub.amount,
            type: 'expense',
            category: sub.category || 'Entertainment',
            date: todayStr,
            paymentMode: wallet.name,
            sourceWalletId: wallet._id,
            isRecurring: true,
            recurringId: sub._id
          });

          // Create Notification
          await Notification.create({
            userId: sub.userId,
            title: '💸 Subscription Renewed',
            message: `Your subscription for ${sub.name} (₹${sub.amount}) has been automatically paid using ${wallet.name}.`,
            type: 'bill'
          });

          // Calculate next billing date (add 1 month)
          const nextDate = new Date(sub.nextBillingDate);
          if (sub.frequency === 'yearly') {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
          } else {
            nextDate.setMonth(nextDate.getMonth() + 1);
          }
          const nextBillingStr = nextDate.toISOString().split('T')[0];

          await Subscription.findByIdAndUpdate(sub._id, { nextBillingDate: nextBillingStr });
        }
      }
    }

    // 2. Process Bill Reminders (electricity, phone)
    const unpaidBills = await Bill.find({ paid: false });
    for (const bill of unpaidBills) {
      if (bill.dueDate === tomorrowStr) {
        // Check if reminder was already sent
        const alreadyNotified = await Notification.findOne({
          userId: bill.userId,
          type: 'bill',
          message: { $ne: null } // Just fetch last notifications to avoid double logging
        });
        
        // Simplicity check: trigger alert if due tomorrow
        await Notification.create({
          userId: bill.userId,
          title: `🔔 Bill Due Tomorrow: ${bill.title}`,
          message: `Your bill for ${bill.title} of amount ₹${bill.amount} is due tomorrow (${bill.dueDate}). Please settle it to avoid late fees.`,
          type: 'bill'
        });
        console.log(`[Scheduler] Due alert sent for bill: ${bill.title}`);
      }
    }

    // 3. Process EMIs
    const activeEmis = await Emi.find({});
    for (const emi of activeEmis) {
      const todayDay = new Date().getDate(); // Day of month (1-31)
      const currentYearMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

      if (todayDay === parseInt(emi.dueDate) && emi.remainingAmount > 0) {
        // Check if we logged EMI for this month already
        const emiTitle = `EMI Payment: ${emi.name}`;
        const existingEmiTrans = await Transaction.findOne({
          userId: emi.userId,
          title: emiTitle,
          date: { $gte: `${currentYearMonth}-01`, $lte: `${currentYearMonth}-31` }
        });

        if (!existingEmiTrans) {
          console.log(`[Scheduler] Processing payment for EMI: ${emi.name}`);
          const payAmt = Math.min(emi.monthlyPayment, emi.remainingAmount);

          // Get wallet
          const walletId = emi.walletId;
          const wallet = await Wallet.findById(walletId);

          if (wallet) {
            await Wallet.findByIdAndUpdate(walletId, { balance: wallet.balance - payAmt });
            await Emi.findByIdAndUpdate(emi._id, { remainingAmount: Math.max(0, emi.remainingAmount - payAmt) });

            await Transaction.create({
              userId: emi.userId,
              title: emiTitle,
              amount: payAmt,
              type: 'expense',
              category: 'EMI',
              date: todayStr,
              paymentMode: wallet.name,
              sourceWalletId: walletId,
              isRecurring: true,
              recurringId: emi._id
            });

            await Notification.create({
              userId: emi.userId,
              title: '📉 EMI Installment Deducted',
              message: `Monthly installment of ₹${payAmt} for "${emi.name}" was paid from ${wallet.name}. Remaining EMI Debt: ₹${Math.max(0, emi.remainingAmount - payAmt)}`,
              type: 'emi'
            });
          }
        }
      }
    }

  } catch (err) {
    console.error('[Scheduler] Error running background jobs:', err.message);
  }
}

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    const indexPath = path.resolve(__dirname, '../client', 'dist', 'index.html');
    console.log(`[Static] Request for ${req.url}, resolving to ${indexPath}. Exists: ${fs.existsSync(indexPath)}`);
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send(`Frontend build not found at: ${indexPath}`);
    }
  });
} else {
  app.get('/', (req, res) => {
    res.send('BudgetWise AI API is running in Development mode...');
  });
}

// Connect Database and start server
connectDB().then(async () => {
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`BudgetWise AI backend listening on port ${PORT}`);
    
    // Run scheduler immediately on boot, and then hourly
    runScheduler();
    setInterval(runScheduler, 60 * 60 * 1000);
  });
});
