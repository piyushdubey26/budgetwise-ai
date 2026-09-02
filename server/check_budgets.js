import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { Budget, Transaction } from './models/models.js';

dotenv.config();

async function run() {
  await connectDB();
  const userId = 'f4hfa6agq';
  
  const budgets = await Budget.find({ userId });
  console.log('Budgets in DB:');
  budgets.forEach(b => console.log(`  - Category: ${b.category}, Limit: ${b.amount}, Spent: ${b.spent}, Month: ${b.month}`));

  const expenses = await Transaction.find({ userId, type: 'expense' });
  console.log('Expenses in DB:');
  expenses.forEach(e => console.log(`  - Title: ${e.title}, Category: ${e.category}, Amount: ${e.amount}, Wallet: ${e.paymentMode}`));

  mongoose.connection.close();
}
run();
