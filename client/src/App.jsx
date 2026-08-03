import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';

import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import Goals from './pages/Goals.jsx';
import AiAdvisor from './pages/AiAdvisor.jsx';
import ReceiptScanner from './pages/ReceiptScanner.jsx';
import BillsSubscriptions from './pages/BillsSubscriptions.jsx';
import Investments from './pages/Investments.jsx';
import Settings from './pages/Settings.jsx';
import Admin from './pages/Admin.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

import { authSuccess, loadProfile, logout } from './store/authSlice.js';
import {
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
  setSummary
} from './store/financeSlice.js';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Set default auth headers for axios
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  const fetchUserData = async () => {
    try {
      // 1. Fetch Profile & Settings
      const profileRes = await axios.get('/api/auth/profile');
      dispatch(loadProfile(profileRes.data));

      // 2. Fetch Finance Modules
      const [
        walletsRes,
        transRes,
        budgetsRes,
        goalsRes,
        investRes,
        debtsRes,
        emisRes,
        billsRes,
        subsRes,
        notifRes,
        summaryRes
      ] = await Promise.all([
        axios.get('/api/wallets'),
        axios.get('/api/transactions'),
        axios.get('/api/budgets'),
        axios.get('/api/goals'),
        axios.get('/api/investments'),
        axios.get('/api/debts'),
        axios.get('/api/emis'),
        axios.get('/api/bills'),
        axios.get('/api/subscriptions'),
        axios.get('/api/notifications'),
        axios.get('/api/dashboard')
      ]);

      dispatch(setWallets(walletsRes.data));
      dispatch(setTransactions(transRes.data));
      dispatch(setBudgets(budgetsRes.data));
      dispatch(setGoals(goalsRes.data));
      dispatch(setInvestments(investRes.data));
      dispatch(setDebts(debtsRes.data));
      dispatch(setEmis(emisRes.data));
      dispatch(setBills(billsRes.data));
      dispatch(setSubscriptions(subsRes.data));
      dispatch(setNotifications(notifRes.data));
      dispatch(setSummary(summaryRes.data));
    } catch (err) {
      console.error('Failed to load user state:', err.message);
      if (err.response && err.response.status === 401) {
        dispatch(logout());
        navigate('/login');
      }
    }
  };

  const theme = useSelector((state) => state.auth.settings?.theme || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
      // Poll notifications every 30 seconds
      const timer = setInterval(() => {
        axios.get('/api/notifications').then(res => {
          dispatch(setNotifications(res.data));
        });
      }, 30000);
      return () => clearInterval(timer);
    }
  }, [isAuthenticated, token]);

  const { user, adminViewMode } = useSelector((state) => state.auth);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/" />} />
      
      <Route path="/" element={
        <PrivateRoute>
          {user?.role === 'admin' && adminViewMode === 'admin' ? <AdminDashboard /> : <Layout />}
        </PrivateRoute>
      }>
        <Route index element={<Dashboard refresh={fetchUserData} />} />
        <Route path="transactions" element={<Transactions refresh={fetchUserData} />} />
        <Route path="goals" element={<Goals refresh={fetchUserData} />} />
        <Route path="ai-advisor" element={<AiAdvisor />} />
        <Route path="receipt-scanner" element={<ReceiptScanner refresh={fetchUserData} />} />
        <Route path="bills-subs" element={<BillsSubscriptions refresh={fetchUserData} />} />
        <Route path="investments" element={<Investments refresh={fetchUserData} />} />
        <Route path="settings" element={<Settings refresh={fetchUserData} />} />
        <Route path="admin" element={<Admin />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

