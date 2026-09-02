import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import * as models from './models/models.js';

dotenv.config();

async function check() {
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to MongoDB');
    process.exit(1);
  }

  for (const name of Object.keys(models)) {
    const ModelProxy = models[name];
    if (typeof ModelProxy.countDocuments === 'function') {
      try {
        await ModelProxy.find({}); // trigger registration
        const rawModel = mongoose.model(name);
        const collectionName = rawModel.collection.name;
        const collection = mongoose.connection.db.collection(collectionName);
        const count = await collection.countDocuments({});
        console.log(`Model ${name}: ${count} records in MongoDB.`);
        if (name === 'User') {
          const users = await collection.find({}).toArray();
          users.forEach(u => console.log(`  - User: ${u.name} (${u.email}), ID: ${u._id}, Role: ${u.role}`));
        }
        if (name === 'Wallet') {
          const wallets = await collection.find({}).toArray();
          wallets.forEach(w => console.log(`  - Wallet: ${w.name}, UserID: ${w.userId}, Balance: ${w.balance}`));
        }
      } catch (err) {
        console.error(`Error querying ${name}:`, err.message);
      }
    }
  }

  mongoose.connection.close();
}

check();
