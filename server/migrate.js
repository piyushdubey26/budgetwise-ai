import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import * as models from './models/models.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data');

const migrationMap = [
  { file: 'user.json', name: 'User' },
  { file: 'wallet.json', name: 'Wallet' },
  { file: 'transaction.json', name: 'Transaction' },
  { file: 'budget.json', name: 'Budget' },
  { file: 'goal.json', name: 'Goal' },
  { file: 'subscription.json', name: 'Subscription' },
  { file: 'bill.json', name: 'Bill' },
  { file: 'investment.json', name: 'Investment' },
  { file: 'debt.json', name: 'Debt' },
  { file: 'emi.json', name: 'Emi' },
  { file: 'notification.json', name: 'Notification' },
  { file: 'setting.json', name: 'Setting' },
  { file: 'category.json', name: 'Category' },
  { file: 'payment.json', name: 'Payment' },
  { file: 'feedback.json', name: 'Feedback' },
  { file: 'adminlog.json', name: 'AdminLog' }
];

async function runMigration() {
  console.log('Starting migration from local JSON files to MongoDB Atlas...');
  
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to MongoDB. Migration aborted.');
    process.exit(1);
  }

  for (const item of migrationMap) {
    const filePath = path.join(DATA_DIR, item.file);
    if (!fs.existsSync(filePath)) {
      console.log(`File ${item.file} not found. Skipping.`);
      continue;
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      if (!Array.isArray(data) || data.length === 0) {
        console.log(`File ${item.file} is empty or not an array. Skipping.`);
        continue;
      }

      console.log(`Migrating ${data.length} records for model ${item.name}...`);
      const ModelProxy = models[item.name];
      // Trigger lazy schema definition now that MongoDB is connected
      await ModelProxy.find({});

      const RawMongooseModel = mongoose.model(item.name);
      const collectionName = RawMongooseModel.collection.name;
      const collection = mongoose.connection.db.collection(collectionName);
      
      // Clear existing records in MongoDB using raw MongoDB driver to ensure a clean sync
      await collection.deleteMany({});
      
      // Insert new records directly via raw MongoDB driver to preserve string _ids
      await collection.insertMany(data);
      console.log(`Successfully migrated ${item.name}!`);
    } catch (err) {
      console.error(`Error migrating ${item.name}:`, err.message);
    }
  }

  console.log('Migration completed successfully!');
  mongoose.connection.close();
  process.exit(0);
}

runMigration();
