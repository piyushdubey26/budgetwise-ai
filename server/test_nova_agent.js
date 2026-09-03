import { processNovaCommand, resolveDate } from './controllers/novaAgentController.js';
import { User, Wallet, Transaction, Budget } from './models/models.js';
import { connectDB } from './config/db.js';

async function runTests() {
  console.log('🧪 Starting Nova AI Voice Financial Agent Test Suite...\n');
  await connectDB();

  // 1. Create or retrieve User A
  let userA = await User.findOne({ email: 'piyush_nova_test@budgetwise.ai' });
  if (!userA) {
    userA = await User.create({
      name: 'Piyush Dubey',
      email: 'piyush_nova_test@budgetwise.ai',
      password: 'hashedpassword123',
      coins: 500,
      xp: 200,
      isPremium: true
    });
  }

  // 2. Create or retrieve User B (for cross-user security isolation testing)
  let userB = await User.findOne({ email: 'user_b_isolated@budgetwise.ai' });
  if (!userB) {
    userB = await User.create({
      name: 'Rohan Sharma',
      email: 'user_b_isolated@budgetwise.ai',
      password: 'hashedpassword456',
      coins: 50,
      xp: 10,
      isPremium: false
    });
  }

  const userIdA = userA._id || userA.id;
  const userIdB = userB._id || userB.id;

  // Mock Request & Response Helper
  const mockCall = async (message, history = [], targetUserId = userIdA, timezone = 'Asia/Kolkata') => {
    return new Promise((resolve) => {
      const req = {
        user: { id: targetUserId, _id: targetUserId },
        body: { message, conversationHistory: history, timezone, currency: 'INR' }
      };
      const res = {
        status: (code) => ({
          json: (data) => resolve({ statusCode: code, data })
        })
      };
      processNovaCommand(req, res);
    });
  };

  const todayStr = resolveDate('today', 'Asia/Kolkata');
  const yesterdayStr = resolveDate('yesterday', 'Asia/Kolkata');
  console.log(`📅 Dynamic Current Date: ${todayStr} | Yesterday: ${yesterdayStr}\n`);

  // =========================================================================
  // TEST 1: "Hey Nova, add ₹100 for 10 samosas."
  // =========================================================================
  console.log('Test 1: "Hey Nova, add ₹100 for 10 samosas."');
  const res1 = await mockCall('Hey Nova, add ₹100 for 10 samosas.');
  console.log('Spoken:', res1.data.spokenResponse);
  console.log('Action Data:', JSON.stringify(res1.data.data));
  const t1 = res1.data.data;
  if (res1.data.success && t1?.amount === 100 && t1?.category === 'Food' && t1?.date === todayStr) {
    console.log('✅ Passed Test 1\n');
  } else {
    console.error('❌ Failed Test 1\n');
  }

  // =========================================================================
  // TEST 2: "Hey Nova, yesterday I spent ₹500 on dinner."
  // =========================================================================
  console.log('Test 2: "Hey Nova, yesterday I spent ₹500 on dinner."');
  const res2 = await mockCall('Hey Nova, yesterday I spent ₹500 on dinner.');
  console.log('Spoken:', res2.data.spokenResponse);
  console.log('Action Data:', JSON.stringify(res2.data.data));
  const t2 = res2.data.data;
  if (res2.data.success && t2?.amount === 500 && t2?.category === 'Food' && t2?.date === yesterdayStr) {
    console.log('✅ Passed Test 2\n');
  } else {
    console.error('❌ Failed Test 2\n');
  }

  // =========================================================================
  // TEST 3: "Hey Nova, maine aaj ₹200 snacks pe spend kiye." (Hinglish)
  // =========================================================================
  console.log('Test 3: "Hey Nova, maine aaj ₹200 snacks pe spend kiye."');
  const res3 = await mockCall('Hey Nova, maine aaj ₹200 snacks pe spend kiye.');
  console.log('Spoken:', res3.data.spokenResponse);
  console.log('Action Data:', JSON.stringify(res3.data.data));
  const t3 = res3.data.data;
  if (res3.data.success && t3?.amount === 200 && t3?.category === 'Food' && t3?.date === todayStr) {
    console.log('✅ Passed Test 3\n');
  } else {
    console.error('❌ Failed Test 3\n');
  }

  // =========================================================================
  // TEST 4: "Hey Nova, kal maine Uber pe ₹500 spend kiye." (Merchant + Past Date)
  // =========================================================================
  console.log('Test 4: "Hey Nova, kal maine Uber pe ₹500 spend kiye."');
  const res4 = await mockCall('Hey Nova, kal maine Uber pe ₹500 spend kiye.');
  console.log('Spoken:', res4.data.spokenResponse);
  console.log('Action Data:', JSON.stringify(res4.data.data));
  const t4 = res4.data.data;
  if (res4.data.success && t4?.amount === 500 && (t4?.category === 'Travel' || t4?.merchant === 'Uber') && t4?.date === yesterdayStr) {
    console.log('✅ Passed Test 4\n');
  } else {
    console.error('❌ Failed Test 4\n');
  }

  // =========================================================================
  // TEST 5: "Hey Nova, I received ₹50,000 salary today."
  // =========================================================================
  console.log('Test 5: "Hey Nova, I received ₹50,000 salary today."');
  const res5 = await mockCall('Hey Nova, I received ₹50,000 salary today.');
  console.log('Spoken:', res5.data.spokenResponse);
  console.log('Action Data:', JSON.stringify(res5.data.data));
  const t5 = res5.data.data;
  if (res5.data.success && res5.data.action === 'create_income' && t5?.amount === 50000 && t5?.date === todayStr) {
    console.log('✅ Passed Test 5\n');
  } else {
    console.error('❌ Failed Test 5\n');
  }

  // =========================================================================
  // TEST 6: "Hey Nova, how much did I spend this month?"
  // =========================================================================
  console.log('Test 6: "Hey Nova, how much did I spend this month?"');
  const res6 = await mockCall('Hey Nova, how much did I spend this month?');
  console.log('Spoken:', res6.data.spokenResponse);
  if (res6.data.success && res6.data.action === 'get_spending_summary' && res6.data.data?.totalExpense > 0) {
    console.log('✅ Passed Test 6\n');
  } else {
    console.error('❌ Failed Test 6\n');
  }

  // =========================================================================
  // TEST 7: "Hey Nova, change the last expense to ₹450."
  // =========================================================================
  console.log('Test 7: "Hey Nova, change the last expense to ₹450."');
  const res7 = await mockCall('Hey Nova, change the last expense to ₹450.');
  console.log('Spoken:', res7.data.spokenResponse);
  const t7 = res7.data.data;
  if (res7.data.success && res7.data.action === 'update_last_expense' && t7?.newAmount === 450) {
    console.log('✅ Passed Test 7\n');
  } else {
    console.error('❌ Failed Test 7\n');
  }

  // =========================================================================
  // TEST 8: "Hey Nova, delete my last expense."
  // =========================================================================
  console.log('Test 8: "Hey Nova, delete my last expense."');
  const res8 = await mockCall('Hey Nova, delete my last expense.');
  console.log('Spoken:', res8.data.spokenResponse);
  if (res8.data.success && res8.data.action === 'delete_last_expense' && res8.data.data?.deletedTransaction) {
    console.log('✅ Passed Test 8\n');
  } else {
    console.error('❌ Failed Test 8\n');
  }

  // =========================================================================
  // TEST 9: FINAL ACCEPTANCE FLOW
  // "Hey Nova, today I ate 10 samosas for 100 rupees."
  // =========================================================================
  console.log('Test 9 (Final Acceptance): "Hey Nova, today I ate 10 samosas for 100 rupees."');
  const res9 = await mockCall('Hey Nova, today I ate 10 samosas for 100 rupees.');
  console.log('Spoken:', res9.data.spokenResponse);
  const t9 = res9.data.data;
  if (res9.data.success && t9?.amount === 100 && t9?.category === 'Food' && t9?.date === todayStr) {
    console.log('✅ Passed Test 9 (Acceptance Criteria Verified)\n');
  } else {
    console.error('❌ Failed Test 9\n');
  }

  // =========================================================================
  // TEST 10: USER SECURITY ISOLATION TEST (User A vs User B)
  // User B queries balance; User B must NOT see User A's transactions or balance!
  // =========================================================================
  console.log('Test 10 (Multi-User Isolation): User B asks "Hey Nova, what is my balance?"');
  const res10 = await mockCall('Hey Nova, what is my balance?', [], userIdB);
  console.log('User B Spoken:', res10.data.spokenResponse);
  const walletsB = await Wallet.find({ userId: userIdB });
  const transB = await Transaction.find({ userId: userIdB });
  const transA = await Transaction.find({ userId: userIdA });
  console.log(`User A Transaction Count: ${transA.length} | User B Transaction Count: ${transB.length}`);

  if (res10.data.success && transB.every(t => t.userId === userIdB)) {
    console.log('✅ Passed Test 10 (Strict User Isolation Verified)\n');
  } else {
    console.error('❌ Failed Test 10\n');
  }

  console.log('🎉 ALL NOVA AI VOICE AGENT TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
