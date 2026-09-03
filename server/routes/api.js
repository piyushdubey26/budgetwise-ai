import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { auth } from '../middleware/auth.js';
import * as authCtrl from '../controllers/authController.js';
import * as finCtrl from '../controllers/financeController.js';
import * as aiCtrl from '../controllers/aiController.js';
import * as repCtrl from '../controllers/reportController.js';
import * as novaCtrl from '../controllers/novaAgentController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

const router = express.Router();

// ==========================================
// AUTH & SETTINGS ROUTES
// ==========================================
router.post('/auth/signup', authCtrl.signup);
router.post('/auth/login', authCtrl.login);
router.post('/auth/forgot-password', authCtrl.forgotPassword);
router.post('/auth/verify-otp', authCtrl.verifyOtpAndReset);
router.post('/auth/google', authCtrl.googleLogin);
router.get('/auth/profile', auth, authCtrl.getProfile);
router.put('/auth/settings', auth, authCtrl.updateSettings);
router.post('/auth/upgrade', auth, authCtrl.upgradeToPremium);

// ==========================================
// WALLET ROUTES
// ==========================================
router.get('/wallets', auth, finCtrl.getWallets);
router.post('/wallets', auth, finCtrl.createWallet);
router.put('/wallets/:id', auth, finCtrl.updateWallet);
router.delete('/wallets/:id', auth, finCtrl.deleteWallet);

// ==========================================
// TRANSACTION ROUTES
// ==========================================
router.get('/transactions', auth, finCtrl.getTransactions);
router.post('/transactions', auth, finCtrl.addTransaction);
router.put('/transactions/:id', auth, finCtrl.updateTransaction);
router.delete('/transactions/:id', auth, finCtrl.deleteTransaction);

// ==========================================
// BUDGET ROUTES
// ==========================================
router.get('/budgets', auth, finCtrl.getBudgets);
router.post('/budgets', auth, finCtrl.createBudget);
router.delete('/budgets/:id', auth, finCtrl.deleteBudget);

// ==========================================
// SAVINGS GOAL ROUTES
// ==========================================
router.get('/goals', auth, finCtrl.getGoals);
router.post('/goals', auth, finCtrl.createGoal);
router.post('/goals/:id/deposit', auth, finCtrl.depositToGoal);
router.delete('/goals/:id', auth, finCtrl.deleteGoal);

// ==========================================
// INVESTMENT ROUTES
// ==========================================
router.get('/investments', auth, finCtrl.getInvestments);
router.post('/investments', auth, finCtrl.addInvestment);

// ==========================================
// DEBT ROUTES
// ==========================================
router.get('/debts', auth, finCtrl.getDebts);
router.post('/debts', auth, finCtrl.addDebt);
router.post('/debts/:id/pay', auth, finCtrl.payDebt);

// ==========================================
// EMI ROUTES
// ==========================================
router.get('/emis', auth, finCtrl.getEmis);
router.post('/emis', auth, finCtrl.addEmi);

// ==========================================
// BILL ROUTES
// ==========================================
router.get('/bills', auth, finCtrl.getBills);
router.post('/bills', auth, finCtrl.addBill);
router.post('/bills/:id/pay', auth, finCtrl.payBill);

// ==========================================
// SUBSCRIPTION ROUTES
// ==========================================
router.get('/subscriptions', auth, finCtrl.getSubscriptions);
router.post('/subscriptions', auth, finCtrl.addSubscription);

// ==========================================
// NOTIFICATION ROUTES
// ==========================================
router.get('/notifications', auth, finCtrl.getNotifications);
router.put('/notifications/:id', auth, finCtrl.markNotificationRead);
router.post('/feedback', auth, finCtrl.submitFeedback);
router.get('/feedback/my', auth, finCtrl.getMyFeedback);

// ==========================================
// DASHBOARD & ANALYTICS SUMMARY
// ==========================================
router.get('/dashboard', auth, finCtrl.getDashboardSummary);

// ==========================================
// AI, NOVA VOICE AGENT & OCR ROUTES
// ==========================================
router.post('/ai/nova-agent', auth, novaCtrl.processNovaCommand);
router.post('/ai/budgy-agent', auth, novaCtrl.processNovaCommand); // Legacy alias
router.post('/ai/categorize', auth, aiCtrl.autoCategorize);
router.get('/ai/advisor', auth, aiCtrl.getAiAdvisorFeedback);
router.post('/ai/scan', auth, upload.single('receipt'), aiCtrl.scanReceipt);

// ==========================================
// REPORTS ROUTES
// ==========================================
router.get('/reports/export', auth, repCtrl.exportReport);
router.post('/reports/import', auth, upload.single('statement'), repCtrl.importBankStatement);

export default router;
