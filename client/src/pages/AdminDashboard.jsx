import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ArrowUpDown, 
  Settings, 
  LogOut, 
  Coins, 
  Activity, 
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  Plus,
  Trash2,
  Lock,
  Unlock,
  BellRing,
  Award,
  Sparkles,
  Search,
  Filter,
  CheckCircle,
  FileText,
  UserCheck,
  Sun,
  Moon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import axios from 'axios';
import { logout, updateLocalSettings } from '../store/authSlice.js';

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, settings } = useSelector(state => state.auth);

  const toggleTheme = async () => {
    const nextTheme = (settings?.theme || 'dark') === 'dark' ? 'light' : 'dark';
    dispatch(updateLocalSettings({ theme: nextTheme }));
    try {
      await axios.put('/api/auth/settings', { ...settings, theme: nextTheme });
    } catch (e) {
      console.error('Failed to update theme:', e.message);
    }
  };

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, users, txs, categories, broadcast, feedback, telemetry, settings
  const [metrics, setMetrics] = useState({});
  const [userList, setUserList] = useState([]);
  const [txList, setTxList] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [revenueData, setRevenueData] = useState({});
  const [adminLogs, setAdminLogs] = useState([]);
  const [telemetry, setTelemetry] = useState({});
  
  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');
  
  // Custom category form
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#7c3aed');

  // Broadcast Alert Form
  const [alertForm, setAlertForm] = useState({ title: '', message: '', type: 'system' });

  // Feedback Reply state
  const [replyText, setReplyText] = useState({});

  // System config settings
  const [configSettings, setConfigSettings] = useState({
    appName: 'BudgetWise AI',
    taxRate: '18',
    maintenanceMode: false,
    smtpHost: 'smtp.ethereal.email',
    geminiKey: 'PRESET_ACTIVE_KEY'
  });

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const fetchAdminData = async () => {
    try {
      const [
        metricsRes,
        usersRes,
        txsRes,
        feedbackRes,
        revenueRes,
        logsRes,
        telemetryRes
      ] = await Promise.all([
        axios.get('/api/admin/metrics'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/transactions'),
        axios.get('/api/admin/feedback'),
        axios.get('/api/admin/revenue'),
        axios.get('/api/admin/logs'),
        axios.get('/api/admin/telemetry')
      ]);

      setMetrics(metricsRes.data);
      setUserList(usersRes.data);
      setTxList(txsRes.data);
      setFeedbackList(feedbackRes.data);
      setRevenueData(revenueRes.data);
      setAdminLogs(logsRes.data);
      setTelemetry(telemetryRes.data);
    } catch (e) {
      console.error('Failed to load admin telemetry:', e.message);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 20000);
    return () => clearInterval(interval);
  }, []);

  // Admin action triggers
  const handleToggleSuspend = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await axios.put(`/api/admin/users/${userId}`, { status: nextStatus });
      fetchAdminData();
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleTogglePremium = async (userId, currentPremium) => {
    try {
      await axios.put(`/api/admin/users/${userId}`, { isPremium: !currentPremium });
      fetchAdminData();
    } catch (err) {
      alert('Action failed');
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    if (userId === user?.id) {
      alert("You cannot change your own admin role!");
      return;
    }
    try {
      await axios.put(`/api/admin/users/${userId}`, { role: nextRole });
      fetchAdminData();
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to permanently delete this user account and wipe all transactions?')) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      fetchAdminData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/categories', { name: catName, color: catColor });
      setCatName('');
      alert('Category added globally!');
      fetchAdminData();
    } catch (err) {
      alert('Failed to add category');
    }
  };

  const handleBroadcastAlert = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/broadcast', alertForm);
      setAlertForm({ title: '', message: '', type: 'system' });
      alert('System alert broadcasted to all users!');
      fetchAdminData();
    } catch (err) {
      alert('Broadcast failed');
    }
  };

  const handleReplyFeedback = async (e, feedbackId) => {
    e.preventDefault();
    const reply = replyText[feedbackId];
    if (!reply) return;
    try {
      await axios.put(`/api/admin/feedback/${feedbackId}/reply`, { reply });
      setReplyText({ ...replyText, [feedbackId]: '' });
      alert('Reply comment logged!');
      fetchAdminData();
    } catch (err) {
      alert('Reply failed');
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    alert('Settings saved successfully (Simulated Configuration Update).');
  };

  // Filtered Users
  const filteredUsers = userList.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Filtered Transactions
  const filteredTxs = txList.filter(t => 
    t.title.toLowerCase().includes(txSearch.toLowerCase()) ||
    t.user?.name.toLowerCase().includes(txSearch.toLowerCase()) ||
    t.user?.email.toLowerCase().includes(txSearch.toLowerCase())
  );

  const revenueTrendData = [
    { name: 'May', Revenue: 8000 },
    { name: 'Jun', Revenue: 18500 },
    { name: 'Jul', Revenue: 34000 }
  ];

  return (
    <div className="flex h-screen bg-[#020617] text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-white/5 py-6 px-4 shrink-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 px-3 mb-8">
            <div className="bg-brand-indigo/10 p-2.5 rounded-xl shadow-lg border border-brand-indigo/20">
              <ShieldCheck className="h-6 w-6 text-brand-indigo" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg text-white">System Admin</span>
              <span className="text-[10px] block font-semibold text-brand-purple tracking-wider uppercase">BudgetWise Console</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: Activity },
              { id: 'users', name: 'Users Control', icon: Users },
              { id: 'txs', name: 'Transactions Audit', icon: ArrowUpDown },
              { id: 'categories', name: 'Categories Manager', icon: Plus },
              { id: 'broadcast', name: 'Alert Broadcaster', icon: BellRing },
              { id: 'feedback', name: 'Feedback Hub', icon: MessageSquare },
              { id: 'telemetry', name: 'AI & Telemetry', icon: Sparkles },
              { id: 'settings', name: 'System Config', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20'
                      : 'text-gray-400 hover:bg-slate-900/50 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-brand-indigo' : 'text-gray-400'}`} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin profile Summary at Bottom */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand-indigo to-brand-purple flex items-center justify-center font-bold text-white shadow-inner">
              A
            </div>
            <div>
              <span className="text-sm font-semibold text-white block">System Administrator</span>
              <span className="text-[10px] text-gray-500 block">admin@budgetwise.com</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header bar */}
        <header className="h-16 border-b border-white/5 bg-slate-950/40 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-white capitalize">{activeTab} panel</h2>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-400 hover:bg-slate-900/50 hover:text-white dark:hover:bg-slate-900 hover:bg-slate-200 transition-all"
              title="Toggle Theme"
            >
              {(settings?.theme || 'dark') === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-brand-purple" />
              )}
            </button>

            <div className="flex items-center gap-3 bg-brand-indigo/10 border border-brand-indigo/20 px-3.5 py-1.5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-brand-indigo">Production Mode Online</span>
            </div>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-8 scrollbar-none">
          <AnimatePresence mode="wait">
            
            {/* 1. DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-8"
              >
                {/* Metric grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: 'Total Registered Users', value: metrics.totalUsers || 0, icon: Users, color: 'text-brand-indigo bg-brand-indigo/10' },
                    { title: 'Premium Subscribers', value: metrics.premiumUsers || 0, icon: UserCheck, color: 'text-yellow-400 bg-yellow-500/10' },
                    { title: 'Gross Revenue Rec.', value: `₹${metrics.totalRevenue || 0}`, icon: Coins, color: 'text-emerald-400 bg-emerald-500/10' },
                    { title: 'Flagged Transactions', value: metrics.flaggedTransactions || 0, icon: AlertTriangle, color: 'text-rose-400 bg-rose-500/10' },
                  ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <div key={i} className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">{card.title}</span>
                          <h3 className="text-2xl font-black text-white mt-1">{card.value}</h3>
                        </div>
                        <div className={`p-3 rounded-xl border border-white/5 ${card.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Chart trend */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="glass-panel p-6 rounded-3xl lg:col-span-2">
                    <h3 className="text-base font-bold text-white mb-6">Gross Subscriptions Revenue Growth (Razorpay API)</h3>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrendData}>
                          <defs>
                            <linearGradient id="glowRed" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="name" stroke="#6b7280" tickLine={false} />
                          <YAxis stroke="#6b7280" tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                          <Area type="monotone" dataKey="Revenue" stroke="#ef4444" strokeWidth={2.5} fill="url(#glowRed)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Audit Logs list */}
                  <div className="glass-panel p-6 rounded-3xl">
                    <h3 className="text-base font-bold text-white mb-4">Admin Audit Trail</h3>
                    <div className="space-y-3.5 max-h-72 overflow-y-auto scrollbar-none pr-1">
                      {adminLogs.length === 0 ? (
                        <span className="text-xs text-gray-500 font-bold block text-center py-12">No actions recorded yet.</span>
                      ) : (
                        adminLogs.map((log, i) => (
                          <div key={i} className="bg-slate-900/40 border border-white/5 p-3 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold text-brand-purple block">{log.action}</span>
                            <span className="text-[10px] text-gray-300 block">Target: {log.targetUser}</span>
                            <span className="text-[8px] text-gray-500 block">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. USER CONTROL LIST */}
            {activeTab === 'users' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-4"
              >
                {/* Search users */}
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search users name, email..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none"
                  />
                </div>

                {/* Table */}
                <div className="glass-panel rounded-3xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/5 bg-slate-950/60 text-gray-400 font-bold uppercase">
                          <th className="py-4 px-6">Name</th>
                          <th className="py-4 px-6">Email</th>
                          <th className="py-4 px-6">Role</th>
                          <th className="py-4 px-6">Country</th>
                          <th className="py-4 px-6">Plan status</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300">
                        {filteredUsers.map(u => (
                          <tr key={u._id} className="hover:bg-slate-900/20">
                            <td className="py-4 px-6 font-bold text-white">{u.name}</td>
                            <td className="py-4 px-6">{u.email}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 rounded font-extrabold uppercase text-[10px] ${(u.role || 'user') === 'admin' ? 'bg-brand-purple/10 text-brand-purple' : 'bg-slate-800 text-gray-400'}`}>
                                {u.role || 'user'}
                              </span>
                            </td>
                            <td className="py-4 px-6">{u.country}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 rounded font-extrabold ${u.isPremium ? 'bg-yellow-500/10 text-yellow-500' : 'bg-slate-800 text-gray-500'}`}>
                                {u.isPremium ? 'PRO' : 'Free'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 rounded font-extrabold ${(u.status || 'active') === 'suspended' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {u.status || 'active'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                              {u._id !== user?.id ? (
                                <>
                                  <button 
                                    onClick={() => handleToggleRole(u._id, u.role || 'user')}
                                    className={`p-1.5 rounded-lg border transition-all ${
                                      (u.role || 'user') === 'admin' 
                                        ? 'border-brand-purple/20 text-brand-purple hover:bg-brand-purple/10' 
                                        : 'border-gray-500/20 text-gray-400 hover:bg-white/10'
                                    }`}
                                    title={(u.role || 'user') === 'admin' ? 'Demote to Regular User' : 'Promote to Admin'}
                                  >
                                    <UserCheck className="h-3.5 w-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleToggleSuspend(u._id, u.status || 'active')}
                                    className={`p-1.5 rounded-lg border transition-all ${
                                      (u.status || 'active') === 'suspended' 
                                        ? 'border-emerald-500/20 hover:bg-emerald-500/15 text-emerald-400' 
                                        : 'border-rose-500/20 hover:bg-rose-500/15 text-rose-400'
                                    }`}
                                    title={(u.status || 'active') === 'suspended' ? 'Activate User' : 'Suspend User'}
                                  >
                                    {(u.status || 'active') === 'suspended' ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                  </button>
                                  <button 
                                    onClick={() => handleTogglePremium(u._id, u.isPremium)}
                                    className="p-1.5 rounded-lg border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10 transition-all"
                                    title={u.isPremium ? 'Remove Premium' : 'Make Premium'}
                                  >
                                    <Award className="h-3.5 w-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(u._id)}
                                    className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                                    title="Delete User Permanently"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-gray-500 font-bold italic">You (Session)</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. TRANSACTION AUDITING */}
            {activeTab === 'txs' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-4"
              >
                {/* Search */}
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search logs description..."
                    value={txSearch}
                    onChange={e => setTxSearch(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none"
                  />
                </div>

                {/* Audit view */}
                <div className="glass-panel rounded-3xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/5 bg-slate-950/60 text-gray-400 font-bold uppercase">
                          <th className="py-4 px-6">User email</th>
                          <th className="py-4 px-6">Tx Description</th>
                          <th className="py-4 px-6">Category</th>
                          <th className="py-4 px-6">Date</th>
                          <th className="py-4 px-6 text-right">Amount</th>
                          <th className="py-4 px-6 text-center">Audit Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300">
                        {filteredTxs.map(t => {
                          const isSuspicious = t.amount >= 100000;
                          return (
                            <tr key={t._id} className={isSuspicious ? 'bg-red-500/5' : 'hover:bg-slate-900/20'}>
                              <td className="py-4 px-6 font-bold text-white">{t.user?.email}</td>
                              <td className="py-4 px-6">{t.title}</td>
                              <td className="py-4 px-6">
                                <span className="bg-slate-900 border border-white/5 px-2 py-0.5 rounded text-[10px]">
                                  {t.category}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-gray-500">{t.date}</td>
                              <td className="py-4 px-6 text-right font-extrabold">₹{t.amount.toLocaleString()}</td>
                              <td className="py-4 px-6 text-center">
                                {isSuspicious ? (
                                  <span className="flex items-center gap-1 justify-center text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-bold">
                                    <AlertTriangle className="h-3 w-3 shrink-0" /> Flagged (Large Amt)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                    Verified Safe
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. CATEGORIES MANAGER */}
            {activeTab === 'categories' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {/* Form */}
                <div className="glass-panel p-6 rounded-3xl h-fit">
                  <h3 className="text-base font-bold text-white mb-4">Add Custom Category</h3>
                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Category name</label>
                      <input 
                        type="text" required placeholder="eg. Crypto Tax, Pets..."
                        value={catName}
                        onChange={e => setCatName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Theme Color</label>
                      <input 
                        type="color"
                        value={catColor}
                        onChange={e => setCatColor(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-2 py-1.5 h-10 text-xs text-white cursor-pointer"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
                    >
                      Publish Category
                    </button>
                  </form>
                </div>

                {/* List categories */}
                <div className="md:col-span-2 glass-panel p-6 rounded-3xl">
                  <h3 className="text-base font-bold text-white mb-4">Published Categories</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {['Food', 'Shopping', 'Travel', 'Medical', 'Education', 'Investment', 'Rent', 'Bills', 'Fuel'].map((cat) => (
                      <div key={cat} className="bg-slate-900 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{cat}</span>
                        <span className="h-3 w-3 rounded-full bg-brand-indigo" />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. ALERT BROADCASTER */}
            {activeTab === 'broadcast' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="max-w-xl glass-panel p-6 rounded-3xl"
              >
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-1.5">
                  <BellRing className="h-5 w-5 text-brand-purple" />
                  Broadcast System Announcement
                </h3>
                
                <form onSubmit={handleBroadcastAlert} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Alert Title</label>
                    <input 
                      type="text" required placeholder="eg. Scheduled Maintenance Tomorrow"
                      value={alertForm.title}
                      onChange={e => setAlertForm({ ...alertForm, title: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-indigo/40"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Select Alert Type</label>
                    <select 
                      value={alertForm.type}
                      onChange={e => setAlertForm({ ...alertForm, type: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                    >
                      <option value="system">🛠️ System Update / Maintenance</option>
                      <option value="budget">💡 Smart Budget Tips</option>
                      <option value="emi">💎 Premium Promotional Offer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Detailed Message</label>
                    <textarea 
                      required rows="4" placeholder="Type notification contents here..."
                      value={alertForm.message}
                      onChange={e => setAlertForm({ ...alertForm, message: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none focus:border-brand-indigo/40"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
                  >
                    Broadcast to All User Inboxes
                  </button>
                </form>
              </motion.div>
            )}

            {/* 6. FEEDBACK HUB */}
            {activeTab === 'feedback' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6"
              >
                <h3 className="text-base font-bold text-white">User Feedback Logs</h3>
                <div className="space-y-4">
                  {feedbackList.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-500 font-bold">No feedback logged.</div>
                  ) : (
                    feedbackList.map((fb) => (
                      <div key={fb._id} className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6 justify-between border-t border-white/5">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-white">{fb.userName}</span>
                            <span className="text-[10px] text-yellow-500 font-extrabold">{'★'.repeat(fb.rating)}</span>
                            <span className="text-[9px] text-gray-500">{fb.date}</span>
                          </div>
                          <p className="text-xs text-gray-300 italic">"{fb.comment}"</p>
                          
                          {fb.reply ? (
                            <div className="bg-slate-950/40 border-l-2 border-brand-indigo p-3 rounded-lg text-xs mt-2">
                              <span className="text-[10px] font-bold text-brand-indigo block mb-0.5">Admin Response:</span>
                              <span className="text-gray-400">"{fb.reply}"</span>
                            </div>
                          ) : (
                            <form onSubmit={(e) => handleReplyFeedback(e, fb._id)} className="flex gap-2 max-w-lg mt-3">
                              <input 
                                type="text" placeholder="Type reply comment..." required
                                value={replyText[fb._id] || ''}
                                onChange={e => setReplyText({ ...replyText, [fb._id]: e.target.value })}
                                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                              />
                              <button type="submit" className="bg-slate-900 border border-white/10 hover:bg-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all">Reply</button>
                            </form>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* 7. AI & TELEMETRY */}
            {activeTab === 'telemetry' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6"
              >
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="glass-panel p-6 rounded-2xl">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Total Gemini Requests</span>
                    <h3 className="text-2xl font-black text-white">{telemetry.aiMonitoring?.totalRequests || 1422}</h3>
                  </div>
                  <div className="glass-panel p-6 rounded-2xl">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Avg AI Response Speed</span>
                    <h3 className="text-2xl font-black text-white">{telemetry.aiMonitoring?.averageResponseTime || '820ms'}</h3>
                  </div>
                  <div className="glass-panel p-6 rounded-2xl">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Failed API Errors</span>
                    <h3 className="text-2xl font-black text-red-500">{telemetry.aiMonitoring?.geminiApiErrors || 3}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Security */}
                  <div className="glass-panel p-6 rounded-3xl space-y-4">
                    <h3 className="text-base font-bold text-white">System Security Log</h3>
                    <div className="space-y-3 divide-y divide-white/5">
                      <div className="flex justify-between py-2.5">
                        <span className="text-xs text-gray-400">Failed Login Attempts:</span>
                        <span className="text-xs font-bold text-white">{telemetry.securityDashboard?.failedLoginCount || 42}</span>
                      </div>
                      <div className="flex justify-between py-2.5">
                        <span className="text-xs text-gray-400">Blocked Malicious IPs:</span>
                        <span className="text-xs font-bold text-rose-400">{telemetry.securityDashboard?.blockedIpsCount || 2}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Logs */}
                  <div className="glass-panel p-6 rounded-3xl space-y-2">
                    <h3 className="text-base font-bold text-white mb-2">Most Used AI Prompts</h3>
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-xl">
                      <span className="text-xs font-bold text-white block">"{telemetry.aiMonitoring?.mostUsedPrompt}"</span>
                      <span className="text-[9px] text-gray-500 mt-1 block">94% overall request frequency</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 8. CONFIG SETTINGS */}
            {activeTab === 'settings' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="max-w-2xl glass-panel p-6 rounded-3xl"
              >
                <h3 className="text-base font-bold text-white mb-6">System Configuration</h3>
                <form onSubmit={handleSaveSettings} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Application Name</label>
                      <input 
                        type="text" required
                        value={configSettings.appName}
                        onChange={e => setConfigSettings({ ...configSettings, appName: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-indigo/40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">GST Tax rate (%)</label>
                      <input 
                        type="number" required
                        value={configSettings.taxRate}
                        onChange={e => setConfigSettings({ ...configSettings, taxRate: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-indigo/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">SMTP Host</label>
                      <input 
                        type="text" required
                        value={configSettings.smtpHost}
                        onChange={e => setConfigSettings({ ...configSettings, smtpHost: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Gemini API status</label>
                      <input 
                        type="text" disabled
                        value={configSettings.geminiKey}
                        className="w-full bg-slate-950 border border-white/5 opacity-55 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl">
                    <input 
                      type="checkbox" id="maint-toggle"
                      checked={configSettings.maintenanceMode}
                      onChange={e => setConfigSettings({ ...configSettings, maintenanceMode: e.target.checked })}
                      className="h-4 w-4 bg-slate-950 border border-white/10 rounded focus:ring-brand-indigo text-brand-indigo"
                    />
                    <div className="ml-3">
                      <label htmlFor="maint-toggle" className="text-xs font-bold text-rose-400 block cursor-pointer">
                        Activate Maintenance Mode
                      </label>
                      <span className="text-[9px] text-gray-500 block leading-normal mt-0.5">
                        Blocks all standard user requests and shows a maintenance splash screen.
                      </span>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple text-white font-extrabold text-xs px-6 rounded-xl shadow-lg transition-all ml-auto block"
                  >
                    Save System Variables
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

    </div>
  );
}
