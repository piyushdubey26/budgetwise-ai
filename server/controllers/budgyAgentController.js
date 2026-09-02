import {
  Transaction,
  Wallet,
  Budget,
  Goal,
  Subscription,
  Bill,
  Investment,
  Debt,
  Emi,
  Notification,
  User,
  Setting
} from '../models/models.js';

// Category mapping helper
const CATEGORIES = ['Food', 'Travel', 'Fuel', 'Shopping', 'Bills', 'Medical', 'Education', 'Investment', 'Entertainment', 'Groceries', 'Salary', 'Savings', 'Other'];

// Helper to gain XP and Coins for Gamification
const rewardUser = async (userId, xp, coins) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    const newXp = (user.xp || 0) + xp;
    const newCoins = (user.coins || 0) + coins;
    const newLevel = Math.floor(newXp / 100) + 1;
    await User.findByIdAndUpdate(userId, { xp: newXp, coins: newCoins, level: newLevel });
  } catch (err) {
    console.error('Reward error:', err.message);
  }
};

// Date calculation helper for relative dates
const resolveDate = (dateStr, userTimezone = 'Asia/Kolkata') => {
  const now = new Date();
  if (!dateStr || dateStr.toLowerCase() === 'today' || dateStr.toLowerCase() === 'aaj') {
    return now.toISOString().split('T')[0];
  }
  const lower = dateStr.toLowerCase().trim();
  if (lower === 'yesterday' || lower === 'kal' || lower === 'beeta kal') {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
  if (lower === 'tomorrow' || lower === 'aane wala kal') {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  if (lower === 'day before yesterday' || lower === 'parso') {
    const d = new Date(now);
    d.setDate(d.getDate() - 2);
    return d.toISOString().split('T')[0];
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return now.toISOString().split('T')[0];
};

// Category inference helper
const inferCategory = (text = '') => {
  const t = text.toLowerCase();
  if (/samosa|pizza|burger|chai|tea|coffee|dinner|lunch|breakfast|food|snack|mcdonald|swiggy|zomato|starbucks|restaurant|cafe|khana|biryani|paneer|sweet/i.test(t)) return 'Food';
  if (/uber|ola|cab|auto|taxi|metro|bus|flight|ticket|travel|train|petrol|diesel|fuel|cng|yatra/i.test(t)) {
    return /petrol|diesel|fuel|cng/i.test(t) ? 'Fuel' : 'Travel';
  }
  if (/amazon|flipkart|myntra|zara|shoes|clothes|cloth|shirt|pant|shopping|dress|watch|buy|bought|kharida/i.test(t)) return 'Shopping';
  if (/netflix|spotify|hotstar|prime|movie|cinema|game|party|entertainment|theatre/i.test(t)) return 'Entertainment';
  if (/electricity|water|gas|broadband|wifi|recharge|bill|cylinder|bijli/i.test(t)) return 'Bills';
  if (/hospital|doctor|medicine|medical|pharmacy|dawa|tablet|clinic|health/i.test(t)) return 'Medical';
  if (/school|college|fees|tuition|udemy|coursera|book|course|study|padhai/i.test(t)) return 'Education';
  if (/mutual|fund|stock|shares|crypto|bitcoin|gold|invest|trading|sip/i.test(t)) return 'Investment';
  if (/salary|bonus|freelance|stipend|payout|tankhah|kamai/i.test(t)) return 'Salary';
  if (/grocery|groceries|sabzi|milk|doodh|ration|vegetable|fruit/i.test(t)) return 'Groceries';
  return 'Other';
};

// Gemini API Invocation (Uses verified gemini-3.5-flash endpoint)
async function queryGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${errText}`);
  }

  const result = await response.json();
  let text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  // Strip code fences if returned
  text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
  return JSON.parse(text);
}

// Deterministic Rule-Based NLU Fallback (100% offline & fast reliability)
const parseCommandLocally = (message = '', conversationContext = {}) => {
  const text = message.trim();
  const lower = text.toLowerCase();

  // 1. Confirm / Cancel Actions
  if (/^(yes|haan|ha|confirm|do it|proceed|sure|yup|ok|okay|kar do|pakka)$/i.test(lower)) {
    if (conversationContext.pendingConfirmation) {
      return { intent: 'confirm_action', confirmationToken: conversationContext.pendingConfirmation };
    }
  }
  if (/^(no|nah|cancel|stop|dont|don't|mat karo|cancel it|nahi)$/i.test(lower)) {
    return { intent: 'cancel_action' };
  }

  // 2. Dangerous Bulk Deletions
  if (/delete\s*all|delete\s*everything|reset\s*all|clear\s*all|sab\s*delete/i.test(lower)) {
    return {
      intent: 'dangerous_action',
      action: 'delete_all_transactions',
      requiresConfirmation: true,
      confirmationPrompt: 'Are you sure you want to permanently delete all your financial transactions? This cannot be undone.'
    };
  }

  // 3. Delete / Modify Last Expense
  if (/delete.*last|remove.*last|last.*delete/i.test(lower)) {
    return { intent: 'delete_last_expense' };
  }
  if (/change.*(?:last|it).*to\s*(\d+)|make.*it\s*(\d+)/i.test(lower)) {
    const m = text.match(/\d+/);
    if (m) {
      return { intent: 'update_last_expense', newAmount: parseFloat(m[0]) };
    }
  }

  // 4. Set / Update Budget
  if (/set.*budget|budget.*set|budget.*to\s*\d+/i.test(lower)) {
    const amtMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand)?/);
    if (amtMatch) {
      let amount = parseFloat(amtMatch[1]);
      if (/k|thousand/i.test(text)) amount *= 1000;
      const cat = CATEGORIES.find(c => lower.includes(c.toLowerCase())) || 'All';
      return {
        intent: 'create_budget',
        amount,
        category: cat,
        month: new Date().toISOString().substring(0, 7)
      };
    }
  }

  // 5. Income Logging
  if (/received|salary|income|earned|mila|aaye|credit/i.test(lower) && /\d+/.test(lower)) {
    const amtMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand)?/);
    if (amtMatch) {
      let amount = parseFloat(amtMatch[1]);
      if (/k|thousand/i.test(text)) amount *= 1000;
      return {
        intent: 'create_income',
        amount,
        description: text.replace(/\d+/g, '').replace(/received|salary|income|earned|today|mila|aaye|rs|rupees|inr|₹/gi, '').trim() || 'Salary Income',
        category: 'Salary',
        date: resolveDate('today')
      };
    }
  }

  // 6. Expense Logging
  // Special pattern: "10 samosas for 100 rupees" or "ate 10 samosas for 100"
  const qtyPattern = /(\d+)\s+([a-zA-Z\s]+?)\s+(?:for|worth|costing|me|mein)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)/i;
  const qtyMatch = text.match(qtyPattern);
  if (qtyMatch) {
    const qty = parseInt(qtyMatch[1]);
    const item = qtyMatch[2].trim();
    const amount = parseFloat(qtyMatch[3]);
    const category = inferCategory(item);
    const date = /yesterday|kal/i.test(text) ? resolveDate('yesterday') : resolveDate('today');
    return {
      intent: 'create_expense',
      amount,
      quantity: qty,
      description: `${qty} ${item}`,
      category,
      date
    };
  }

  // Hinglish and standard patterns
  const expensePatterns = [
    /(?:spent|add|paid|bought|ate|eat|log|record|kharch|lagaye|diye)\s*(?:of|rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)\s*(?:k|thousand)?\s*(?:rs\.?|rupees|rupaye|inr|₹)?\s*(?:for|on|pe|par|ka|ki)?\s*(.+)/i,
    /(?:maine|aaj\s+maine|i\s+spent|i\s+paid)?\s*(?:aaj)?\s*(\d+(?:\.\d+)?)\s*(?:rs\.?|rupees|rupaye|inr|₹)?\s*(.+?)\s*(?:pe|par|me|mein|for|on)\s*(?:spend|kharch|lagaye|diye)/i,
    /(?:i\s+spent|i\s+paid|maine|aaj\s+maine)?\s*(\d+(?:\.\d+)?)\s*(?:rs\.?|rupees|rupaye|inr|₹)?\s*(?:on|for|pe|par|me|mein)\s*(.+)/i
  ];

  for (const pat of expensePatterns) {
    const match = text.match(pat);
    if (match) {
      let amount = parseFloat(match[1]);
      if (/k|thousand/i.test(match[0])) amount *= 1000;
      let description = match[2]?.replace(/(today|yesterday|aaj|kal|this month|last month|spend|spent|kharch|kiye|diye|rupees|rupaye|rs|₹)/gi, '').trim();
      if (!description || description.length < 2) description = 'Expense';

      const date = /yesterday|kal|beeta kal/i.test(text) ? resolveDate('yesterday') : resolveDate('today');
      const category = inferCategory(description);

      return {
        intent: 'create_expense',
        amount,
        description,
        category,
        date
      };
    }
  }

  // 7. Budget Status Query
  if (/remaining\s*budget|budget\s*left|how\s*much\s*budget|budget\s*status|kitna\s*budget/i.test(lower)) {
    const cat = CATEGORIES.find(c => lower.includes(c.toLowerCase())) || 'All';
    return { intent: 'get_budget_status', category: cat };
  }

  // 8. Balance & Net Worth Query
  if (/balance|net\s*worth|total\s*money|paisa|kitna\s*hai|how\s*much\s*money/i.test(lower)) {
    return { intent: 'get_balance' };
  }

  // 9. Spending Queries
  if (/how\s*much\s*(?:did\s*i|have\s*i)?\s*spend|spending|what\s*is\s*my.*spend|kitna\s*kharch|show.*expenses/i.test(lower)) {
    const cat = CATEGORIES.find(c => lower.includes(c.toLowerCase()));
    const isLastMonth = /last\s*month|pichle\s*mahine/i.test(lower);
    return {
      intent: 'get_spending_summary',
      category: cat || 'All',
      period: isLastMonth ? 'last_month' : 'this_month'
    };
  }

  return { intent: 'general_query', query: text };
};

// =========================================================================
// BUDGY AGENT CONTROLLER (MAIN HANDLER)
// =========================================================================
export const processBudgyCommand = async (req, res) => {
  const startTime = Date.now();
  try {
    const userId = req.user.id || req.user._id;
    const { message, conversationHistory = [], timezone = 'Asia/Kolkata', currency = 'INR' } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        spokenResponse: "I didn't hear anything. How can I help with your finances?",
        textResponse: "I didn't hear anything. How can I help with your finances?",
        action: null,
        success: false
      });
    }

    const cleanMessage = message.trim();
    const currentMonth = new Date().toISOString().substring(0, 7);
    const currentDate = new Date().toISOString().split('T')[0];

    const lastContext = conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1] : {};

    // 1. Structured NLU: Try Gemini LLM First for Deep Natural Understanding
    let parsedIntent = null;
    let geminiError = null;

    try {
      const prompt = `
You are Budgy, an intelligent personal financial AI agent inside BudgetWise AI.
User message: "${cleanMessage}"
Today's Date: "${currentDate}" (Month: "${currentMonth}")
Timezone: "${timezone}"
Currency: "${currency}"
Recent Conversation Context: ${JSON.stringify(conversationHistory.slice(-3))}

Determine the user's financial intent and return strict JSON with this schema:
{
  "intent": "create_expense" | "create_income" | "update_last_expense" | "delete_last_expense" | "get_expenses" | "create_budget" | "get_budget_status" | "get_balance" | "get_spending_summary" | "set_financial_goal" | "add_bill" | "dangerous_action" | "general_query" | "ambiguous",
  "amount": number | null,
  "category": "Food" | "Travel" | "Fuel" | "Shopping" | "Bills" | "Medical" | "Education" | "Investment" | "Entertainment" | "Groceries" | "Salary" | "Savings" | "Other" | "All",
  "description": string | null,
  "quantity": number | null,
  "date": "YYYY-MM-DD" | null,
  "period": "this_month" | "last_month" | "today" | "yesterday" | "custom",
  "newAmount": number | null,
  "clarificationQuestion": string | null,
  "requiresConfirmation": boolean
}

Rules:
1. "I ate 10 samosas for 100 rupees" -> quantity: 10, description: "10 samosas", amount: 100, category: "Food". Do NOT make amount 1000.
2. "Add 500 for dinner" -> amount: 500, category: "Food", description: "Dinner", date: "${currentDate}".
3. "Spent 250 on Uber yesterday" -> amount: 250, category: "Travel", description: "Uber", date: "${resolveDate('yesterday')}".
4. "Set my food budget to 8000" -> intent: "create_budget", category: "Food", amount: 8000.
5. "Delete all my expenses" -> intent: "dangerous_action", requiresConfirmation: true.
6. Support English, Hindi, and Hinglish (e.g. "aaj maine 200 snacks pe spend kiye" -> create_expense, amount: 200, category: "Food", description: "snacks").
`;

      parsedIntent = await queryGemini(prompt);
    } catch (err) {
      geminiError = err.message;
      parsedIntent = parseCommandLocally(cleanMessage, lastContext);
    }

    if (!parsedIntent || !parsedIntent.intent) {
      parsedIntent = parseCommandLocally(cleanMessage, lastContext);
    }

    // 2. EXECUTE INTENT USING EXISTING DATABASE MODELS & SERVICES

    // A. CREATE EXPENSE
    if (parsedIntent.intent === 'create_expense') {
      const amount = parseFloat(parsedIntent.amount);
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(200).json({
          spokenResponse: "How much did you spend on this expense?",
          textResponse: "Please specify the amount for this expense.",
          action: 'ask_clarification',
          requiresClarification: true,
          success: false
        });
      }

      const description = parsedIntent.description || (parsedIntent.quantity ? `${parsedIntent.quantity} items` : 'Expense');
      const category = parsedIntent.category && parsedIntent.category !== 'All' ? parsedIntent.category : inferCategory(description);
      const date = parsedIntent.date || currentDate;

      let wallets = await Wallet.find({ userId });
      let sourceWallet = wallets.find(w => w.type === 'cash' || w.type === 'bank') || wallets[0];
      
      if (!sourceWallet) {
        sourceWallet = await Wallet.create({
          userId,
          name: 'Primary Wallet',
          type: 'bank',
          balance: 10000
        });
      }

      await Wallet.findByIdAndUpdate(sourceWallet._id, { balance: sourceWallet.balance - amount });

      const transactionMonth = date.substring(0, 7);
      const matchingBudgets = await Budget.find({
        userId,
        month: transactionMonth,
        category: { $in: [category, 'All'] }
      });

      for (const b of matchingBudgets) {
        await Budget.findByIdAndUpdate(b._id, { spent: (b.spent || 0) + amount });
      }

      const transaction = await Transaction.create({
        userId,
        title: description,
        amount,
        type: 'expense',
        category,
        date,
        time: new Date().toTimeString().substring(0, 5),
        paymentMode: sourceWallet.name,
        sourceWalletId: sourceWallet._id,
        notes: `Logged via Budgy Voice AI (${cleanMessage})`
      });

      await rewardUser(userId, 15, 5);

      const spokenResponse = `Done! I added ₹${amount.toLocaleString('en-IN')} for ${description} in ${category}.`;
      const textResponse = `Added ₹${amount.toLocaleString('en-IN')} to ${category} (${description})`;

      return res.status(200).json({
        spokenResponse,
        textResponse,
        action: 'create_expense',
        success: true,
        data: {
          transaction,
          amount,
          category,
          description,
          date,
          wallet: sourceWallet.name
        },
        uiCard: {
          type: 'expense_created',
          title: description,
          amount,
          category,
          date,
          wallet: sourceWallet.name
        },
        latencyMs: Date.now() - startTime
      });
    }

    // B. CREATE INCOME
    if (parsedIntent.intent === 'create_income') {
      const amount = parseFloat(parsedIntent.amount);
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(200).json({
          spokenResponse: "How much income did you receive?",
          textResponse: "Please specify the income amount.",
          action: 'ask_clarification',
          success: false
        });
      }

      const description = parsedIntent.description || 'Income';
      const category = parsedIntent.category || 'Salary';
      const date = parsedIntent.date || currentDate;

      let wallets = await Wallet.find({ userId });
      let targetWallet = wallets.find(w => w.type === 'bank') || wallets[0];
      if (!targetWallet) {
        targetWallet = await Wallet.create({ userId, name: 'Bank Account', type: 'bank', balance: 0 });
      }

      await Wallet.findByIdAndUpdate(targetWallet._id, { balance: targetWallet.balance + amount });

      const transaction = await Transaction.create({
        userId,
        title: description,
        amount,
        type: 'income',
        category,
        date,
        time: new Date().toTimeString().substring(0, 5),
        paymentMode: targetWallet.name,
        targetWalletId: targetWallet._id,
        notes: `Logged via Budgy Voice AI`
      });

      await rewardUser(userId, 20, 10);

      const spokenResponse = `Great! I logged ₹${amount.toLocaleString('en-IN')} as ${description}.`;
      return res.status(200).json({
        spokenResponse,
        textResponse: `Logged income of ₹${amount.toLocaleString('en-IN')} (${description})`,
        action: 'create_income',
        success: true,
        data: { transaction, amount, description, category, date },
        uiCard: { type: 'income_created', title: description, amount, category, date },
        latencyMs: Date.now() - startTime
      });
    }

    // C. GET BALANCE & NET WORTH
    if (parsedIntent.intent === 'get_balance') {
      const wallets = await Wallet.find({ userId });
      const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
      const walletList = wallets.map(w => `${w.name}: ₹${(w.balance || 0).toLocaleString('en-IN')}`).join(', ');

      const spokenResponse = `Your total wallet balance is ₹${totalBalance.toLocaleString('en-IN')}. ${wallets.length > 1 ? `Breakdown: ${walletList}` : ''}`;
      return res.status(200).json({
        spokenResponse,
        textResponse: `Total Balance: ₹${totalBalance.toLocaleString('en-IN')}`,
        action: 'get_balance',
        success: true,
        data: { totalBalance, wallets },
        uiCard: { type: 'balance_summary', totalBalance, wallets },
        latencyMs: Date.now() - startTime
      });
    }

    // D. GET BUDGET STATUS
    if (parsedIntent.intent === 'get_budget_status') {
      const category = parsedIntent.category || 'All';
      const budgets = await Budget.find({ userId, month: currentMonth });
      const targetBudget = budgets.find(b => b.category.toLowerCase() === category.toLowerCase()) || budgets.find(b => b.category === 'All');

      if (!targetBudget) {
        return res.status(200).json({
          spokenResponse: `You haven't set a budget for ${category} this month. You can say "Set my ${category} budget to 5000".`,
          textResponse: `No budget found for ${category} in ${currentMonth}.`,
          action: 'get_budget_status',
          success: true,
          latencyMs: Date.now() - startTime
        });
      }

      const spent = targetBudget.spent || 0;
      const limit = targetBudget.amount || 0;
      const remaining = Math.max(0, limit - spent);
      const percent = limit > 0 ? ((spent / limit) * 100).toFixed(0) : 0;

      const spokenResponse = `For ${targetBudget.category}, you have ₹${remaining.toLocaleString('en-IN')} remaining out of your ₹${limit.toLocaleString('en-IN')} budget (${percent}% used).`;
      return res.status(200).json({
        spokenResponse,
        textResponse: `${targetBudget.category} Budget: ₹${remaining.toLocaleString('en-IN')} left (${percent}% used of ₹${limit.toLocaleString('en-IN')})`,
        action: 'get_budget_status',
        success: true,
        data: { category: targetBudget.category, limit, spent, remaining, percent },
        uiCard: { type: 'budget_status', category: targetBudget.category, limit, spent, remaining, percent },
        latencyMs: Date.now() - startTime
      });
    }

    // E. CREATE OR UPDATE BUDGET
    if (parsedIntent.intent === 'create_budget') {
      const amount = parseFloat(parsedIntent.amount);
      const category = parsedIntent.category || 'All';
      const month = parsedIntent.month || currentMonth;

      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(200).json({
          spokenResponse: "How much would you like to set for the budget limit?",
          textResponse: "Please specify the budget limit amount.",
          action: 'ask_clarification',
          success: false
        });
      }

      const existing = await Budget.findOne({ userId, month, category });
      let budget;
      if (existing) {
        budget = await Budget.findByIdAndUpdate(existing._id, { amount }, { new: true });
      } else {
        const allTransactions = await Transaction.find({ userId });
        const monthExpenses = allTransactions.filter(t => {
          return t.type === 'expense' && t.date.substring(0, 7) === month && (category === 'All' || t.category === category);
        });
        const totalSpent = monthExpenses.reduce((sum, t) => sum + t.amount, 0);

        budget = await Budget.create({
          userId,
          month,
          category,
          amount,
          spent: totalSpent
        });
      }

      const spokenResponse = `Done! I set your monthly ${category} budget to ₹${amount.toLocaleString('en-IN')}.`;
      return res.status(200).json({
        spokenResponse,
        textResponse: `Set ${category} budget to ₹${amount.toLocaleString('en-IN')} for ${month}`,
        action: 'create_budget',
        success: true,
        data: { budget, category, amount, month },
        uiCard: { type: 'budget_created', category, amount, month },
        latencyMs: Date.now() - startTime
      });
    }

    // F. GET SPENDING SUMMARY / QUERIES
    if (parsedIntent.intent === 'get_spending_summary' || parsedIntent.intent === 'get_expenses') {
      const period = parsedIntent.period || 'this_month';
      const targetMonth = period === 'last_month' 
        ? new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().substring(0, 7)
        : currentMonth;

      const transactions = await Transaction.find({ userId });
      const expenses = transactions.filter(t => t.type === 'expense' && t.date.substring(0, 7) === targetMonth);
      
      const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

      const catTotals = {};
      for (const t of expenses) {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
      }

      let topCategory = 'None';
      let maxCatSpent = 0;
      for (const c in catTotals) {
        if (catTotals[c] > maxCatSpent) {
          maxCatSpent = catTotals[c];
          topCategory = c;
        }
      }

      let spokenResponse = '';
      if (parsedIntent.category && parsedIntent.category !== 'All') {
        const catSpent = catTotals[parsedIntent.category] || 0;
        spokenResponse = `You have spent ₹${catSpent.toLocaleString('en-IN')} on ${parsedIntent.category} in ${period === 'last_month' ? 'last month' : 'this month'}.`;
      } else {
        spokenResponse = `You have spent a total of ₹${totalExpense.toLocaleString('en-IN')} ${period === 'last_month' ? 'last month' : 'this month'}. Your highest spending category is ${topCategory} at ₹${maxCatSpent.toLocaleString('en-IN')}.`;
      }

      return res.status(200).json({
        spokenResponse,
        textResponse: spokenResponse,
        action: 'get_spending_summary',
        success: true,
        data: { totalExpense, topCategory, maxCatSpent, categoryBreakdown: catTotals, targetMonth },
        uiCard: { type: 'spending_summary', totalExpense, topCategory, maxCatSpent, categoryBreakdown: catTotals },
        latencyMs: Date.now() - startTime
      });
    }

    // G. DELETE LAST EXPENSE
    if (parsedIntent.intent === 'delete_last_expense') {
      const transactions = await Transaction.find({ userId });
      transactions.sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00')));
      const lastExp = transactions.find(t => t.type === 'expense');

      if (!lastExp) {
        return res.status(200).json({
          spokenResponse: "I couldn't find any recent expense to delete.",
          textResponse: "No recent expense found.",
          action: 'delete_last_expense',
          success: false
        });
      }

      if (lastExp.sourceWalletId) {
        const wallet = await Wallet.findById(lastExp.sourceWalletId);
        if (wallet) {
          await Wallet.findByIdAndUpdate(lastExp.sourceWalletId, { balance: wallet.balance + lastExp.amount });
        }
      }

      const transactionMonth = lastExp.date.substring(0, 7);
      const matchingBudgets = await Budget.find({
        userId,
        month: transactionMonth,
        category: { $in: [lastExp.category, 'All'] }
      });
      for (const b of matchingBudgets) {
        await Budget.findByIdAndUpdate(b._id, { spent: Math.max(0, (b.spent || 0) - lastExp.amount) });
      }

      await Transaction.findByIdAndDelete(lastExp._id);

      const spokenResponse = `Deleted your last expense of ₹${lastExp.amount} for ${lastExp.title}.`;
      return res.status(200).json({
        spokenResponse,
        textResponse: `Deleted expense: ${lastExp.title} (₹${lastExp.amount})`,
        action: 'delete_last_expense',
        success: true,
        data: { deletedTransaction: lastExp },
        uiCard: { type: 'expense_deleted', title: lastExp.title, amount: lastExp.amount },
        latencyMs: Date.now() - startTime
      });
    }

    // H. UPDATE LAST EXPENSE
    if (parsedIntent.intent === 'update_last_expense') {
      const newAmount = parseFloat(parsedIntent.newAmount);
      if (!newAmount || isNaN(newAmount) || newAmount <= 0) {
        return res.status(200).json({
          spokenResponse: "What amount should I change the last expense to?",
          textResponse: "Please specify the new amount.",
          action: 'ask_clarification',
          success: false
        });
      }

      const transactions = await Transaction.find({ userId });
      transactions.sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00')));
      const lastExp = transactions.find(t => t.type === 'expense');

      if (!lastExp) {
        return res.status(200).json({
          spokenResponse: "I couldn't find a recent transaction to update.",
          textResponse: "No recent transaction found.",
          action: 'update_last_expense',
          success: false
        });
      }

      const diff = newAmount - lastExp.amount;

      if (lastExp.sourceWalletId) {
        const wallet = await Wallet.findById(lastExp.sourceWalletId);
        if (wallet) {
          await Wallet.findByIdAndUpdate(lastExp.sourceWalletId, { balance: wallet.balance - diff });
        }
      }

      const transactionMonth = lastExp.date.substring(0, 7);
      const matchingBudgets = await Budget.find({
        userId,
        month: transactionMonth,
        category: { $in: [lastExp.category, 'All'] }
      });
      for (const b of matchingBudgets) {
        await Budget.findByIdAndUpdate(b._id, { spent: (b.spent || 0) + diff });
      }

      const updated = await Transaction.findByIdAndUpdate(lastExp._id, { amount: newAmount }, { new: true });

      const spokenResponse = `Updated ${lastExp.title} from ₹${lastExp.amount} to ₹${newAmount}.`;
      return res.status(200).json({
        spokenResponse,
        textResponse: `Updated ${lastExp.title}: ₹${newAmount}`,
        action: 'update_last_expense',
        success: true,
        data: { transaction: updated, oldAmount: lastExp.amount, newAmount },
        uiCard: { type: 'expense_updated', title: lastExp.title, oldAmount: lastExp.amount, newAmount },
        latencyMs: Date.now() - startTime
      });
    }

    // I. DANGEROUS ACTION (CONFIRMATION POLICY)
    if (parsedIntent.intent === 'dangerous_action') {
      const confirmationToken = 'confirm_delete_all_' + Date.now();
      return res.status(200).json({
        spokenResponse: "Are you sure you want to delete all your transactions? Please confirm to proceed.",
        textResponse: "Are you sure you want to delete all your transactions? This cannot be undone.",
        action: 'require_confirmation',
        requiresConfirmation: true,
        confirmationToken,
        success: true,
        latencyMs: Date.now() - startTime
      });
    }

    // J. GENERAL OR AMBIGUOUS QUERY
    const fallbackAnswer = `I can help you log expenses, track budgets, check your balance, or review monthly reports. Try saying "Hey Budgy, I spent 100 on samosas" or "Hey Budgy, what's my balance?"`;
    return res.status(200).json({
      spokenResponse: parsedIntent.clarificationQuestion || fallbackAnswer,
      textResponse: parsedIntent.clarificationQuestion || fallbackAnswer,
      action: 'general_response',
      success: true,
      latencyMs: Date.now() - startTime
    });

  } catch (err) {
    console.error('Budgy Agent error:', err);
    return res.status(500).json({
      spokenResponse: "I encountered an issue processing that command. Please try again.",
      textResponse: "I encountered an issue processing that command. Please try again.",
      error: err.message,
      success: false
    });
  }
};
