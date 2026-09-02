import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { broadcastNotification } from './controllers/adminController.js';

dotenv.config();

async function run() {
  await connectDB();
  
  // Mock req and res
  const req = {
    user: { id: 'f4hfa6agq' },
    body: {
      title: 'control expenses',
      message: 'go through your data',
      type: 'system'
    }
  };
  
  const res = {
    status: (code) => {
      console.log('Response Status:', code);
      return res;
    },
    json: (data) => {
      console.log('Response Data:', JSON.stringify(data, null, 2));
      return res;
    }
  };

  console.log('Simulating broadcastNotification...');
  await broadcastNotification(req, res);

  mongoose.connection.close();
}
run();
