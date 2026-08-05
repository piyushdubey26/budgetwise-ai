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
  Setting,
  Feedback
} from '../models/models.js';

// Helper to gain XP and Coins for Gamification
const rewardUser = async (userId, xp, coins) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    const newXp = (user.xp || 0) + xp;
    const newCoins = (user.coins || 0) + coins;
    // Simple level up calculation: every 100 XP is 1 level
    const newLevel = Math.floor(newXp / 100) + 1;
    
    await User.findByIdAndUpdate(userId, {
      xp: newXp,
      coins: newCoins,
      level: newLevel
    });
  } catch (err) {
    console.error('Failed to reward user:', err.message);
  }
};

// ==========================================
// WALLET CONTROLLERS
// ==========================================
export const getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.user.id });
    res.status(200).json(wallets);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving wallets.', error: err.message });
  }
};

export const createWallet = async (req, res) => {
  try {
    const { name, type, balance } = req.body;
    
    // Check premium limits (Free users: max 3 wallets)
    const user = await User.findById(req.user.id);
    const existingCount = await Wallet.countDocuments({ userId: req.user.id });
    
    if (!user.isPremium && existingCount >= 3) {
      return res.status(403).json({
        message: 'Free limit reached. Upgrade to Premium for unlimited wallets!'
      });
    }

    const newWallet = await Wallet.create({
      userId: req.user.id,
      name,
      type,
      balance: balance || 0
    });
    res.status(201).json(newWallet);
  } catch (err) {
    res.status(500).json({ message: 'Error creating wallet.', error: err.message });
  }
};

export const updateWallet = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, balance } = req.body;
    
    const wallet = await Wallet.findOne({ _id: id, userId: req.user.id });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found.' });

    let updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (balance !== undefined) updateData.balance = parseFloat(balance);

    const updated = await Wallet.findByIdAndUpdate(id, updateData);
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating wallet.', error: err.message });
  }
};

export const deleteWallet = async (req, res) => {
  try {
    const { id } = req.params;
    const wallet = await Wallet.findOne({ _id: id, userId: req.user.id });
    if (!wallet) return res.status(404).json({ message: 'Wallet not found.' });

    await Wallet.findByIdAndDelete(id);
    res.status(200).json({ message: 'Wallet deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting wallet.', error: err.message });
  }
};

// ==========================================
// TRANSACTION CONTROLLERS & BUDGET LOGIC
// ==========================================
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id });
    // Sort transactions by date descending
    transactions.sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00')));
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving transactions.', error: err.message });
  }
};

export const addTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date, time, location, paymentMode, notes, tags, sourceWalletId, targetWalletId } = req.body;
    const userId = req.user.id;

    if (!title || !amount || !type || !date) {
      return res.status(400).json({ message: 'Title, amount, type, and date are required.' });
    }

    const numericAmount = parseFloat(amount);

    // Sync Wallets
    if (type === 'income') {
      if (!targetWalletId) return res.status(400).json({ message: 'Target wallet required for income.' });
      const wallet = await Wallet.findById(targetWalletId);
      await Wallet.findByIdAndUpdate(targetWalletId, { balance: wallet.balance + numericAmount });
    } else if (type === 'expense') {
      if (!sourceWalletId) return res.status(400).json({ message: 'Source wallet required for expense.' });
      const wallet = await Wallet.findById(sourceWalletId);
      await Wallet.findByIdAndUpdate(sourceWalletId, { balance: wallet.balance - numericAmount });

      // Budget Calculation (updates both category-specific and overall budgets)
      const transactionMonth = date.substring(0, 7); // YYYY-MM
      const matchingBudgets = await Budget.find({
        userId,
        month: transactionMonth,
        category: { $in: [category, 'All'] },
        $or: [
          { walletId: sourceWalletId },
          { walletId: { $exists: false } },
          { walletId: null }
        ]
      });

      for (const budget of matchingBudgets) {
        const newSpent = (budget.spent || 0) + numericAmount;
        const newRemaining = budget.amount - newSpent;
        const oldUsagePercent = ((budget.spent || 0) / budget.amount) * 100;
        const newUsagePercent = (newSpent / budget.amount) * 100;

        await Budget.findByIdAndUpdate(budget._id, { spent: newSpent });

        // Alert Threshold checks (80%, 90%, 100%)
        const thresholds = [80, 90, 100];
        for (const t of thresholds) {
          if (oldUsagePercent < t && newUsagePercent >= t) {
            await Notification.create({
              userId,
              title: `⚠️ Budget Almost Finished (${t}%)`,
              message: `You have used ${newUsagePercent.toFixed(1)}% of your monthly budget for ${budget.category}. Used: ₹${newSpent}, Remaining: ₹${newRemaining}`,
              type: 'budget'
            });
          }
        }
      }
    } else if (type === 'transfer') {
      if (!sourceWalletId || !targetWalletId) {
        return res.status(400).json({ message: 'Source and target wallets are required for transfer.' });
      }
      const srcWallet = await Wallet.findById(sourceWalletId);
      const tgtWallet = await Wallet.findById(targetWalletId);
      
      await Wallet.findByIdAndUpdate(sourceWalletId, { balance: srcWallet.balance - numericAmount });
      await Wallet.findByIdAndUpdate(targetWalletId, { balance: tgtWallet.balance + numericAmount });
    }

    const transaction = await Transaction.create({
      userId,
      title,
      amount: numericAmount,
      type,
      category: type === 'transfer' ? 'Transfer' : category,
      date,
      time,
      location,
      paymentMode,
      notes,
      tags: tags || [],
      sourceWalletId,
      targetWalletId
    });

    // Reward gamification XP/coins for logging transaction
    await rewardUser(userId, 10, 5);

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Error adding transaction.', error: err.message });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const trans = await Transaction.findById(id);
    if (!trans || trans.userId !== userId) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    const numericAmount = trans.amount;

    // Rollback wallets
    if (trans.type === 'income') {
      const wallet = await Wallet.findById(trans.targetWalletId);
      if (wallet) {
        await Wallet.findByIdAndUpdate(trans.targetWalletId, { balance: wallet.balance - numericAmount });
      }
    } else if (trans.type === 'expense') {
      const wallet = await Wallet.findById(trans.sourceWalletId);
      if (wallet) {
        await Wallet.findByIdAndUpdate(trans.sourceWalletId, { balance: wallet.balance + numericAmount });
      }

      // Rollback budget for all matching budgets (category-specific and overall)
      const transactionMonth = trans.date.substring(0, 7);
      const matchingBudgets = await Budget.find({
        userId,
        month: transactionMonth,
        category: { $in: [trans.category, 'All'] },
        $or: [
          { walletId: trans.sourceWalletId },
          { walletId: { $exists: false } },
          { walletId: null }
        ]
      });
      for (const budget of matchingBudgets) {
        const newSpent = Math.max(0, (budget.spent || 0) - numericAmount);
        await Budget.findByIdAndUpdate(budget._id, { spent: newSpent });
      }
    } else if (trans.type === 'transfer') {
      const srcWallet = await Wallet.findById(trans.sourceWalletId);
      const tgtWallet = await Wallet.findById(trans.targetWalletId);
      if (srcWallet) await Wallet.findByIdAndUpdate(trans.sourceWalletId, { balance: srcWallet.balance + numericAmount });
      if (tgtWallet) await Wallet.findByIdAndUpdate(trans.targetWalletId, { balance: tgtWallet.balance - numericAmount });
    }

    await Transaction.findByIdAndDelete(id);
    res.status(200).json({ message: 'Transaction deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting transaction.', error: err.message });
  }
};

// ==========================================
// BUDGET CONTROLLERS
// ==========================================
export const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id });
    res.status(200).json(budgets);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving budgets.', error: err.message });
  }
};

export const createBudget = async (req, res) => {
  try {
    const { month, category, amount, walletId } = req.body;
    const userId = req.user.id;

    if (!month || !amount) {
      return res.status(400).json({ message: 'Month and budget amount are required.' });
    }

    // Check if budget for this month/category/wallet already exists
    const budgets = await Budget.find({ userId, month, category: category || 'All' });
    const existing = budgets.find(b => walletId ? b.walletId === walletId : !b.walletId);

    if (existing) {
      const updated = await Budget.findByIdAndUpdate(existing._id, { amount: parseFloat(amount) });
      return res.status(200).json(updated);
    }

    // Calculate current month expense for this category and wallet to pre-populate spent
    const trans = await Transaction.find({ userId, type: 'expense' });
    const categoryExpenses = trans.filter(t => {
      const transMonth = t.date.substring(0, 7);
      const categoryMatch = category ? t.category === category : true;
      const walletMatch = walletId ? t.sourceWalletId === walletId : true;
      return transMonth === month && categoryMatch && walletMatch;
    });
    const totalSpent = categoryExpenses.reduce((sum, t) => sum + t.amount, 0);

    const budgetData = {
      userId,
      month,
      category: category || 'All',
      amount: parseFloat(amount),
      spent: totalSpent
    };
    if (walletId) {
      budgetData.walletId = walletId;
    }

    const budget = await Budget.create(budgetData);

    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ message: 'Error creating budget.', error: err.message });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const budget = await Budget.findById(id);
    if (!budget || budget.userId !== userId) {
      return res.status(404).json({ message: 'Budget not found.' });
    }

    await Budget.findByIdAndDelete(id);
    res.status(200).json({ message: 'Budget deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting budget.', error: err.message });
  }
};

// ==========================================
// SAVINGS GOAL CONTROLLERS
// ==========================================
export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id });
    res.status(200).json(goals);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving goals.', error: err.message });
  }
};

export const createGoal = async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, category, dueDate } = req.body;
    
    // Check premium limits (Free users: max 2 goals)
    const user = await User.findById(req.user.id);
    const existingCount = await Goal.countDocuments({ userId: req.user.id });
    
    if (!user.isPremium && existingCount >= 2) {
      return res.status(403).json({
        message: 'Free limit reached. Upgrade to Premium for unlimited Savings Goals!'
      });
    }

    const goal = await Goal.create({
      userId: req.user.id,
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      category,
      dueDate
    });
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Error creating goal.', error: err.message });
  }
};

export const depositToGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, walletId } = req.body;
    const userId = req.user.id;

    const goal = await Goal.findById(id);
    if (!goal || goal.userId !== userId) return res.status(404).json({ message: 'Goal not found.' });

    const wallet = await Wallet.findById(walletId);
    if (!wallet || wallet.userId !== userId) return res.status(404).json({ message: 'Wallet not found.' });

    const numericAmount = parseFloat(amount);
    if (wallet.balance < numericAmount) {
      return res.status(400).json({ message: 'Insufficient wallet balance.' });
    }

    // Deduct wallet
    await Wallet.findByIdAndUpdate(walletId, { balance: wallet.balance - numericAmount });

    // Update goal
    const newCurrent = goal.currentAmount + numericAmount;
    const status = newCurrent >= goal.targetAmount ? 'completed' : 'active';
    const updatedGoal = await Goal.findByIdAndUpdate(id, { currentAmount: newCurrent, status });

    // Log a transfer transaction for bookkeeping
    await Transaction.create({
      userId,
      title: `Saved for Goal: ${goal.name}`,
      amount: numericAmount,
      type: 'expense',
      category: 'Savings',
      date: new Date().toISOString().split('T')[0],
      paymentMode: wallet.name,
      sourceWalletId: walletId
    });

    if (status === 'completed') {
      await Notification.create({
        userId,
        title: `🏆 Savings Goal Completed!`,
        message: `Congratulations! You saved ₹${goal.targetAmount} for your goal: "${goal.name}".`,
        type: 'goal'
      });
      // Gamification achievement bonus
      await rewardUser(userId, 100, 200);
    } else {
      await rewardUser(userId, 20, 5);
    }

    res.status(200).json({ goal: updatedGoal, balance: wallet.balance - numericAmount });
  } catch (err) {
    res.status(500).json({ message: 'Error updating goal.', error: err.message });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const goal = await Goal.findById(id);
    if (!goal || goal.userId !== userId) {
      return res.status(404).json({ message: 'Goal not found.' });
    }

    await Goal.findByIdAndDelete(id);
    res.status(200).json({ message: 'Goal deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting goal.', error: err.message });
  }
};

// ==========================================
// INVESTMENT CONTROLLERS
// ==========================================
export const getInvestments = async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.user.id });
    res.status(200).json(investments);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving investments.', error: err.message });
  }
};

export const addInvestment = async (req, res) => {
  try {
    const { name, type, investedAmount, currentValue, quantity } = req.body;
    const investment = await Investment.create({
      userId: req.user.id,
      name,
      type,
      investedAmount: parseFloat(investedAmount),
      currentValue: parseFloat(currentValue || investedAmount),
      quantity: parseFloat(quantity) || 0
    });
    res.status(201).json(investment);
  } catch (err) {
    res.status(500).json({ message: 'Error adding investment.', error: err.message });
  }
};

// ==========================================
// DEBTS & EMIS & BILLS & SUBSCRIPTIONS
// ==========================================
export const getDebts = async (req, res) => {
  try {
    const debts = await Debt.find({ userId: req.user.id });
    res.status(200).json(debts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching debts.', error: err.message });
  }
};

export const addDebt = async (req, res) => {
  try {
    const { personName, type, amount, dueDate, interestRate } = req.body;
    const debt = await Debt.create({
      userId: req.user.id,
      personName,
      type, // lend, borrow
      amount: parseFloat(amount),
      dueDate,
      interestRate: parseFloat(interestRate) || 0
    });
    res.status(201).json(debt);
  } catch (err) {
    res.status(500).json({ message: 'Error adding debt.', error: err.message });
  }
};

export const payDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const { walletId } = req.body;
    const userId = req.user.id;

    const debt = await Debt.findById(id);
    if (!debt || debt.userId !== userId) return res.status(404).json({ message: 'Debt record not found.' });

    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ message: 'Wallet not found.' });

    if (debt.type === 'borrow') {
      // Pay back friend: subtract from wallet
      if (wallet.balance < debt.amount) return res.status(400).json({ message: 'Insufficient wallet balance.' });
      await Wallet.findByIdAndUpdate(walletId, { balance: wallet.balance - debt.amount });
    } else {
      // Friend paid back lend: add to wallet
      await Wallet.findByIdAndUpdate(walletId, { balance: wallet.balance + debt.amount });
    }

    await Debt.findByIdAndUpdate(id, { status: 'paid' });

    // Log bookkeeping transaction
    await Transaction.create({
      userId,
      title: debt.type === 'borrow' ? `Paid Debt to ${debt.personName}` : `Received Debt from ${debt.personName}`,
      amount: debt.amount,
      type: debt.type === 'borrow' ? 'expense' : 'income',
      category: 'Debt',
      date: new Date().toISOString().split('T')[0],
      paymentMode: wallet.name,
      sourceWalletId: debt.type === 'borrow' ? walletId : undefined,
      targetWalletId: debt.type === 'lend' ? walletId : undefined
    });

    res.status(200).json({ message: 'Debt settled successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error settling debt.', error: err.message });
  }
};

export const getEmis = async (req, res) => {
  try {
    const emis = await Emi.find({ userId: req.user.id });
    res.status(200).json(emis);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching EMIs.', error: err.message });
  }
};

export const addEmi = async (req, res) => {
  try {
    const { name, totalAmount, monthlyPayment, interestRate, dueDate, walletId } = req.body;
    const emi = await Emi.create({
      userId: req.user.id,
      name,
      totalAmount: parseFloat(totalAmount),
      monthlyPayment: parseFloat(monthlyPayment),
      remainingAmount: parseFloat(totalAmount),
      interestRate: parseFloat(interestRate) || 0,
      dueDate, // 1 to 31 representing day of month
      walletId
    });
    res.status(201).json(emi);
  } catch (err) {
    res.status(500).json({ message: 'Error adding EMI.', error: err.message });
  }
};

export const getBills = async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user.id });
    res.status(200).json(bills);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bills.', error: err.message });
  }
};

export const addBill = async (req, res) => {
  try {
    const { title, amount, dueDate, category } = req.body;
    const bill = await Bill.create({
      userId: req.user.id,
      title,
      amount: parseFloat(amount),
      dueDate,
      category,
      paid: false
    });
    res.status(201).json(bill);
  } catch (err) {
    res.status(500).json({ message: 'Error adding bill.', error: err.message });
  }
};

export const payBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { walletId } = req.body;
    const userId = req.user.id;

    const bill = await Bill.findById(id);
    if (!bill || bill.userId !== userId) return res.status(404).json({ message: 'Bill not found.' });

    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ message: 'Wallet not found.' });
    if (wallet.balance < bill.amount) return res.status(400).json({ message: 'Insufficient wallet balance.' });

    await Wallet.findByIdAndUpdate(walletId, { balance: wallet.balance - bill.amount });
    await Bill.findByIdAndUpdate(id, { paid: true });

    await Transaction.create({
      userId,
      title: `Bill Paid: ${bill.title}`,
      amount: bill.amount,
      type: 'expense',
      category: bill.category || 'Bills',
      date: new Date().toISOString().split('T')[0],
      paymentMode: wallet.name,
      sourceWalletId: walletId
    });

    res.status(200).json({ message: 'Bill paid successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error paying bill.', error: err.message });
  }
};

export const getSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({ userId: req.user.id });
    res.status(200).json(subs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subscriptions.', error: err.message });
  }
};

export const addSubscription = async (req, res) => {
  try {
    const { name, amount, frequency, nextBillingDate, category } = req.body;
    const sub = await Subscription.create({
      userId: req.user.id,
      name,
      amount: parseFloat(amount),
      frequency, // monthly, yearly
      nextBillingDate,
      category,
      active: true
    });
    res.status(201).json(sub);
  } catch (err) {
    res.status(500).json({ message: 'Error adding subscription.', error: err.message });
  }
};

// ==========================================
// NOTIFICATIONS
// ==========================================
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id });
    // Sort by date descending
    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving notifications.', error: err.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    res.status(200).json({ message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification.', error: err.message });
  }
};

// ==========================================
// DASHBOARD & ANALYTICS SUMMARY
// ==========================================
export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

    const wallets = await Wallet.find({ userId });
    const transactions = await Transaction.find({ userId });
    const investments = await Investment.find({ userId });
    const debts = await Debt.find({ userId });
    const EMIs = await Emi.find({ userId });
    const budgets = await Budget.find({ userId, month: currentMonth });
    const setting = await Setting.findOne({ userId });

    // Net Worth Calculation:
    // (Sum of Wallets where type != credit_card) + (Sum of investments current value) - (Sum of debts type=borrow pending) - (Credit card dues, i.e. Wallets of type credit_card balance if credit card is positive debt or negative wallet)
    // Let's standardise: credit card balances are subtracted if they have a negative value or represent due.
    // If user has bank balance 50,000, credit card balance -10,000 (i.e. we owe 10,000). Net worth is 40,000.
    const walletSum = wallets.reduce((sum, w) => {
      // credit cards are negative impact on net worth if they have spent balances (or we can subtract credit card balance if positive depending on how user tracks it. We'll add all balances together)
      return sum + w.balance;
    }, 0);

    const investmentSum = investments.reduce((sum, inv) => sum + (inv.currentValue || inv.investedAmount), 0);
    const borrowDebtSum = debts.filter(d => d.type === 'borrow' && d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);
    const lendDebtSum = debts.filter(d => d.type === 'lend' && d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);
    const emiSum = EMIs.reduce((sum, e) => sum + (e.remainingAmount || 0), 0);

    const calculatedNetWorth = walletSum + investmentSum - borrowDebtSum - emiSum;
    const netWorth = (setting && setting.manualNetWorth !== undefined && setting.manualNetWorth !== null)
      ? setting.manualNetWorth
      : calculatedNetWorth;

    // Filter current month transactions
    const monthTrans = transactions.filter(t => t.date.substring(0, 7) === currentMonth);
    const totalIncome = monthTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = monthTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    // Savings and Savings Rate
    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.max(0, (savings / totalIncome) * 100) : 0;

    // Budget summary
    const overallBudget = budgets.find(b => b.category === 'All' && !b.walletId) || budgets.find(b => b.category === 'All');
    const budgetLimit = overallBudget ? overallBudget.amount : 0;
    const budgetSpent = overallBudget ? overallBudget.spent : totalExpense;
    const budgetRemaining = Math.max(0, budgetLimit - budgetSpent);

    res.status(200).json({
      netWorth,
      walletSum,
      investmentSum,
      borrowDebtSum,
      lendDebtSum,
      emiSum,
      monthlyIncome: totalIncome,
      monthlyExpense: totalExpense,
      monthlySavings: savings,
      savingsRate,
      budgetLimit,
      budgetSpent,
      budgetRemaining,
      walletsCount: wallets.length,
      transactionsCount: transactions.length
    });
  } catch (err) {
    res.status(500).json({ message: 'Error creating dashboard summary.', error: err.message });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, amount, type, category, date, paymentMode, notes, tags } = req.body;

    const trans = await Transaction.findById(id);
    if (!trans || trans.userId !== userId) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    const oldAmount = trans.amount;
    const newAmount = parseFloat(amount);

    // 1. Rollback old impact
    if (trans.type === 'income') {
      const wallet = await Wallet.findOne({ userId, name: trans.paymentMode });
      if (wallet) {
        await Wallet.findByIdAndUpdate(wallet._id, { balance: wallet.balance - oldAmount });
      }
    } else if (trans.type === 'expense') {
      const wallet = await Wallet.findOne({ userId, name: trans.paymentMode });
      if (wallet) {
        await Wallet.findByIdAndUpdate(wallet._id, { balance: wallet.balance + oldAmount });
      }
      // Rollback budgets (both category-specific and overall)
      const transactionMonth = trans.date.substring(0, 7);
      const matchingBudgets = await Budget.find({
        userId,
        month: transactionMonth,
        category: { $in: [trans.category, 'All'] },
        $or: [
          { walletId: trans.sourceWalletId },
          { walletId: { $exists: false } },
          { walletId: null }
        ]
      });
      for (const budget of matchingBudgets) {
        await Budget.findByIdAndUpdate(budget._id, { spent: Math.max(0, (budget.spent || 0) - oldAmount) });
      }
    }

    // 2. Apply new impact
    if (type === 'income') {
      const wallet = await Wallet.findOne({ userId, name: paymentMode });
      if (wallet) {
        await Wallet.findByIdAndUpdate(wallet._id, { balance: wallet.balance + newAmount });
      }
    } else if (type === 'expense') {
      const wallet = await Wallet.findOne({ userId, name: paymentMode });
      if (wallet) {
        await Wallet.findByIdAndUpdate(wallet._id, { balance: wallet.balance - newAmount });
      }
      // Apply new budgets (both category-specific and overall)
      const transactionMonth = date.substring(0, 7);
      const newWallet = await Wallet.findOne({ userId, name: paymentMode });
      const newWalletId = newWallet ? newWallet._id : null;
      const matchingBudgets = await Budget.find({
        userId,
        month: transactionMonth,
        category: { $in: [category, 'All'] },
        $or: [
          ...(newWalletId ? [{ walletId: newWalletId }] : []),
          { walletId: { $exists: false } },
          { walletId: null }
        ]
      });
      for (const budget of matchingBudgets) {
        await Budget.findByIdAndUpdate(budget._id, { spent: (budget.spent || 0) + newAmount });
      }
    }

    // 3. Update transaction document
    const updated = await Transaction.findByIdAndUpdate(id, {
      title,
      amount: newAmount,
      type,
      category,
      date,
      paymentMode,
      notes,
      tags: tags || []
    });

    res.status(200).json({ message: 'Transaction updated successfully.', transaction: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error updating transaction.', error: err.message });
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    const userName = user ? user.name : 'Unknown User';

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required.' });
    }

    const feedback = await Feedback.create({
      userId,
      userName,
      rating: parseInt(rating),
      comment
    });

    res.status(201).json({ message: 'Feedback submitted successfully.', feedback });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting feedback.', error: err.message });
  }
};

export const getMyFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.user.id });
    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching feedback history.', error: err.message });
  }
};
