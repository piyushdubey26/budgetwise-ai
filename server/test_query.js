import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { User, Wallet, Transaction } from './models/models.js';

dotenv.config();

async function run() {
  await connectDB();
  const userId = 'f4hfa6agq';
  console.log('Testing Mongoose queries for userId:', userId);
  
  const wallets = await Wallet.find({ userId });
  console.log('Wallets count via Mongoose:', wallets.length);
  wallets.forEach(w => console.log('  - Mongoose wallet:', w.name, w.balance));

  const transactions = await Transaction.find({ userId });
  console.log('Transactions count via Mongoose:', transactions.length);
  transactions.forEach(t => console.log('  - Mongoose transaction:', t.title, t.amount));

  mongoose.connection.close();
}
run();
