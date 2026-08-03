import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Percent,
  X
} from 'lucide-react';
import axios from 'axios';

export default function Investments({ refresh }) {
  const { investments } = useSelector(state => state.finance);
  const [showAddInv, setShowAddInv] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Mutual Fund', investedAmount: '', currentValue: '', quantity: '' });

  const handleAddInv = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/investments', form);
      setShowAddInv(false);
      setForm({ name: '', type: 'Mutual Fund', investedAmount: '', currentValue: '', quantity: '' });
      if (refresh) refresh();
    } catch (e) {
      alert('Failed to log investment');
    }
  };

  const totals = React.useMemo(() => {
    const invested = investments.reduce((sum, i) => sum + i.investedAmount, 0);
    const current = investments.reduce((sum, i) => sum + (i.currentValue || i.investedAmount), 0);
    const diff = current - invested;
    const rate = invested > 0 ? (diff / invested) * 100 : 0;
    return { invested, current, diff, rate };
  }, [investments]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-brand-indigo dark:from-white dark:via-slate-100 dark:to-brand-indigo bg-clip-text text-transparent">
            Investment Portfolio
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Track stocks, mutual funds, gold, crypto, FDs, and watch your net value grow.
          </p>
        </div>

        <button 
          onClick={() => setShowAddInv(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shadow transition-all"
        >
          <Plus className="h-4 w-4" /> Add Asset Log
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Total Invested Capital</span>
          <h3 className="text-2xl font-bold text-white">₹{totals.invested.toLocaleString()}</h3>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Current Valuation</span>
          <h3 className="text-2xl font-bold text-white">₹{totals.current.toLocaleString()}</h3>
        </div>

        <div className={`glass-panel p-6 rounded-2xl border-l-4 ${totals.diff >= 0 ? 'border-emerald-400' : 'border-rose-400'}`}>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Net Gain / Loss</span>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-white">
              ₹{totals.diff.toLocaleString()}
            </h3>
            <span className={`text-xs font-bold flex items-center ${totals.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totals.diff >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
              {totals.rate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Assets Breakdown */}
      <div className="glass-panel rounded-3xl overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-slate-950/60 text-xs font-bold text-gray-400 uppercase">
                <th className="py-4 px-6">Asset Name</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6 text-right">Invested Value</th>
                <th className="py-4 px-6 text-right">Current Value</th>
                <th className="py-4 px-6 text-right">Profit / Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {investments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500 text-xs font-semibold">
                    No investment records logged. Start logging mutual funds, stocks, gold, or crypto.
                  </td>
                </tr>
              ) : (
                investments.map(i => {
                  const gain = i.currentValue - i.investedAmount;
                  const rate = i.investedAmount > 0 ? (gain / i.investedAmount) * 100 : 0;
                  return (
                    <tr key={i._id} className="hover:bg-slate-900/20 transition-all">
                      <td className="py-4 px-6 font-bold text-white">{i.name}</td>
                      <td className="py-4 px-6">
                        <span className="text-xs bg-slate-900 border border-white/5 px-2.5 py-1 rounded-full font-bold text-brand-purple">
                          {i.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">₹{i.investedAmount.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right">₹{i.currentValue.toLocaleString()}</td>
                      <td className={`py-4 px-6 text-right font-bold ${gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₹{gain.toLocaleString()} ({rate.toFixed(1)}%)
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Investment Modal */}
      <AnimatePresence>
        {showAddInv && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <span className="font-bold text-sm text-white">Log Asset Investment</span>
                <button onClick={() => setShowAddInv(false)} className="p-1 rounded-lg text-gray-400 hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleAddInv} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Asset Name</label>
                  <input 
                    type="text" required placeholder="Nifty 50 Index Fund, Bitcoin..."
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Asset Type</label>
                  <select 
                    value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="Mutual Fund">Mutual Fund</option>
                    <option value="Stocks">Stocks</option>
                    <option value="Crypto">Crypto</option>
                    <option value="Gold">Gold</option>
                    <option value="FD">FD (Fixed Deposit)</option>
                    <option value="PPF">PPF</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Invested Capital (₹)</label>
                    <input 
                      type="number" required placeholder="10000"
                      value={form.investedAmount} onChange={e => setForm({ ...form, investedAmount: parseFloat(e.target.value) || '' })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Current Valuation (₹)</label>
                    <input 
                      type="number" required placeholder="12500"
                      value={form.currentValue} onChange={e => setForm({ ...form, currentValue: parseFloat(e.target.value) || '' })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                >
                  Confirm Asset Purchase
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
