import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  PiggyBank, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  Plus,
  Compass,
  Wallet,
  Edit3
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { updateLocalSettings } from '../store/authSlice.js';
import axios from 'axios';

const CATEGORY_COLORS = {
  Food: '#a78bfa',        // Violet
  Shopping: '#fb7185',    // Rose
  Travel: '#60a5fa',      // Blue
  Entertainment: '#f472b6',// Pink
  Medical: '#f87171',      // Red
  Education: '#fbbf24',    // Amber
  Bills: '#34d399',        // Emerald
  Rent: '#38bdf8',         // Light Blue
  Investment: '#2dd4bf',   // Teal
  Other: '#94a3b8'         // Slate
};

export default function Dashboard({ refresh }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, settings } = useSelector((state) => state.auth);
  const { summary, transactions, wallets, goals, budgets } = useSelector((state) => state.finance);
  const [heatmapDays, setHeatmapDays] = useState([]);

  const [isEditingNetWorth, setIsEditingNetWorth] = useState(false);
  const [customNetWorth, setCustomNetWorth] = useState('');

  const handleSaveNetWorth = async () => {
    const val = customNetWorth === '' ? null : Number(customNetWorth);
    try {
      await axios.put('/api/auth/settings', { manualNetWorth: val });
      dispatch(updateLocalSettings({ manualNetWorth: val }));
      setIsEditingNetWorth(false);
      if (refresh) refresh();
    } catch (e) {
      console.error('Failed to update manual Net Worth:', e.message);
      alert('Failed to update Net Worth: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleResetNetWorth = async () => {
    try {
      await axios.put('/api/auth/settings', { manualNetWorth: null });
      dispatch(updateLocalSettings({ manualNetWorth: null }));
      setIsEditingNetWorth(false);
      if (refresh) refresh();
    } catch (e) {
      console.error('Failed to reset Net Worth:', e.message);
      alert('Failed to reset Net Worth: ' + (e.response?.data?.message || e.message));
    }
  };

  useEffect(() => {
    if (refresh) refresh();
  }, []);

  // Build Daily Expense Heatmap for the last 28 days (4 weeks grid)
  useEffect(() => {
    const days = [];
    const today = new Date();
    
    // Find expenses matching dates
    const expenseMap = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        expenseMap[t.date] = (expenseMap[t.date] || 0) + t.amount;
      }
    });

    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const cost = expenseMap[dateStr] || 0;
      days.push({
        date: dateStr,
        dayNum: d.getDate(),
        month: d.toLocaleString('default', { month: 'short' }),
        cost
      });
    }
    setHeatmapDays(days);
  }, [transactions]);

  // Aggregate Category Expense Data for Doughnut Chart
  const categoryData = React.useMemo(() => {
    const categories = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'Other';
        categories[cat] = (categories[cat] || 0) + t.amount;
      });

    return Object.keys(categories).map(cat => ({
      name: cat,
      value: categories[cat],
      color: CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other
    }));
  }, [transactions]);

  // Aggregate Income vs Expense for last 4 months
  const monthlyComparisonData = React.useMemo(() => {
    const months = {};
    const today = new Date();
    
    // Initialise last 4 months
    for (let i = 3; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toISOString().substring(0, 7); // YYYY-MM
      months[key] = {
        name: d.toLocaleString('default', { month: 'short' }),
        Income: 0,
        Expense: 0
      };
    }

    transactions.forEach(t => {
      const mKey = t.date.substring(0, 7);
      if (months[mKey]) {
        if (t.type === 'income') months[mKey].Income += t.amount;
        if (t.type === 'expense') months[mKey].Expense += t.amount;
      }
    });

    return Object.values(months);
  }, [transactions]);

  // Aggregate Savings Growth trend
  const savingsTrendData = React.useMemo(() => {
    let runningSavings = 0;
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const points = [];
    const last30 = sorted.slice(-30);
    
    last30.forEach(t => {
      if (t.type === 'income') runningSavings += t.amount;
      if (t.type === 'expense') runningSavings -= t.amount;
      points.push({
        date: t.date,
        Savings: runningSavings
      });
    });

    return points.length > 0 ? points : [{ date: 'None', Savings: 0 }];
  }, [transactions]);

  // Get intensity color for Heatmap
  const getHeatmapColor = (cost) => {
    if (cost === 0) return 'bg-slate-900 border border-white/5';
    if (cost < 500) return 'bg-indigo-950/60 border border-indigo-800/20';
    if (cost < 2000) return 'bg-indigo-800/80';
    if (cost < 5000) return 'bg-indigo-600';
    return 'bg-purple-500 shadow-md shadow-purple-500/25';
  };

  const budgetProgress = summary.budgetLimit > 0 
    ? Math.min(100, (summary.budgetSpent / summary.budgetLimit) * 100) 
    : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.name} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Here's a premium review of your financial assets and expenses activity.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/transactions"
            className="flex items-center gap-2 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg shadow-brand-indigo/15 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </Link>
          <Link
            to="/ai-advisor"
            className="flex items-center gap-2 bg-slate-900 border border-white/10 hover:bg-slate-800 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
          >
            <Compass className="h-4 w-4 text-brand-purple" />
            AI Advice
          </Link>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Net Worth */}
        <motion.div 
          whileHover={!isEditingNetWorth ? { y: -4 } : {}}
          className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Net Worth</span>
            {!isEditingNetWorth && (
              <div className="p-2 bg-brand-purple/10 rounded-xl">
                <TrendingUp className="h-5 w-5 text-brand-purple" />
              </div>
            )}
          </div>
          <div>
            {isEditingNetWorth ? (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex gap-1.5">
                  <input 
                    type="number" 
                    placeholder="Value (eg. 50000)"
                    value={customNetWorth}
                    onChange={e => setCustomNetWorth(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none w-full"
                  />
                  <button 
                    onClick={handleSaveNetWorth}
                    className="bg-brand-indigo hover:bg-brand-purple px-2 py-0.5 rounded-lg text-[10px] font-bold text-white transition-all cursor-pointer"
                  >
                    Save
                  </button>
                </div>
                <div className="flex justify-between items-center text-[9px] text-gray-400 mt-0.5">
                  <button onClick={handleResetNetWorth} className="hover:text-white underline cursor-pointer">Reset to Auto</button>
                  <button onClick={() => setIsEditingNetWorth(false)} className="hover:text-white cursor-pointer">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-bold text-white mt-1">
                    ₹{summary.netWorth?.toLocaleString()}
                  </h3>
                  <span className="text-[10px] text-brand-purple font-semibold">
                    {settings?.manualNetWorth !== undefined && settings?.manualNetWorth !== null ? 'Manual Override' : 'Wallets + Investments - Debts'}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setCustomNetWorth(settings?.manualNetWorth !== undefined && settings?.manualNetWorth !== null ? settings.manualNetWorth : (summary.netWorth || ''));
                    setIsEditingNetWorth(true);
                  }}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-gray-500 hover:text-white transition-all cursor-pointer"
                  title="Edit Net Worth Manually"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Monthly Income */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-36"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Monthly Income</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <ArrowUpRight className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mt-2">
              ₹{summary.monthlyIncome?.toLocaleString()}
            </h3>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
              Current Month Total
            </span>
          </div>
        </motion.div>

        {/* Monthly Expense */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-36"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Monthly Expense</span>
            <div className="p-2 bg-rose-500/10 rounded-xl">
              <ArrowDownRight className="h-5 w-5 text-rose-400" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mt-2">
              ₹{summary.monthlyExpense?.toLocaleString()}
            </h3>
            <span className="text-[10px] text-rose-400 font-semibold">
              Current Month Total
            </span>
          </div>
        </motion.div>

        {/* Savings Rate */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-36"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Savings Rate</span>
            <div className="p-2 bg-brand-indigo/10 rounded-xl">
              <PiggyBank className="h-5 w-5 text-brand-indigo" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mt-2">
              {summary.savingsRate?.toFixed(1)}%
            </h3>
            <span className="text-[10px] text-brand-indigo font-semibold">
              ₹{summary.monthlySavings?.toLocaleString()} Saved This Month
            </span>
          </div>
        </motion.div>

      </div>

      {/* Main Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Income vs Expense (Bar Chart) */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-2">
          <h3 className="text-base font-bold text-white mb-6">Income vs Expense Trend</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Distribution (Doughnut Chart) */}
        <div className="glass-panel p-6 rounded-3xl">
          <h3 className="text-base font-bold text-white mb-6">Expense By Category</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {categoryData.length === 0 ? (
              <span className="text-xs text-gray-500">No expense records logged</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Custom Category Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 max-h-24 overflow-y-auto scrollbar-none pr-1">
            {categoryData.map(entry => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[11px] text-gray-300 truncate w-24">{entry.name}</span>
                <span className="text-[11px] font-bold text-white ml-auto">₹{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 2: Heatmap + Budget + Goal widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Heatmap Widget */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Daily Expense Activity</h3>
              <p className="text-gray-400 text-xs mt-0.5">Last 28 days spending heatmap</p>
            </div>
            <div className="flex gap-2">
              <span className="text-[9px] text-gray-500 flex items-center gap-1">Less <span className="h-2 w-2 rounded-sm bg-slate-900" /></span>
              <span className="text-[9px] text-gray-500 flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-indigo-600" /> More</span>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-3 py-2">
            {heatmapDays.map((day, i) => (
              <div 
                key={i} 
                title={`${day.date}: ₹${day.cost.toLocaleString()}`}
                className={`heatmap-cell p-2.5 flex flex-col justify-between rounded-lg cursor-pointer ${getHeatmapColor(day.cost)}`}
              >
                <span className="text-[10px] text-gray-500 font-bold block">{day.dayNum}</span>
                {day.cost > 0 && (
                  <span className="text-[8px] text-white font-extrabold block truncate mt-1">
                    ₹{day.cost > 1000 ? `${(day.cost/1000).toFixed(1)}k` : Math.round(day.cost)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Budget Limit Tracker */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-2">Monthly Budget Tracker</h3>
            <p className="text-gray-400 text-xs">Total remaining allowance this month</p>
          </div>

          {summary.budgetLimit > 0 ? (
            <div className="my-6">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs text-gray-400">Used: ₹{summary.budgetSpent?.toLocaleString()}</span>
                <span className="text-lg font-bold text-white">
                  ₹{summary.budgetRemaining?.toLocaleString()} Left
                </span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    budgetProgress >= 100 ? 'bg-rose-500' : budgetProgress >= 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-brand-indigo to-brand-purple'
                  }`}
                  style={{ width: `${budgetProgress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-gray-500">Limit: ₹{summary.budgetLimit?.toLocaleString()}</span>
                <span className="text-[10px] text-gray-500">{budgetProgress.toFixed(0)}% Used</span>
              </div>
            </div>
          ) : (
            <div className="my-6 py-4 flex flex-col items-center text-center justify-center border border-dashed border-white/10 rounded-2xl bg-slate-900/25">
              <AlertTriangle className="h-5 w-5 text-gray-500 mb-2 animate-pulse" />
              <p className="text-xs text-gray-400 font-medium px-4">
                No monthly budget limit set yet. Create a limit to track your spending allowance.
              </p>
            </div>
          )}

          {summary.budgetLimit > 0 && budgetProgress >= 90 && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-rose-400 leading-normal">
                Alert: You have exhausted over {budgetProgress.toFixed(0)}% of your set allowance. Consider pausing non-essential shopping.
              </p>
            </div>
          )}
          
          <button 
            onClick={() => navigate('/transactions?tab=budgets')} 
            className="text-xs font-bold text-brand-purple flex items-center gap-1 hover:underline mt-auto pt-4"
          >
            Manage budgets and limits <ArrowRight className="h-3 w-3" />
          </button>
        </div>

      </div>

      {/* Row 3: Wallets + Goals list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Wallets panel */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-1">
          <h3 className="text-base font-bold text-white mb-4">Active Wallets</h3>
          <div className="space-y-3">
            {wallets.slice(0, 4).map(w => (
              <div key={w._id} className="glass-card p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 p-2 rounded-lg border border-white/5">
                    <Wallet className="h-4 w-4 text-brand-purple" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{w.name}</span>
                    <span className="text-[9px] text-gray-500 uppercase">{w.type}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold ${w.balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ₹{w.balance?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Goals Panel */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-2">
          <h3 className="text-base font-bold text-white mb-4">Goal Progress Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.length === 0 ? (
              <div className="col-span-2 py-6 text-center text-xs text-gray-500">
                No active savings goals set. Create one in the Goals page!
              </div>
            ) : (
              goals.slice(0, 4).map(g => {
                const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                return (
                  <div key={g._id} className="glass-card p-4 rounded-xl flex flex-col justify-between h-28">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-bold text-white block">{g.name}</span>
                        <span className="text-[9px] text-gray-500">Target: ₹{g.targetAmount?.toLocaleString()}</span>
                      </div>
                      <span className="text-xs font-extrabold text-brand-purple">{percent}%</span>
                    </div>
                    <div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                        <div className="h-full bg-brand-purple" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">Saved: ₹{g.currentAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
