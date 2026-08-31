import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  CreditCard, 
  UserPlus, 
  ArrowRight,
  Percent,
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react';
import axios from 'axios';

export default function BillsSubscriptions({ refresh }) {
  const { subscriptions, bills, emis, debts, wallets } = useSelector(state => state.finance);
  const [activeTab, setActiveTab] = useState('subs'); // subs, bills, emis, debts

  // Modals state
  const [showAddSub, setShowAddSub] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [showAddEmi, setShowAddEmi] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // Active item tracking for payment settlement
  const [paymentTarget, setPaymentTarget] = useState(null); // { type: 'bill'|'debt', id: '' }
  const [payWalletId, setPayWalletId] = useState('');

  // Form states
  const [subForm, setSubForm] = useState({ name: '', amount: '', frequency: 'monthly', nextBillingDate: '', category: 'Entertainment' });
  const [billForm, setBillForm] = useState({ title: '', amount: '', dueDate: '', category: 'Bills' });
  const [emiForm, setEmiForm] = useState({ name: '', totalAmount: '', monthlyPayment: '', interestRate: '', dueDate: '5', walletId: '' });
  const [debtForm, setDebtForm] = useState({ personName: '', type: 'borrow', amount: '', dueDate: '', interestRate: '0' });

  const handlePaySetup = (type, item) => {
    setPaymentTarget({ type, item });
    setPayWalletId(wallets[0]?._id || '');
    setShowPayModal(true);
  };

  const handleSettlePayment = async (e) => {
    e.preventDefault();
    if (!paymentTarget) return;
    try {
      const { type, item } = paymentTarget;
      if (type === 'bill') {
        await axios.post(`/api/bills/${item._id}/pay`, { walletId: payWalletId });
      } else if (type === 'debt') {
        await axios.post(`/api/debts/${item._id}/pay`, { walletId: payWalletId });
      }
      setShowPayModal(false);
      setPaymentTarget(null);
      if (refresh) refresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment settlement failed');
    }
  };

  const handleAddSub = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/subscriptions', subForm);
      setShowAddSub(false);
      setSubForm({ name: '', amount: '', frequency: 'monthly', nextBillingDate: '', category: 'Entertainment' });
      if (refresh) refresh();
    } catch (err) {
      alert('Failed to add subscription');
    }
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/bills', billForm);
      setShowAddBill(false);
      setBillForm({ title: '', amount: '', dueDate: '', category: 'Bills' });
      if (refresh) refresh();
    } catch (err) {
      alert('Failed to add bill');
    }
  };

  const handleAddEmi = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/emis', emiForm);
      setShowAddEmi(false);
      setEmiForm({ name: '', totalAmount: '', monthlyPayment: '', interestRate: '', dueDate: '5', walletId: wallets[0]?._id || '' });
      if (refresh) refresh();
    } catch (err) {
      alert('Failed to add EMI');
    }
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/debts', debtForm);
      setShowAddDebt(false);
      setDebtForm({ personName: '', type: 'borrow', amount: '', dueDate: '', interestRate: '0' });
      if (refresh) refresh();
    } catch (err) {
      alert('Failed to add debt');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Sub Header Tab controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-2 p-1 bg-slate-950/80 rounded-xl border border-white/5 shadow-inner">
          <button 
            onClick={() => setActiveTab('subs')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'subs' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Subscriptions
          </button>
          <button 
            onClick={() => setActiveTab('bills')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'bills' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Utility Bills
          </button>
          <button 
            onClick={() => setActiveTab('emis')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'emis' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            EMIs
          </button>
          <button 
            onClick={() => setActiveTab('debts')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'debts' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Debts (Borrow/Lend)
          </button>
        </div>

        <div className="flex gap-2">
          {activeTab === 'subs' && (
            <button 
              onClick={() => setShowAddSub(true)} 
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold px-3.5 py-2 rounded-xl text-white shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Subscription
            </button>
          )}

          {activeTab === 'bills' && (
            <button 
              onClick={() => setShowAddBill(true)} 
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold px-3.5 py-2 rounded-xl text-white shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add Bill
            </button>
          )}

          {activeTab === 'emis' && (
            <button 
              onClick={() => setShowAddEmi(true)} 
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold px-3.5 py-2 rounded-xl text-white shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" /> Add EMI
            </button>
          )}

          {activeTab === 'debts' && (
            <button 
              onClick={() => setShowAddDebt(true)} 
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold px-3.5 py-2 rounded-xl text-white shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add Debt Log
            </button>
          )}
        </div>
      </div>

      {/* ==========================================
          TAB 1: SUBSCRIPTIONS
          ========================================== */}
      {activeTab === 'subs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-xs text-gray-500 font-bold">
              No active subscriptions tracked (Netflix, Spotify, Prime etc).
            </div>
          ) : (
            subscriptions.map(sub => (
              <div key={sub._id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-36">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-bold text-white block">{sub.name}</span>
                    <span className="text-[10px] text-gray-400">Freq: {sub.frequency}</span>
                  </div>
                  <span className="text-sm font-extrabold text-brand-purple">₹{sub.amount}/mo</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-white/5 pt-3">
                  <span>Next billing: {sub.nextBillingDate}</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Active AutoPay</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ==========================================
          TAB 2: UTILITY BILLS
          ========================================== */}
      {activeTab === 'bills' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bills.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-xs text-gray-500 font-bold">
              No bills registered yet (Gas, Phone, Rent, Credit Card).
            </div>
          ) : (
            bills.map(bill => (
              <div key={bill._id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-36 border-l-4 border-rose-400">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-bold text-white block">{bill.title}</span>
                    <span className="text-[10px] text-gray-400">Due: {bill.dueDate}</span>
                  </div>
                  <span className="text-sm font-extrabold text-white">₹{bill.amount}</span>
                </div>

                <div className="flex justify-between items-center mt-4">
                  {bill.paid ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">Paid</span>
                  ) : (
                    <>
                      <span className="text-[9px] text-rose-400 font-bold">Pending Due</span>
                      <button 
                        onClick={() => handlePaySetup('bill', bill)}
                        className="px-3 py-1 bg-slate-900 border border-white/10 hover:bg-slate-800 text-[10px] font-bold text-white rounded-lg transition-all"
                      >
                        Settle Bill
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ==========================================
          TAB 3: EMIS
          ========================================== */}
      {activeTab === 'emis' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {emis.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-xs text-gray-500 font-bold">
              No active EMI loans tracked (Laptop EMI, Bike EMI, Education Loan).
            </div>
          ) : (
            emis.map(emi => {
              const progress = Math.round((1 - (emi.remainingAmount / emi.totalAmount)) * 100);
              return (
                <div key={emi._id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-48 border-t-2 border-brand-indigo">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-bold text-white block">{emi.name}</span>
                      <span className="text-[10px] text-gray-400">Interest: {emi.interestRate}% | Due: Day {emi.dueDate}</span>
                    </div>
                    <span className="text-xs font-bold text-brand-purple">₹{emi.monthlyPayment}/mo</span>
                  </div>

                  <div className="my-3">
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-brand-purple" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Owed: ₹{emi.remainingAmount?.toLocaleString()}</span>
                      <span>Total: ₹{emi.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-500 text-center font-bold bg-slate-950/60 py-1.5 rounded-lg">
                    {progress}% Debt Repaid
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ==========================================
          TAB 4: DEBTS (LEND/BORROW)
          ========================================== */}
      {activeTab === 'debts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {debts.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-xs text-gray-500 font-bold">
              No friendly borrowing or lending logged.
            </div>
          ) : (
            debts.map(d => {
              const isBorrow = d.type === 'borrow';
              const isPaid = d.status === 'paid';
              return (
                <div 
                  key={d._id} 
                  className={`glass-panel p-6 rounded-2xl flex flex-col justify-between h-40 border-l-4 ${
                    isPaid ? 'border-gray-500 opacity-60' : isBorrow ? 'border-rose-400' : 'border-emerald-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-bold text-white block">{d.personName}</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        {isBorrow ? 'Friend se liya' : 'Friend ko diya'}
                      </span>
                    </div>
                    <span className="text-sm font-extrabold text-white">₹{d.amount}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-3">
                    <span className="text-[10px] text-gray-500">Due: {d.dueDate || 'Open'}</span>
                    {isPaid ? (
                      <span className="text-[10px] font-bold text-gray-400 bg-slate-800 px-2 py-0.5 rounded">Settled</span>
                    ) : (
                      <button 
                        onClick={() => handlePaySetup('debt', d)}
                        className="px-3 py-1 bg-slate-900 border border-white/10 hover:bg-slate-800 text-[10px] font-bold text-white rounded-lg transition-all"
                      >
                        {isBorrow ? 'Pay Friend' : 'Settle Debt'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ==========================================
          MODALS
          ========================================== */}
      
      {/* Pay Settle Modal (Unified select wallet) */}
      <AnimatePresence>
        {showPayModal && paymentTarget && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <span className="font-bold text-sm text-white">Settle Payment</span>
                <button onClick={() => {
                  setShowPayModal(false);
                  setPaymentTarget(null);
                }} className="p-1 rounded-lg text-gray-400 hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleSettlePayment} className="p-6 space-y-4">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 text-xs text-gray-300">
                  <span className="block font-bold text-white">Item: {paymentTarget.item.title || paymentTarget.item.personName}</span>
                  <span className="block mt-1">Amount: ₹{paymentTarget.item.amount}</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Select Debit Wallet</label>
                  <select 
                    required
                    value={payWalletId}
                    onChange={e => setPayWalletId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">Select wallet</option>
                    {wallets.map(w => <option key={w._id} value={w._id}>{w.name} (₹{w.balance})</option>)}
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Confirm & Deduct Balance
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Subscription Modal */}
      <AnimatePresence>
        {showAddSub && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <span className="font-bold text-sm text-white">Add Subscription</span>
                <button onClick={() => setShowAddSub(false)} className="p-1 rounded-lg text-gray-400 hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleAddSub} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Provider Name</label>
                  <input 
                    type="text" required placeholder="Netflix, Spotify..."
                    value={subForm.name} onChange={e => setSubForm({ ...subForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Amount (₹)</label>
                    <input 
                      type="number" required placeholder="199"
                      value={subForm.amount} onChange={e => setSubForm({ ...subForm, amount: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Frequency</label>
                    <select 
                      value={subForm.frequency} onChange={e => setSubForm({ ...subForm, frequency: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Next Billing Date</label>
                  <input 
                    type="date" required
                    value={subForm.nextBillingDate} onChange={e => setSubForm({ ...subForm, nextBillingDate: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Create Auto-Billing
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Bill Modal */}
      <AnimatePresence>
        {showAddBill && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <span className="font-bold text-sm text-white">Add Pending Bill</span>
                <button onClick={() => setShowAddBill(false)} className="p-1 rounded-lg text-gray-400 hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleAddBill} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Bill Title</label>
                  <input 
                    type="text" required placeholder="Electricity Bill, Gas, Phone..."
                    value={billForm.title} onChange={e => setBillForm({ ...billForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Amount (₹)</label>
                    <input 
                      type="number" required placeholder="1200"
                      value={billForm.amount} onChange={e => setBillForm({ ...billForm, amount: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Due Date</label>
                    <input 
                      type="date" required
                      value={billForm.dueDate} onChange={e => setBillForm({ ...billForm, dueDate: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Create Bill Log
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add EMI Modal */}
      <AnimatePresence>
        {showAddEmi && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <span className="font-bold text-sm text-white">Add EMI Track</span>
                <button onClick={() => setShowAddEmi(false)} className="p-1 rounded-lg text-gray-400 hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleAddEmi} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Item Loan Name</label>
                  <input 
                    type="text" required placeholder="Laptop Loan, Car EMI..."
                    value={emiForm.name} onChange={e => setEmiForm({ ...emiForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Total Loan Amount (₹)</label>
                    <input 
                      type="number" required placeholder="75000"
                      value={emiForm.totalAmount} onChange={e => setEmiForm({ ...emiForm, totalAmount: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Monthly Cost (₹)</label>
                    <input 
                      type="number" required placeholder="5000"
                      value={emiForm.monthlyPayment} onChange={e => setEmiForm({ ...emiForm, monthlyPayment: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Interest Rate (%)</label>
                    <input 
                      type="number" placeholder="8.5"
                      value={emiForm.interestRate} onChange={e => setEmiForm({ ...emiForm, interestRate: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Due Day (1-31)</label>
                    <input 
                      type="number" required min="1" max="31" placeholder="5"
                      value={emiForm.dueDate} onChange={e => setEmiForm({ ...emiForm, dueDate: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Linked Pay Wallet</label>
                  <select 
                    required
                    value={emiForm.walletId}
                    onChange={e => setEmiForm({ ...emiForm, walletId: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="">Select funding source</option>
                    {wallets.map(w => <option key={w._id} value={w._id}>{w.name} (₹{w.balance})</option>)}
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Create Auto EMI
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Debt Modal */}
      <AnimatePresence>
        {showAddDebt && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <span className="font-bold text-sm text-white">Create Debt Log</span>
                <button onClick={() => setShowAddDebt(false)} className="p-1 rounded-lg text-gray-400 hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleAddDebt} className="p-6 space-y-4">
                
                {/* Lend vs Borrow toggle */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setDebtForm({ ...debtForm, type: 'borrow' })}
                    className={`py-2 text-xs font-bold rounded-lg ${debtForm.type === 'borrow' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-gray-400'}`}
                  >
                    Borrow (Taken)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setDebtForm({ ...debtForm, type: 'lend' })}
                    className={`py-2 text-xs font-bold rounded-lg ${debtForm.type === 'lend' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400'}`}
                  >
                    Lend (Given)
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Friend Name</label>
                  <input 
                    type="text" required placeholder="Aarav, Piyush..."
                    value={debtForm.personName} onChange={e => setDebtForm({ ...debtForm, personName: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Amount (₹)</label>
                    <input 
                      type="number" required placeholder="5000"
                      value={debtForm.amount} onChange={e => setDebtForm({ ...debtForm, amount: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Due Date</label>
                    <input 
                      type="date" required
                      value={debtForm.dueDate} onChange={e => setDebtForm({ ...debtForm, dueDate: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
                >
                  Log Debt
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
