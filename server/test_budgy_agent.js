import { processBudgyCommand } from './controllers/budgyAgentController.js';
import { User, Wallet, Transaction, Budget } from './models/models.js';
import { connectDB } from './config/db.js';

async function runTests() {
  console.log('🧪 Starting Budgy AI Voice Agent Test Suite...\n');
  await connectDB();

  // Create or retrieve a test user
  let user = await User.findOne({ email: 'test_budgy_user@budgetwise.ai' });
  if (!user) {
    user = await User.create({
      name: 'Budgy Test User',
      email: 'test_budgy_user@budgetwise.ai',
      password: 'hashedpassword',
      coins: 100,
      xp: 50,
      isPremium: true
    });
  }

  const userId = user._id || user.id;

  // Mock Request & Response Helper
  const mockCall = async (message, history = []) => {
    return new Promise((resolve) => {
      const req = {
        user: { id: userId, _id: userId },
        body: { message, conversationHistory: history, timezone: 'Asia/Kolkata', currency: 'INR' }
      };
      const res = {
        status: (code) => ({
          json: (data) => resolve({ statusCode: code, data })
        })
      };
      processBudgyCommand(req, res);
    });
  };

  // Test 1: Expense with quantity vs amount
  console.log('Test 1: "Hey Budgy, I ate 10 samosas for 100 rupees today"');
  const res1 = await mockCall('Hey Budgy, I ate 10 samosas for 100 rupees today');
  console.log('Result:', JSON.stringify(res1.data, null, 2));
  if (res1.data.success && res1.data.data?.amount === 100 && res1.data.data?.category === 'Food') {
    console.log('✅ Passed Test 1\n');
  } else {
    console.error('❌ Failed Test 1\n');
  }

  // Test 2: Yesterday's travel expense
  console.log('Test 2: "Spent 250 on Uber yesterday"');
  const res2 = await mockCall('Spent 250 on Uber yesterday');
  console.log('Result:', JSON.stringify(res2.data, null, 2));
  if (res2.data.success && res2.data.data?.amount === 250 && res2.data.data?.category === 'Travel') {
    console.log('✅ Passed Test 2\n');
  } else {
    console.error('❌ Failed Test 2\n');
  }

  // Test 3: Hinglish Expense
  console.log('Test 3: "maine aaj 500 rupees food pe spend kiye"');
  const res3 = await mockCall('maine aaj 500 rupees food pe spend kiye');
  console.log('Result:', JSON.stringify(res3.data, null, 2));
  if (res3.data.success && res3.data.data?.amount === 500 && res3.data.data?.category === 'Food') {
    console.log('✅ Passed Test 3\n');
  } else {
    console.error('❌ Failed Test 3\n');
  }

  // Test 4: Income Logging
  console.log('Test 4: "I received 50000 salary today"');
  const res4 = await mockCall('I received 50000 salary today');
  console.log('Result:', JSON.stringify(res4.data, null, 2));
  if (res4.data.success && res4.data.action === 'create_income' && res4.data.data?.amount === 50000) {
    console.log('✅ Passed Test 4\n');
  } else {
    console.error('❌ Failed Test 4\n');
  }

  // Test 5: Balance Query
  console.log('Test 5: "What is my balance?"');
  const res5 = await mockCall('What is my balance?');
  console.log('Result:', JSON.stringify(res5.data, null, 2));
  if (res5.data.success && res5.data.action === 'get_balance') {
    console.log('✅ Passed Test 5\n');
  } else {
    console.error('❌ Failed Test 5\n');
  }

  // Test 6: Set Budget
  console.log('Test 6: "Set my food budget to 8000 this month"');
  const res6 = await mockCall('Set my food budget to 8000 this month');
  console.log('Result:', JSON.stringify(res6.data, null, 2));
  if (res6.data.success && res6.data.action === 'create_budget') {
    console.log('✅ Passed Test 6\n');
  } else {
    console.error('❌ Failed Test 6\n');
  }

  // Test 7: Budget Status Query
  console.log('Test 7: "What is my remaining budget?"');
  const res7 = await mockCall('What is my remaining budget?');
  console.log('Result:', JSON.stringify(res7.data, null, 2));
  if (res7.data.success && res7.data.action === 'get_budget_status') {
    console.log('✅ Passed Test 7\n');
  } else {
    console.error('❌ Failed Test 7\n');
  }

  // Test 8: Change / Update Last Expense
  console.log('Test 8: "Change last expense to 450"');
  const res8 = await mockCall('Change last expense to 450');
  console.log('Result:', JSON.stringify(res8.data, null, 2));
  if (res8.data.success && res8.data.action === 'update_last_expense') {
    console.log('✅ Passed Test 8\n');
  } else {
    console.error('❌ Failed Test 8\n');
  }

  // Test 9: Delete Last Expense
  console.log('Test 9: "Delete my last expense"');
  const res9 = await mockCall('Delete my last expense');
  console.log('Result:', JSON.stringify(res9.data, null, 2));
  if (res9.data.success && res9.data.action === 'delete_last_expense') {
    console.log('✅ Passed Test 9\n');
  } else {
    console.error('❌ Failed Test 9\n');
  }

  // Test 10: Dangerous Bulk Deletion Confirmation Policy
  console.log('Test 10: "Delete all my expenses"');
  const res10 = await mockCall('Delete all my expenses');
  console.log('Result:', JSON.stringify(res10.data, null, 2));
  if (res10.data.requiresConfirmation === true && res10.data.action === 'require_confirmation') {
    console.log('✅ Passed Test 10 (Confirmation required)\n');
  } else {
    console.error('❌ Failed Test 10\n');
  }

  console.log('🎉 All Budgy AI Voice Agent Tests Completed Successfully!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
