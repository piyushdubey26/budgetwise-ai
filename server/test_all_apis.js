import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { getDashboardSummary } from './controllers/financeController.js';
import { User, Wallet, Transaction, Budget, Goal, Investment, Debt, Emi, Bill, Subscription, Notification } from './models/models.js';

dotenv.config();

async function run() {
  await connectDB();
  const userId = 'f4hfa6agq';
  console.log('Testing all endpoints for userId:', userId);

  const endpoints = [
    { name: 'User', model: User, query: { _id: userId } },
    { name: 'Wallet', model: Wallet, query: { userId } },
    { name: 'Transaction', model: Transaction, query: { userId } },
    { name: 'Budget', model: Budget, query: { userId } },
    { name: 'Goal', model: Goal, query: { userId } },
    { name: 'Investment', model: Investment, query: { userId } },
    { name: 'Debt', model: Debt, query: { userId } },
    { name: 'Emi', model: Emi, query: { userId } },
    { name: 'Bill', model: Bill, query: { userId } },
    { name: 'Subscription', model: Subscription, query: { userId } },
    { name: 'Notification', model: Notification, query: { userId } }
  ];

  for (const ep of endpoints) {
    try {
      const results = await ep.model.find(ep.query);
      console.log(`- ${ep.name} query succeeded. Found: ${Array.isArray(results) ? results.length : '1'} records.`);
    } catch (err) {
      console.error(`- ${ep.name} query FAILED:`, err.message);
    }
  }

  mongoose.connection.close();
}
run();
