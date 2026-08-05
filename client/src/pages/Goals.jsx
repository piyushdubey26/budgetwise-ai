import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Award, 
  Coins, 
  TrendingUp, 
  CheckCircle, 
  X, 
  AlertCircle,
  PiggyBank
} from 'lucide-react';
import axios from 'axios';
import { addCoinsXP } from '../store/authSlice.js';

export default function Goals({ refresh }) {
  const dispatch = useDispatch();
  const { goals, wallets } = useSelector(state => state.finance);
  const { user } = useSelector(state => state.auth);
  
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  const [goalForm, setGoalForm] = useState({ name: '', targetAmount: '', currentAmount: '', category: 'Electronics', dueDate: '' });
  const [depositForm, setDepositForm] = useState({ amount: '', walletId: '' });

  // Submitting locks to prevent double clicks
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (isCreatingGoal) return;
    setIsCreatingGoal(true);
    try {
      await axios.post('/api/goals', goalForm);
      setShowAddGoal(false);
      setGoalForm({ name: '', targetAmount: '', currentAmount: '', category: 'Electronics', dueDate: '' });
      if (refresh) refresh();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create goal');
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!selectedGoal || isDepositing) return;
    setIsDepositing(true);
    try {
      const res = await axios.post(`/api/goals/${selectedGoal._id}/deposit`, depositForm);
      
      // Update local client gamification state if goal was completed
      const depositAmt = parseFloat(depositForm.amount);
      const isCompleted = (selectedGoal.currentAmount + depositAmt) >= selectedGoal.targetAmount;
      if (isCompleted) {
        dispatch(addCoinsXP({ coins: 200, xp: 100 }));
        alert(`🏆 Savings Goal Completed! You received 200 coins and 100 XP!`);
      } else {
        dispatch(addCoinsXP({ coins: 5, xp: 20 }));
      }

      setShowDeposit(false);
      setSelectedGoal(null);
      setDepositForm({ amount: '', walletId: '' });
      if (refresh) refresh();
    } catch (e) {
      alert(e.response?.data?.message || 'Deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };

  // Gamification achievements list
  const achievements = [
    {
      id: 'no_overspend',
      name: '7 Days No Overspending',
      description: 'Spend within budgets for a full week.',
      reward: '+100 Coins',
      xpReward: '+50 XP',
      unlocked: user?.level > 1 || goals.length > 0, // mock condition
      iconColor: 'text-emerald-400 bg-emerald-500/10'
    },
    {
      id: 'goal_complete',
      name: 'Savings Goal Achieved',
      description: 'Fully save for at least one active goal.',
      reward: '+200 Coins',
      xpReward: '+100 XP',
      unlocked: goals.some(g => g.status === 'completed'),
      iconColor: 'text-amber-400 bg-amber-500/10'
    },
    {
      id: 'lakh_saved',
      name: '₹1 Lakh Saved',
      description: 'Accumulate ₹1,00,000 across your wallets.',
      reward: '+500 Coins',
      xpReward: '+300 XP',
      unlocked: wallets.reduce((sum, w) => sum + w.balance, 0) >= 100000,
      iconColor: 'text-purple-400 bg-purple-500/10'
    },
    {
      id: 'budget_master',
      name: 'Budget Master',
      description: 'Keep total expenses below 60% of set limits.',
      reward: '+150 Coins',
      xpReward: '+75 XP',
      unlocked: user?.isPremium || user?.level > 2, // mock condition
      iconColor: 'text-blue-400 bg-blue-500/10'
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="page-title">
            Savings Goals & Gamification
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Build wealth efficiently, complete quests, earn gold coins, and level up your finance rank.
          </p>
        </div>
        
        <button 
          onClick={() => setShowAddGoal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shadow shadow-brand-indigo/15 transition-all"
        >
          <Plus className="h-4 w-4" />
          Create Savings Goal
        </button>
      </div>

      {/* Grid: Goals on Left, Gamification Board on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Goals list */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-base font-bold text-white">Active Savings Goals</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.length === 0 ? (
              <div className="col-span-2 text-center py-16 bg-slate-950/40 border border-dashed border-white/10 rounded-3xl text-xs text-gray-500 font-bold">
                No active savings goals found. Click "Create Savings Goal" to launch one!
              </div>
            ) : (
              goals.map(g => {
                const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                const isCompleted = g.status === 'completed';
                return (
                  <div key={g._id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-48 border-t-2 border-brand-indigo">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-sm font-bold text-white block">{g.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest">{g.category}</span>
                        </div>
                        {isCompleted ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle className="h-3 w-3" /> Completed
                          </span>
                        ) : (
                          <span className="text-xs font-extrabold text-brand-purple">{percent}%</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">Target date: {g.dueDate || 'No Limit'}</p>
                    </div>

                    <div className="my-4">
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                        <div 
                          className={`h-full ${isCompleted ? 'bg-emerald-400' : 'bg-brand-purple'}`} 
                          style={{ width: `${percent}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[11px] font-medium text-gray-300">
                        <span>Saved: ₹{g.currentAmount.toLocaleString()}</span>
                        <span>Target: ₹{g.targetAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {!isCompleted && (
                      <button 
                        onClick={() => {
                          setSelectedGoal(g);
                          setShowDeposit(true);
                        }}
                        className="w-full py-1.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Deposit Savings
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Gamification dashboard */}
        <div className="space-y-6">
          <h3 className="text-base font-bold text-white">Achievements Board</h3>
          
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            
            {/* User Badge Status */}
            <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-white/5 shadow-inner">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-purple flex items-center justify-center font-bold text-white text-lg shadow shadow-brand-indigo/15">
                {user?.level || 1}
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-gray-300 block">Finance Level {user?.level || 1}</span>
                <span className="text-[10px] text-gray-500">XP: {user?.xp || 0} / {(user?.level || 1) * 100}</span>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-brand-purple" style={{ width: `${(user?.xp || 0) % 100}%` }} />
                </div>
              </div>
            </div>

            {/* Achievements lists */}
            <div className="space-y-3.5 pt-2">
              {achievements.map((ach) => (
                <div 
                  key={ach.id} 
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                    ach.unlocked 
                      ? 'bg-slate-900/60 border-white/10' 
                      : 'bg-slate-950/40 border-white/5 opacity-55'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${ach.iconColor}`}>
                    <Award className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{ach.name}</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5 leading-normal">{ach.description}</span>
                    <div className="flex gap-2 mt-1.5">
                      <span className="text-[9px] text-yellow-500 font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Coins className="h-2.5 w-2.5" /> {ach.reward}
                      </span>
                      <span className="text-[9px] text-brand-purple font-bold bg-brand-purple/10 px-1.5 py-0.5 rounded">
                        {ach.xpReward}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* ==========================================
          MODALS
          ========================================== */}
      
      {/* 1. Create Goal Modal */}
      <AnimatePresence>
        {showAddGoal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <span className="font-bold text-sm text-white">Create Savings Goal</span>
                <button onClick={() => setShowAddGoal(false)} className="p-1 rounded-lg text-gray-400 hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
                
                {!user?.isPremium && goals.length >= 2 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-[10px] text-amber-400 leading-snug">
                    ⚠️ Premium limit warning. Free users are capped at 2 savings goals. Upgrade in settings.
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Goal Name</label>
                  <input 
                    type="text" required placeholder="iPhone 18, Euro Trip..."
                    value={goalForm.name} onChange={e => setGoalForm({ ...goalForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Target Amount (₹)</label>
                    <input 
                      type="number" required placeholder="150000"
                      value={goalForm.targetAmount} onChange={e => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Saved So Far (₹)</label>
                    <input 
                      type="number" placeholder="0"
                      value={goalForm.currentAmount} onChange={e => setGoalForm({ ...goalForm, currentAmount: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Category</label>
                    <select 
                      value={goalForm.category} onChange={e => setGoalForm({ ...goalForm, category: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Vehicle">Vehicle</option>
                      <option value="Vacation">Vacation</option>
                      <option value="Emergency Fund">Emergency Fund</option>
                      <option value="Retirement">Retirement</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Due Date</label>
                    <input 
                      type="date" required
                      value={goalForm.dueDate} onChange={e => setGoalForm({ ...goalForm, dueDate: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isCreatingGoal}
                  className={`w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer ${
                    isCreatingGoal ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isCreatingGoal ? 'Creating Goal...' : 'Create Goal'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Deposit Savings Modal */}
      <AnimatePresence>
        {showDeposit && selectedGoal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <span className="font-bold text-sm text-white">Deposit Savings for: {selectedGoal.name}</span>
                <button onClick={() => {
                  setShowDeposit(false);
                  setSelectedGoal(null);
                }} className="p-1 rounded-lg text-gray-400 hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleDeposit} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Source Wallet</label>
                  <select 
                    required
                    value={depositForm.walletId}
                    onChange={e => setDepositForm({ ...depositForm, walletId: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">Select funding wallet</option>
                    {wallets.map(w => <option key={w._id} value={w._id}>{w.name} (₹{w.balance})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Deposit Amount (₹)</label>
                  <input 
                    type="number" required placeholder="0"
                    value={depositForm.amount} onChange={e => setDepositForm({ ...depositForm, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isDepositing}
                  className={`w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer ${
                    isDepositing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isDepositing ? 'Depositing...' : 'Approve Deposit'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
