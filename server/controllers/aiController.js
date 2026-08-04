import fs from 'fs';
import path from 'path';
import Tesseract from 'tesseract.js';
import { Transaction, Budget, Goal, Wallet } from '../models/models.js';

// Pre-defined local rules for AI categorization
const categoryMap = {
  pizza: 'Food',
  burger: 'Food',
  mcdonald: 'Food',
  starbucks: 'Food',
  restaurant: 'Food',
  cafe: 'Food',
  swiggy: 'Food',
  zomato: 'Food',
  groceries: 'Food',
  supermarket: 'Food',
  uber: 'Travel',
  ola: 'Travel',
  metro: 'Travel',
  flight: 'Travel',
  train: 'Travel',
  petrol: 'Fuel',
  diesel: 'Fuel',
  cng: 'Fuel',
  shell: 'Fuel',
  amazon: 'Shopping',
  flipkart: 'Shopping',
  myntra: 'Shopping',
  zara: 'Shopping',
  'h&m': 'Shopping',
  walmart: 'Shopping',
  netflix: 'Bills',
  spotify: 'Bills',
  electricity: 'Bills',
  water: 'Bills',
  gas: 'Bills',
  broadband: 'Bills',
  hospital: 'Medical',
  pharmacy: 'Medical',
  doctor: 'Medical',
  medicine: 'Medical',
  college: 'Education',
  school: 'Education',
  udemy: 'Education',
  coursera: 'Education',
  investment: 'Investment',
  mutual: 'Investment',
  stock: 'Investment',
  crypto: 'Investment',
  bitcoin: 'Investment'
};

export const autoCategorize = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required.' });

    const lowerTitle = title.toLowerCase();
    let category = 'Other';

    for (const key in categoryMap) {
      if (lowerTitle.includes(key)) {
        category = categoryMap[key];
        break;
      }
    }

    res.status(200).json({ category });
  } catch (err) {
    res.status(500).json({ message: 'Error in auto-categorization.', error: err.message });
  }
};

// Call Gemini API helper
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error: ${errText}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text;
}

export const getAiAdvisorFeedback = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user context
    const transactions = await Transaction.find({ userId });
    const budgets = await Budget.find({ userId });
    const goals = await Goal.find({ userId });
    const wallets = await Wallet.find({ userId });

    // Format transaction digest
    const recentTrans = transactions
      .slice(0, 50)
      .map(t => `${t.date}: ${t.title} (${t.type}) - ₹${t.amount} [${t.category || 'Other'}]`)
      .join('\n');

    const budgetStatus = budgets
      .map(b => `${b.category} Budget: ₹${b.amount}, Spent: ₹${b.spent || 0}`)
      .join('\n');

    const goalsStatus = goals
      .map(g => `Goal: ${g.name}, Target: ₹${g.targetAmount}, Saved: ₹${g.currentAmount}`)
      .join('\n');

    const walletStatus = wallets
      .map(w => `Wallet: ${w.name} (${w.type}), Balance: ₹${w.balance}`)
      .join('\n');

    const prompt = `You are "BudgetWise AI", an elite AI financial advisor. 
Analyze the user's financial details below:

[Current Wallets]
${walletStatus}

[Active Budgets]
${budgetStatus}

[Active Savings Goals]
${goalsStatus}

[Recent Transactions (up to 50)]
${recentTrans}

Task:
1. Conduct a detailed analysis of their expenses.
2. Spot excessive/unnecessary spending.
3. Suggest concrete monthly savings opportunities with estimated amounts.
4. Give specific advice on meeting their active goals.
5. Create a recommended budget breakdown.

Your reply MUST be formatted as a JSON object matching this structure EXACTLY:
{
  "financialScore": 0 to 100 integer,
  "expenseAnalysis": "a detailed text summary of findings",
  "savingsOpportunities": [
    { "area": "Category", "potentialSavings": 1500, "recommendation": "detailed actionable text" }
  ],
  "unnecessarySpending": [
    { "item": "specific store/item", "amount": 800, "reason": "reason why it is excessive" }
  ],
  "goalEstimations": [
    { "goalName": "iPhone", "status": "on track or needs adjustment", "timeToComplete": "estimated duration" }
  ],
  "generalTips": [
    "practical tip 1",
    "practical tip 2"
  ]
}
Return ONLY the raw JSON string. Do not include markdown code block syntax (like \`\`\`json).`;

    let feedbackJson;
    try {
      const responseText = await callGemini(prompt);
      // Clean up markdown markers if Gemini returned them anyway
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      feedbackJson = JSON.parse(cleaned);
    } catch (err) {
      console.warn('Gemini API failed:', err.message);
      
      if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
        return res.status(500).json({ 
          message: 'Gemini API call failed with your API Key. Please verify if your key is correct.',
          error: err.message 
        });
      }
      
      console.warn('Using fallback mock AI generator...');
      // Fallback response generator based on transaction values
      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const foodExpense = transactions
        .filter(t => t.type === 'expense' && t.category === 'Food')
        .reduce((sum, t) => sum + t.amount, 0);

      const foodPercent = totalExpense > 0 ? ((foodExpense / totalExpense) * 100) : 0;

      feedbackJson = {
        financialScore: 72,
        expenseAnalysis: `Based on your recent transactions, you logged ₹${totalExpense} in expenses. ${foodPercent > 30 ? `Your food expenses make up ${foodPercent.toFixed(0)}% of your budget, which is higher than the recommended 15-20%.` : 'Your category balances look stable, but there is room for optimized savings.'}`,
        savingsOpportunities: [
          {
            area: 'Food & Dining',
            potentialSavings: Math.round(foodExpense * 0.2) || 1500,
            recommendation: 'Reduce food delivery orders by cooking at home two extra days per week.'
          },
          {
            area: 'Subscriptions',
            potentialSavings: 500,
            recommendation: 'Audit your entertainment subscriptions. Consider pausing platforms you haven\'t watched this month.'
          }
        ],
        unnecessarySpending: [
          {
            item: 'Outside snacks & coffees',
            amount: 750,
            reason: 'Frequent micro-transactions add up quickly. Try brewing coffee at home.'
          }
        ],
        goalEstimations: goals.map(g => ({
          goalName: g.name,
          status: g.currentAmount > g.targetAmount * 0.5 ? 'On Track' : 'Slowing down',
          timeToComplete: g.currentAmount === 0 ? 'Not started yet' : `${Math.ceil((g.targetAmount - g.currentAmount) / (totalExpense * 0.1 || 1000))} months remaining`
        })),
        generalTips: [
          'Set up automatic transfers (SIPs) to your investments right after receiving salary.',
          'Always log transfer events between bank and cash to avoid balance drifts.',
          'Review budget remaining percentages every Sunday.'
        ]
      };
    }

    res.status(200).json(feedbackJson);
  } catch (err) {
    res.status(500).json({ message: 'Error generating AI analysis.', error: err.message });
  }
};

export const scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No receipt image uploaded.' });
    }

    const imagePath = req.file.path;
    console.log(`Starting OCR scanning on ${imagePath}...`);

    // Perform Tesseract OCR
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
    console.log('OCR extracted text:', text.substring(0, 100));

    // Try deleting the temporary uploaded file
    try {
      fs.unlinkSync(imagePath);
    } catch (e) {
      console.warn('Failed to delete temp upload file:', e.message);
    }

    // Parse OCR text. If Gemini key is available, use it for perfect extraction.
    const apiKey = process.env.GEMINI_API_KEY;
    let extracted = {
      storeName: 'Unknown Store',
      amount: 0,
      gst: 0,
      date: new Date().toISOString().split('T')[0]
    };

    if (apiKey && apiKey.trim() !== '') {
      try {
        const prompt = `Extract receipt information from the raw OCR text below.
OCR Text:
${text}

Task:
Extract:
1. Store name (merchant name, e.g. Starbucks, McDonald's, Zara).
2. Total amount paid (as a float).
3. GST / Tax amount paid (as a float, 0 if not present).
4. Date of purchase (format YYYY-MM-DD, try to match the date of receipt, fall back to today if not found).

Return your response ONLY as a JSON string matching this format:
{
  "storeName": "Store Name",
  "amount": 1250.50,
  "gst": 85.00,
  "date": "2026-07-28"
}
Return ONLY the JSON string. Do not include markdown code block syntax.`;

        const geminiText = await callGemini(prompt);
        const cleaned = geminiText.replace(/```json/g, '').replace(/```/g, '').trim();
        extracted = JSON.parse(cleaned);
      } catch (err) {
        console.warn('Gemini OCR extraction failed, falling back to regex parsing.', err.message);
      }
    } else {
      // Regex pattern matching (fallback)
      // Extract numbers near words like 'total', 'grand total', 'net', 'due'
      const lines = text.split('\n');
      let foundAmount = 0;
      let foundStore = 'Market / Retailer';
      let foundGst = 0;
      
      // Look for first 3 non-empty lines for store name
      const storeCandidate = lines.map(l => l.trim()).filter(l => l.length > 3).slice(0, 2);
      if (storeCandidate.length > 0) {
        foundStore = storeCandidate[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
      }

      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('total') || lowerLine.includes('amount') || lowerLine.includes('net due')) {
          const match = line.match(/\d+(?:\.\d{2})?/);
          if (match) {
            foundAmount = parseFloat(match[0]);
          }
        }
        if (lowerLine.includes('gst') || lowerLine.includes('tax') || lowerLine.includes('cgst') || lowerLine.includes('sgst')) {
          const match = line.match(/\d+(?:\.\d{2})?/);
          if (match) {
            foundGst = parseFloat(match[0]);
          }
        }
      }

      extracted = {
        storeName: foundStore,
        amount: foundAmount || 250.00, // Fallback default
        gst: foundGst || 18.00,
        date: new Date().toISOString().split('T')[0]
      };
    }

    res.status(200).json(extracted);
  } catch (err) {
    res.status(500).json({ message: 'Error processing OCR receipt.', error: err.message });
  }
};
