import dotenv from 'dotenv';
dotenv.config();

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

// Helper to reward gamification XP and Coins
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

// Dynamic Date calculation helper based on user timezone
export const resolveDate = (dateStr, userTimezone = 'Asia/Kolkata', isFutureContext = false) => {
  const now = new Date();
  let userLocalDateStr;
  try {
    userLocalDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
  } catch {
    userLocalDateStr = now.toISOString().split('T')[0];
  }

  const [currYear, currMonth, currDay] = userLocalDateStr.split('-').map(Number);
  const baseDate = new Date(Date.UTC(currYear, currMonth - 1, currDay));

  if (!dateStr || dateStr.toLowerCase() === 'today' || dateStr.toLowerCase() === 'aaj') {
    return userLocalDateStr;
  }

  const lower = dateStr.toLowerCase().trim();

  // Yesterday / Beeta kal
  if (lower === 'yesterday' || lower === 'beeta kal' || (lower === 'kal' && !isFutureContext)) {
    const d = new Date(baseDate);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split('T')[0];
  }

  // Tomorrow / Aane wala kal
  if (lower === 'tomorrow' || lower === 'aane wala kal' || (lower === 'kal' && isFutureContext)) {
    const d = new Date(baseDate);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().split('T')[0];
  }

  // Two days ago / Parso
  if (lower === 'day before yesterday' || lower === 'parso' || lower === 'two days ago' || lower === '2 days ago') {
    const d = new Date(baseDate);
    d.setUTCDate(d.getUTCDate() - 2);
    return d.toISOString().split('T')[0];
  }

  // Days of week relative calculation
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < dayNames.length; i++) {
    const dayName = dayNames[i];
    if (lower.includes(`last ${dayName}`) || lower.includes(`pichle ${dayName}`) || lower.includes(`previous ${dayName}`)) {
      const currentDayOfWeek = baseDate.getUTCDay();
      let diff = currentDayOfWeek - i;
      if (diff <= 0) diff += 7;
      const d = new Date(baseDate);
      d.setUTCDate(d.getUTCDate() - diff);
      return d.toISOString().split('T')[0];
    }
    if (lower.includes(`this ${dayName}`) || lower.includes(`is ${dayName}`)) {
      const currentDayOfWeek = baseDate.getUTCDay();
      const diff = i - currentDayOfWeek;
      const d = new Date(baseDate);
      d.setUTCDate(d.getUTCDate() + diff);
      return d.toISOString().split('T')[0];
    }
  }

  // Specific dates like "25th August", "August 25"
  const monthMatch = lower.match(/(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/);
  const dayMatch = lower.match(/(\d{1,2})(?:st|nd|rd|th)?/);
  if (monthMatch && dayMatch) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIndex = months.findIndex(m => monthMatch[0].startsWith(m));
    if (monthIndex !== -1) {
      const d = new Date(Date.UTC(currYear, monthIndex, parseInt(dayMatch[1])));
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    }
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime()) && parsed.toISOString().length >= 10) {
    return parsed.toISOString().split('T')[0];
  }

  return userLocalDateStr;
};

// Smart Category & Merchant Inference Helper
export const inferCategoryAndMerchant = (text = '') => {
  const t = text.toLowerCase();
  let category = 'Other';
  let merchant = null;

  if (/uber/i.test(t)) { merchant = 'Uber'; category = 'Travel'; }
  else if (/ola/i.test(t)) { merchant = 'Ola'; category = 'Travel'; }
  else if (/swiggy/i.test(t)) { merchant = 'Swiggy'; category = 'Food'; }
  else if (/zomato/i.test(t)) { merchant = 'Zomato'; category = 'Food'; }
  else if (/mcdonald/i.test(t)) { merchant = "McDonald's"; category = 'Food'; }
  else if (/starbucks/i.test(t)) { merchant = 'Starbucks'; category = 'Food'; }
  else if (/amazon/i.test(t)) { merchant = 'Amazon'; category = 'Shopping'; }
  else if (/flipkart/i.test(t)) { merchant = 'Flipkart'; category = 'Shopping'; }
  else if (/myntra/i.test(t)) { merchant = 'Myntra'; category = 'Shopping'; }
  else if (/zara/i.test(t)) { merchant = 'Zara'; category = 'Shopping'; }
  else if (/netflix/i.test(t)) { merchant = 'Netflix'; category = 'Entertainment'; }
  else if (/spotify/i.test(t)) { merchant = 'Spotify'; category = 'Entertainment'; }

  if (category === 'Other') {
    if (/samosa|pizza|burger|chai|tea|coffee|dinner|lunch|breakfast|food|snack|restaurant|cafe|khana|biryani|paneer|sweet|snacks/i.test(t)) category = 'Food';
    else if (/cab|auto|taxi|metro|bus|flight|ticket|travel|train|yatra/i.test(t)) category = 'Travel';
    else if (/petrol|diesel|fuel|cng/i.test(t)) category = 'Fuel';
    else if (/shoes|clothes|cloth|shirt|pant|shopping|dress|watch|buy|bought|kharida/i.test(t)) category = 'Shopping';
    else if (/hotstar|prime|movie|cinema|game|party|entertainment|theatre/i.test(t)) category = 'Entertainment';
    else if (/electricity|water|gas|broadband|wifi|recharge|bill|cylinder|bijli/i.test(t)) category = 'Bills';
    else if (/hospital|doctor|medicine|medical|pharmacy|dawa|tablet|clinic|health/i.test(t)) category = 'Medical';
    else if (/school|college|fees|tuition|udemy|coursera|book|course|study|padhai/i.test(t)) category = 'Education';
    else if (/mutual|fund|stock|shares|crypto|bitcoin|gold|invest|trading|sip/i.test(t)) category = 'Investment';
    else if (/salary|bonus|freelance|stipend|payout|tankhah|kamai/i.test(t)) category = 'Salary';
    else if (/grocery|groceries|sabzi|milk|doodh|ration|vegetable|fruit/i.test(t)) category = 'Groceries';
  }

  return { category, merchant };
};

// Gemini 3.5 Flash NLU Query
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
  text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
  return JSON.parse(text);
}

// Clean command text of wake words and currency symbols
const cleanRawText = (raw = '') => {
  return raw.replace(/^(hey|hi|hello|ok|okay)?\s*nova\s*,?\s*/i, '').trim();
};

// Local Deterministic NLU Fallback (100% offline & fast reliability)
export const parseCommandLocally = (message = '', conversationContext = {}, userTimezone = 'Asia/Kolkata') => {
  const text = cleanRawText(message);
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
      confirmationPrompt: 'Are you sure you want to permanently delete all your transactions? This cannot be undone.'
    };
  }

  // 3. Delete / Modify Last Expense
  if (/delete.*last|remove.*last|last.*delete/i.test(lower)) {
    return { intent: 'delete_last_expense' };
  }
  if (/change.*(?:last|it).*to\s*(?:rs\.?|inr|₹)?\s*([\d,]+)|make.*it\s*(?:rs\.?|inr|₹)?\s*([\d,]+)/i.test(lower)) {
    const m = text.match(/([\d,]+(?:\.\d+)?)/g);
    if (m && m.length > 0) {
      const val = parseFloat(m[m.length - 1].replace(/,/g, ''));
      return { intent: 'update_last_expense', newAmount: val };
    }
  }

  // 4. Set / Update Budget
  if (/set.*budget|budget.*set|budget.*to\s*(?:rs\.?|inr|₹)?\s*[\d,]+/i.test(lower)) {
    const amtMatch = text.match(/(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)\s*(?:k|thousand)?/i);
    if (amtMatch) {
      let amount = parseFloat(amtMatch[1].replace(/,/g, ''));
      if (/k|thousand/i.test(text)) amount *= 1000;
      const cat = CATEGORIES.find(c => lower.includes(c.toLowerCase())) || 'All';
      return {
        intent: 'create_budget',
        amount,
        category: cat,
        month: resolveDate('today', userTimezone).substring(0, 7)
      };
    }
  }

  // 5. Income Logging
  if (/received|salary|income|earned|mila|aaye|credit/i.test(lower) && /[\d,]+/.test(lower)) {
    const amtMatch = text.match(/(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)\s*(?:k|thousand)?/i);
    if (amtMatch) {
      let amount = parseFloat(amtMatch[1].replace(/,/g, ''));
      if (/k|thousand/i.test(text)) amount *= 1000;
      const cleanDesc = text.replace(/[\d,]+/g, '').replace(/received|salary|income|earned|today|aaj|mila|aaye|rs|rupees|rupaye|inr|₹/gi, '').trim() || 'Salary';
      return {
        intent: 'create_income',
        amount,
        description: cleanDesc,
        category: 'Salary',
        date: resolveDate('today', userTimezone)
      };
    }
  }

  // 6. Expense Logging
  // Date context detection
  const isYesterday = /yesterday|kal\s+(?:maine|ko)|beeta\s*kal|parso/i.test(lower) || (/kal/i.test(lower) && /spend|kharch|diye|bought|ate|spent/i.test(lower));
  const isParso = /parso|two days ago|2 days ago/i.test(lower);
  const dateVal = isParso 
    ? resolveDate('parso', userTimezone) 
    : (isYesterday ? resolveDate('yesterday', userTimezone) : resolveDate('today', userTimezone));

  // Quantity + item + for + amount (e.g. "add ₹100 for 10 samosas" OR "10 samosas for ₹100")
  const qtyFirstMatch = text.match(/(?:add|spent|paid)?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)\s*(?:for|on)\s*(\d+)\s+([a-zA-Z\s]+)/i);
  if (qtyFirstMatch) {
    const amount = parseFloat(qtyFirstMatch[1].replace(/,/g, ''));
    const qty = parseInt(qtyFirstMatch[2]);
    const item = qtyFirstMatch[3].replace(/today|yesterday|aaj|kal/gi, '').trim();
    const { category, merchant } = inferCategoryAndMerchant(item);
    return {
      intent: 'create_expense',
      amount,
      quantity: qty,
      description: `${qty} ${item}`,
      merchant,
      category,
      date: dateVal
    };
  }

  const qtySecondMatch = text.match(/(\d+)\s+([a-zA-Z\s]+?)\s+(?:for|worth|costing|me|mein)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)/i);
  if (qtySecondMatch) {
    const qty = parseInt(qtySecondMatch[1]);
    const item = qtySecondMatch[2].replace(/today|yesterday|aaj|kal|ate|bought|had/gi, '').trim();
    const amount = parseFloat(qtySecondMatch[3].replace(/,/g, ''));
    const { category, merchant } = inferCategoryAndMerchant(item);
    return {
      intent: 'create_expense',
      amount,
      quantity: qty,
      description: `${qty} ${item}`,
      merchant,
      category,
      date: dateVal
    };
  }

  // Hinglish e.g. "maine aaj ₹200 snacks pe spend kiye" or "kal maine Uber pe ₹500 spend kiye"
  const hinglishMatch = text.match(/(?:maine|aaj|kal)?\s*(?:aaj|kal|parso)?\s*(?:maine)?\s*(.+?)\s*(?:pe|par|me|mein|on|for)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)\s*(?:spend|kharch|lagaye|diye)/i) 
    || text.match(/(?:maine|aaj|kal)?\s*(?:aaj|kal|parso)?\s*(?:maine)?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)\s*(?:rupees|rupaye|rs|₹)?\s*(.+?)\s*(?:pe|par|me|mein|for|on)\s*(?:spend|kharch|lagaye|diye)/i);

  if (hinglishMatch) {
    let amount, desc;
    if (isNaN(parseFloat(hinglishMatch[1].replace(/,/g, '')))) {
      desc = hinglishMatch[1];
      amount = parseFloat(hinglishMatch[2].replace(/,/g, ''));
    } else {
      amount = parseFloat(hinglishMatch[1].replace(/,/g, ''));
      desc = hinglishMatch[2];
    }
    desc = desc.replace(/today|yesterday|aaj|kal|parso|maine|pe|par|me|mein|on|for|rupees|rupaye|rs|₹/gi, '').trim();
    const { category, merchant } = inferCategoryAndMerchant(desc);
    return {
      intent: 'create_expense',
      amount,
      description: merchant || desc || 'Expense',
      merchant,
      category,
      date: dateVal
    };
  }

  // General expense match: "yesterday I spent 500 on dinner", "spent 250 on Uber"
  const genMatch = text.match(/(?:spent|add|paid|bought|ate|eat|log|record)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)\s*(?:for|on|in)\s*(.+)/i)
    || text.match(/(?:on|for)\s*(.+?)\s*(?:spent|paid|added)\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)/i);

  if (genMatch) {
    let amount, desc;
    if (!isNaN(parseFloat(genMatch[1].replace(/,/g, '')))) {
      amount = parseFloat(genMatch[1].replace(/,/g, ''));
      desc = genMatch[2];
    } else {
      desc = genMatch[1];
      amount = parseFloat(genMatch[2].replace(/,/g, ''));
    }
    desc = desc.replace(/today|yesterday|aaj|kal|parso/gi, '').trim();
    const { category, merchant } = inferCategoryAndMerchant(desc);
    return {
      intent: 'create_expense',
      amount,
      description: merchant || desc || 'Expense',
      merchant,
      category,
      date: dateVal
    };
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
// NOVA AGENT CONTROLLER (MAIN HANDLER)
// =========================================================================
export const processNovaCommand = async (req, res) => {
  const startTime = Date.now();
  try {
    // SECURITY: Authenticated User is strictly derived from verified JWT Token
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        spokenResponse: "Authentication required. Please log in.",
        textResponse: "Authentication required. Please log in.",
        action: null,
        success: false
      });
    }

    // Fetch user profile for personalization
    const user = await User.findById(userId);
    const userName = user?.name ? user.name.split(' ')[0] : '';
    const greeting = userName ? `${userName}` : '';

    const { message, conversationHistory = [], timezone = 'Asia/Kolkata', currency = 'INR' } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        spokenResponse: `I'm listening${greeting ? `, ${greeting}` : ''}. How can I assist with your finances?`,
        textResponse: "I didn't hear anything. How can I help with your finances?",
        action: null,
        success: false
      });
    }

    const cleanMessage = cleanRawText(message);
    const userLocalDate = resolveDate('today', timezone);
    const userLocalMonth = userLocalDate.substring(0, 7);

    const lastContext = conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1] : {};

    // 1. Structured NLU: Use Gemini 3.5 Flash with Dynamic Timezone & Date
    let parsedIntent = null;
    let geminiError = null;

    try {
      const prompt = `
You are Nova, an intelligent personal financial AI agent inside Budget Voice.
User: "${userName || 'User'}"
User message: "${cleanMessage}"
Current Dynamic Date: "${userLocalDate}" (Month: "${userLocalMonth}")
Timezone: "${timezone}"
Currency: "${currency}"
Recent Conversation Context: ${JSON.stringify(conversationHistory.slice(-3))}

Determine the user's financial intent and return strict JSON with this schema:
{
  "intent": "create_expense" | "create_income" | "update_last_expense" | "delete_last_expense" | "get_expenses" | "create_budget" | "get_budget_status" | "get_balance" | "get_spending_summary" | "set_financial_goal" | "add_bill" | "dangerous_action" | "general_query" | "ambiguous",
  "amount": number | null,
  "category": "Food" | "Travel" | "Fuel" | "Shopping" | "Bills" | "Medical" | "Education" | "Investment" | "Entertainment" | "Groceries" | "Salary" | "Savings" | "Other" | "All",
  "description": string | null,
  "merchant": string | null,
  "quantity": number | null,
  "date": "YYYY-MM-DD" | null,
  "period": "this_month" | "last_month" | "today" | "yesterday" | "custom",
  "newAmount": number | null,
  "clarificationQuestion": string | null,
  "requiresConfirmation": boolean
}

Rules:
1. "today I ate 10 samosas for 100 rupees" -> intent: "create_expense", quantity: 10, description: "10 samosas", amount: 100, category: "Food", date: "${userLocalDate}".
2. "yesterday I spent 500 on dinner" -> intent: "create_expense", amount: 500, category: "Food", description: "Dinner", date: "${resolveDate('yesterday', timezone)}".
3. "kal maine Uber pe 500 spend kiye" -> intent: "create_expense", amount: 500, merchant: "Uber", description: "Uber", category: "Travel", date: "${resolveDate('yesterday', timezone)}".
4. "yesterday I bought 2 shirts from Amazon for 2500" -> intent: "create_expense", quantity: 2, description: "2 shirts", merchant: "Amazon", amount: 2500, category: "Shopping", date: "${resolveDate('yesterday', timezone)}".
5. "aaj Swiggy pe 450 kharch kiye" -> intent: "create_expense", merchant: "Swiggy", description: "Swiggy", amount: 450, category: "Food", date: "${userLocalDate}".
6. "I received 50000 salary today" -> intent: "create_income", amount: 50000, category: "Salary", date: "${userLocalDate}".
7. "Delete all my expenses" -> intent: "dangerous_action", requiresConfirmation: true.
8. If date is unspecified, default to "${userLocalDate}".
`;

      parsedIntent = await queryGemini(prompt);
    } catch (err) {
      geminiError = err.message;
      parsedIntent = parseCommandLocally(cleanMessage, lastContext, timezone);
    }

    if (!parsedIntent || !parsedIntent.intent) {
      parsedIntent = parseCommandLocally(cleanMessage, lastContext, timezone);
    }

    // 2. EXECUTE INTENT STRICTLY IN AUTHENTICATED USER CONTEXT (userId)

    // A. CREATE EXPENSE
    if (parsedIntent.intent === 'create_expense') {
      const amount = parseFloat(parsedIntent.amount);
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(200).json({
          spokenResponse: "How much did you spend?",
          textResponse: "Please specify the amount for this expense.",
          action: 'ask_clarification',
          requiresClarification: true,
          success: false
        });
      }

      const description = parsedIntent.description || (parsedIntent.quantity ? `${parsedIntent.quantity} items` : 'Expense');
      const { category: inferredCat, merchant: inferredMerch } = inferCategoryAndMerchant(description);
      const category = parsedIntent.category && parsedIntent.category !== 'All' ? parsedIntent.category : inferredCat;
      const merchant = parsedIntent.merchant || inferredMerch;
      const date = parsedIntent.date || userLocalDate;

      // Ensure user wallet
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

      // Update matching budgets for current user
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
        notes: merchant ? `Merchant: ${merchant} | Logged via Nova Voice AI` : `Logged via Nova Voice AI (${cleanMessage})`
      });

      await rewardUser(userId, 15, 5);

      const dateLabel = date === userLocalDate ? 'today' : (date === resolveDate('yesterday', timezone) ? 'yesterday' : `on ${date}`);
      const spokenResponse = greeting
        ? `Done, ${greeting}. I added ₹${amount.toLocaleString('en-IN')} to ${category} for ${dateLabel}.`
        : `Done. I added ₹${amount.toLocaleString('en-IN')} to ${category} for ${dateLabel}.`;
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
          merchant,
          date,
          wallet: sourceWallet.name
        },
        uiCard: {
          type: 'expense_created',
          title: description,
          amount,
          category,
          merchant,
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

      const description = parsedIntent.description || 'Salary';
      const category = parsedIntent.category || 'Salary';
      const date = parsedIntent.date || userLocalDate;

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
        notes: `Logged via Nova Voice AI`
      });

      await rewardUser(userId, 20, 10);

      const spokenResponse = greeting
        ? `Great, ${greeting}! I logged ₹${amount.toLocaleString('en-IN')} as ${description}.`
        : `Done. I recorded ₹${amount.toLocaleString('en-IN')} as ${description}.`;

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

      const spokenResponse = greeting
        ? `${greeting}, your total balance is ₹${totalBalance.toLocaleString('en-IN')}. ${wallets.length > 1 ? `(${walletList})` : ''}`
        : `Your total balance is ₹${totalBalance.toLocaleString('en-IN')}. ${wallets.length > 1 ? `(${walletList})` : ''}`;

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
      const budgets = await Budget.find({ userId, month: userLocalMonth });
      const targetBudget = budgets.find(b => b.category.toLowerCase() === category.toLowerCase()) || budgets.find(b => b.category === 'All');

      if (!targetBudget) {
        return res.status(200).json({
          spokenResponse: `You haven't set a budget for ${category} this month. You can say "Set my ${category} budget to 5000".`,
          textResponse: `No budget found for ${category} in ${userLocalMonth}.`,
          action: 'get_budget_status',
          success: true,
          latencyMs: Date.now() - startTime
        });
      }

      const spent = targetBudget.spent || 0;
      const limit = targetBudget.amount || 0;
      const remaining = Math.max(0, limit - spent);
      const percent = limit > 0 ? ((spent / limit) * 100).toFixed(0) : 0;

      const spokenResponse = `Your remaining ${targetBudget.category} budget is ₹${remaining.toLocaleString('en-IN')} out of ₹${limit.toLocaleString('en-IN')} (${percent}% used).`;
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
      const month = parsedIntent.month || userLocalMonth;

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
        : userLocalMonth;

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
        spokenResponse = `Your ${parsedIntent.category} spending ${period === 'last_month' ? 'last month' : 'this month'} is ₹${catSpent.toLocaleString('en-IN')}.`;
      } else {
        spokenResponse = `You have spent ₹${totalExpense.toLocaleString('en-IN')} ${period === 'last_month' ? 'last month' : 'this month'}. Top category is ${topCategory} at ₹${maxCatSpent.toLocaleString('en-IN')}.`;
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

      const spokenResponse = `Updated ${lastExp.title} to ₹${newAmount}.`;
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
    const fallbackAnswer = `I'm Nova, your financial assistant. Try saying "Hey Nova, I spent 100 on samosas" or "Hey Nova, what's my balance?"`;
    return res.status(200).json({
      spokenResponse: parsedIntent.clarificationQuestion || fallbackAnswer,
      textResponse: parsedIntent.clarificationQuestion || fallbackAnswer,
      action: 'general_response',
      success: true,
      latencyMs: Date.now() - startTime
    });

  } catch (err) {
    console.error('Nova Agent error:', err);
    return res.status(500).json({
      spokenResponse: "I couldn't complete that right now. Please try again.",
      textResponse: "I couldn't complete that right now. Please try again.",
      error: err.message,
      success: false
    });
  }
};
