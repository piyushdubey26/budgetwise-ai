import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  wallets: [],
  transactions: [],
  budgets: [],
  goals: [],
  investments: [],
  debts: [],
  emis: [],
  bills: [],
  subscriptions: [],
  notifications: [],
  summary: {
    netWorth: 0,
    walletSum: 0,
    investmentSum: 0,
    borrowDebtSum: 0,
    lendDebtSum: 0,
    emiSum: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlySavings: 0,
    savingsRate: 0,
    budgetLimit: 0,
    budgetSpent: 0,
    budgetRemaining: 0,
  },
  loading: false,
  error: null
};

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {
    financeStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    financeFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setWallets: (state, action) => {
      state.wallets = action.payload;
    },
    setTransactions: (state, action) => {
      state.transactions = action.payload;
    },
    setBudgets: (state, action) => {
      state.budgets = action.payload;
    },
    setGoals: (state, action) => {
      state.goals = action.payload;
    },
    setInvestments: (state, action) => {
      state.investments = action.payload;
    },
    setDebts: (state, action) => {
      state.debts = action.payload;
    },
    setEmis: (state, action) => {
      state.emis = action.payload;
    },
    setBills: (state, action) => {
      state.bills = action.payload;
    },
    setSubscriptions: (state, action) => {
      state.subscriptions = action.payload;
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    setSummary: (state, action) => {
      state.summary = action.payload;
      state.loading = false;
    },
    addTransactionLocal: (state, action) => {
      state.transactions.unshift(action.payload);
    },
    addWalletLocal: (state, action) => {
      state.wallets.push(action.payload);
    },
    addBudgetLocal: (state, action) => {
      const idx = state.budgets.findIndex(b => b.category === action.payload.category && b.month === action.payload.month);
      if (idx !== -1) {
        state.budgets[idx] = action.payload;
      } else {
        state.budgets.push(action.payload);
      }
    },
    addGoalLocal: (state, action) => {
      state.goals.push(action.payload);
    },
    depositGoalLocal: (state, action) => {
      const { goalId, amount } = action.payload;
      const goal = state.goals.find(g => g._id === goalId);
      if (goal) {
        goal.currentAmount += amount;
        if (goal.currentAmount >= goal.targetAmount) {
          goal.status = 'completed';
        }
      }
    }
  }
});

export const {
  financeStart,
  financeFailure,
  setWallets,
  setTransactions,
  setBudgets,
  setGoals,
  setInvestments,
  setDebts,
  setEmis,
  setBills,
  setSubscriptions,
  setNotifications,
  setSummary,
  addTransactionLocal,
  addWalletLocal,
  addBudgetLocal,
  addGoalLocal,
  depositGoalLocal
} = financeSlice.actions;

export default financeSlice.reducer;
