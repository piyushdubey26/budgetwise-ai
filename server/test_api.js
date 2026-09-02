import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { getDashboardSummary } from './controllers/financeController.js';

dotenv.config();

async function run() {
  await connectDB();
  
  // Mock req and res
  const req = {
    user: { id: 'f4hfa6agq' }
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

  console.log('Simulating getDashboardSummary for f4hfa6agq...');
  await getDashboardSummary(req, res);

  mongoose.connection.close();
}
run();
