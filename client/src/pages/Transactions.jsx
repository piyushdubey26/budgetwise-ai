import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus, 
  Wallet, 
  ArrowRightLeft, 
  Settings,
  X,
  FileSpreadsheet,
  FileText,
  Edit,
  Check
} from 'lucide-react';
import axios from 'axios';

const CATEGORIES = [
  'Food', 'Shopping', 'Travel', 'Education', 'Medical', 'Fuel', 'Bills', 'Rent', 'Investment', 'Entertainment', 'Other'
];

export default function Transactions({ refresh }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { transactions, wallets, budgets } = useSelector(state => state.finance);
  const { user } = useSelector(state => state.auth);
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'list'); // list, wallets, budgets

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (location.state && location.state.prefillDate) {
      setTxForm(prev => ({
        ...prev,
        date: location.state.prefillDate
      }));
      setShowAddTx(true);
      setActiveTab('list');
    }
  }, [location.state]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  
  // Modals state
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showSetBudget, setShowSetBudget] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Loading states for form submissions to prevent double-clicks
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isSettingBudget, setIsSettingBudget] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Form states
  const [txForm, setTxForm] = useState({
    title: '', amount: '', type: 'expense', category: 'Food', 
    date: new Date().toISOString().split('T')[0], time: '', 
    location: '', paymentMode: 'cash', notes: '', tags: '',
    sourceWalletId: '', targetWalletId: ''
  });

  const [walletForm, setWalletForm] = useState({ name: '', type: 'cash', balance: 0 });
  const [transferForm, setTransferForm] = useState({ sourceWalletId: '', targetWalletId: '', amount: '' });
  const [budgetForm, setBudgetForm] = useState({ month: new Date().toISOString().substring(0, 7), category: 'All', amount: '', walletId: '' });
  const [importFile, setImportFile] = useState(null);

  // Inline editing states
  const [editingTxId, setEditingTxId] = useState(null);
  const [editForm, setEditForm] = useState({
    date: '',
    title: '',
    notes: '',
    category: '',
    paymentMode: '',
    amount: '',
    type: 'expense'
  });

  const startEditTx = (t) => {
    setEditingTxId(t._id);
    setEditForm({
      date: t.date || new Date().toISOString().split('T')[0],
      title: t.title || '',
      notes: t.notes || '',
      category: t.category || 'Food',
      paymentMode: t.paymentMode || 'Cash Wallet',
      amount: t.amount || 0,
      type: t.type || 'expense'
    });
  };

  const handleSaveEditTx = async (id) => {
    try {
      if (!editForm.title || !editForm.amount || !editForm.date) {
        alert('Date, Title and Amount are required.');
        return;
      }
      await axios.put(`/api/transactions/${id}`, {
        ...editForm,
        amount: parseFloat(editForm.amount)
      });
      setEditingTxId(null);
      if (refresh) refresh();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update transaction');
    }
  };

  const handleDeleteTx = async (id) => {
    try {
      await axios.delete(`/api/transactions/${id}`);
      if (refresh) refresh();
    } catch (e) {
      alert(e.response?.data?.message || 'Delete transaction failed');
    }
  };

  const [editingWalletId, setEditingWalletId] = useState(null);
  const [walletEditForm, setWalletEditForm] = useState({ name: '', type: 'cash', balance: '' });

  const startEditWallet = (w) => {
    setEditingWalletId(w._id);
    setWalletEditForm({ name: w.name, type: w.type, balance: w.balance.toString() });
  };

  const handleUpdateWallet = async (walletId) => {
    try {
      if (!walletEditForm.name || walletEditForm.balance === '') {
        alert('Wallet name and balance are required.');
        return;
      }
      await axios.put(`/api/wallets/${walletId}`, {
        name: walletEditForm.name,
        type: walletEditForm.type,
        balance: parseFloat(walletEditForm.balance)
      });
      setEditingWalletId(null);
      if (refresh) refresh();
    } catch (err) {
      alert('Failed to update wallet: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteWallet = async (walletId) => {
    if (!confirm('Are you sure you want to delete this wallet? This will not affect existing transactions, but they will still reference this wallet name.')) return;
    try {
      await axios.delete(`/api/wallets/${walletId}`);
      if (refresh) refresh();
    } catch (err) {
      alert('Failed to delete wallet: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddTx = async (e) => {
    e.preventDefault();
    if (isAddingTx) return;
    setIsAddingTx(true);
    try {
      const parsedTags = txForm.tags ? txForm.tags.split(',').map(t => t.trim()) : [];
      await axios.post('/api/transactions', {
        ...txForm,
        tags: parsedTags,
        // Match payment mode name
        paymentMode: txForm.type === 'income' 
          ? (wallets.find(w => w._id === txForm.targetWalletId)?.name || 'Wallet')
          : (wallets.find(w => w._id === txForm.sourceWalletId)?.name || 'Wallet')
      });
      setShowAddTx(false);
      // Reset form
      setTxForm({
        title: '', amount: '', type: 'expense', category: 'Food', 
        date: new Date().toISOString().split('T')[0], time: '', 
        location: '', paymentMode: 'cash', notes: '', tags: '',
        sourceWalletId: '', targetWalletId: ''
      });
      if (refresh) refresh();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add transaction');
    } finally {
      setIsAddingTx(false);
    }
  };

  const handleAddWallet = async (e) => {
    e.preventDefault();
    if (isAddingWallet) return;
    setIsAddingWallet(true);
    try {
      await axios.post('/api/wallets', walletForm);
      setShowAddWallet(false);
      setWalletForm({ name: '', type: 'cash', balance: 0 });
      if (refresh) refresh();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create wallet');
    } finally {
      setIsAddingWallet(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (isTransferring) return;
    setIsTransferring(true);
    try {
      await axios.post('/api/transactions', {
        title: 'Wallet Transfer',
        amount: parseFloat(transferForm.amount),
        type: 'transfer',
        category: 'Transfer',
        date: new Date().toISOString().split('T')[0],
        sourceWalletId: transferForm.sourceWalletId,
        targetWalletId: transferForm.targetWalletId
      });
      setShowTransfer(false);
      setTransferForm({ sourceWalletId: '', targetWalletId: '', amount: '' });
      if (refresh) refresh();
    } catch (e) {
      alert(e.response?.data?.message || 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    if (isSettingBudget) return;
    setIsSettingBudget(true);
    try {
      await axios.post('/api/budgets', budgetForm);
      setShowSetBudget(false);
      setBudgetForm({ month: new Date().toISOString().substring(0, 7), category: 'All', amount: '', walletId: '' });
      if (refresh) refresh();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to set budget');
    } finally {
      setIsSettingBudget(false);
    }
  };
  const handleEditBudget = (b) => {
    setBudgetForm({
      month: b.month,
      category: b.category,
      amount: b.amount.toString(),
      walletId: b.walletId || ''
    });
    setShowSetBudget(true);
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!confirm('Are you sure you want to permanently delete this budget limit?')) return;
    try {
      await axios.delete(`/api/budgets/${budgetId}`);
      if (refresh) refresh();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete budget');
    }
  };
  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile || isImporting) return;
    setIsImporting(true);
    const formData = new FormData();
    formData.append('statement', importFile);
    try {
      await axios.post('/api/reports/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowImport(false);
      setImportFile(null);
      if (refresh) refresh();
    } catch (e) {
      alert(e.response?.data?.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = (format) => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    window.open(`${apiBase}/api/reports/export?format=${format}&token=${localStorage.getItem('token') || ''}`, '_blank');
  };

  // Filtered transactions
  const filteredTx = transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          (t.category && t.category.toLowerCase().includes(search.toLowerCase())) ||
                          (t.notes && t.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter ? t.type === typeFilter : true;
    const matchesCat = catFilter ? t.category === catFilter : true;
    return matchesSearch && matchesType && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Sub Header tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-2 p-1 bg-slate-950/80 rounded-xl border border-white/5 shadow-inner">
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'list' ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            All Transactions
          </button>
          <button 
            onClick={() => setActiveTab('wallets')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'wallets' ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Wallets & Transfers
          </button>
          <button 
            onClick={() => setActiveTab('budgets')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'budgets' ? 'bg-gradient-to-r from-brand-indigo to-brand-purple text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Budgets
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'list' && (
            <>
              <button 
                onClick={() => setShowImport(true)} 
                className="flex items-center gap-1.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl text-white transition-all"
              >
                <Upload className="h-3.5 w-3.5" /> Import CSV
              </button>
              <div className="relative group">
                <button className="flex items-center gap-1.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl text-white transition-all">
                  <Download className="h-3.5 w-3.5" /> Export Reports
                </button>
                <div className="absolute right-0 mt-1 w-36 bg-slate-900 border border-white/10 rounded-xl shadow-xl hidden group-hover:block overflow-hidden z-20">
                  <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-slate-800 hover:text-white"><FileText className="h-3.5 w-3.5 text-rose-400" /> PDF Report</button>
                  <button onClick={() => handleExport('excel')} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-slate-800 hover:text-white"><FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" /> Excel Sheet</button>
                  <button onClick={() => handleExport('csv')} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-slate-800 hover:text-white"><Upload className="h-3.5 w-3.5 text-blue-400" /> CSV File</button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'wallets' && (
            <button 
              onClick={() => setShowAddWallet(true)} 
              className="flex items-center gap-1.5 bg-gradient-to-r from-brand-indigo to-brand-purple text-xs font-bold px-3.5 py-2 rounded-xl text-white shadow shadow-brand-indigo/10 hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" /> New Wallet
            </button>
          )}

          {activeTab === 'budgets' && (
            <button 
              onClick={() => setShowSetBudget(true)} 
              className="flex items-center gap-1.5 bg-gradient-to-r from-brand-indigo to-brand-purple text-xs font-bold px-3.5 py-2 rounded-xl text-white shadow shadow-brand-indigo/10 hover:brightness-110"
            >
              <Settings className="h-3.5 w-3.5" /> Set Budget
            </button>
          )}

          {activeTab === 'list' && (
            <button 
              onClick={() => setShowAddTx(true)} 
              className="flex items-center gap-1.5 bg-gradient-to-r from-brand-indigo to-brand-purple text-xs font-bold px-3.5 py-2 rounded-xl text-white shadow shadow-brand-indigo/10 hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" /> Add Transaction
            </button>
          )}
        </div>
      </div>

      {/* ==========================================
          TAB 1: TRANSACTIONS LIST
          ========================================== */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-950/40 border border-white/5 rounded-2xl">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search description, tags, notes..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 focus:border-brand-purple/40 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none text-white transition-all"
              />
            </div>
            <div>
              <select 
                value={typeFilter} 
                onChange={e => setTypeFilter(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-purple/40 cursor-pointer"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div>
              <select 
                value={catFilter} 
                onChange={e => setCatFilter(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-purple/40 cursor-pointer"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Transactions Table/Cards */}
          <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-950/60 text-xs font-bold text-gray-400 uppercase">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Description</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Payment Mode</th>
                    <th className="py-4 px-6 text-right">Amount</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredTx.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-500 font-medium text-xs">
                        No transactions matches your active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTx.map(t => {
                      const isEditing = t._id === editingTxId;
                      return (
                        <tr key={t._id} className="hover:bg-slate-900/25 transition-colors">
                          {/* Date Column */}
                          <td className="py-4 px-6 text-xs text-gray-400 whitespace-nowrap">
                            {isEditing ? (
                              <input 
                                type="date" 
                                value={editForm.date} 
                                onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                className="bg-slate-950 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none w-32"
                              />
                            ) : (
                              t.date
                            )}
                          </td>

                          {/* Description/Notes Column */}
                          <td className="py-4 px-6">
                            {isEditing ? (
                              <div className="space-y-1.5 min-w-[200px]">
                                <input 
                                  type="text" 
                                  placeholder="Description"
                                  value={editForm.title} 
                                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                  className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none w-full"
                                />
                                <input 
                                  type="text" 
                                  placeholder="Notes"
                                  value={editForm.notes} 
                                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                  className="bg-slate-950 border border-white/10 rounded px-2 py-0.5 text-[10px] text-gray-400 focus:outline-none w-full"
                                />
                              </div>
                            ) : (
                              <div>
                                <span className="font-semibold text-white block">{t.title}</span>
                                {t.notes && <span className="text-[10px] text-gray-500 block truncate w-48">{t.notes}</span>}
                                {t.tags && t.tags.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {t.tags.map(tag => (
                                      <span key={tag} className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-medium">#{tag}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Category Column */}
                          <td className="py-4 px-6">
                            {isEditing ? (
                              <select 
                                value={editForm.category} 
                                onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none w-28 cursor-pointer"
                              >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            ) : (
                              <span className="text-xs bg-slate-900 border border-white/5 px-2.5 py-1 rounded-full font-bold text-gray-300">
                                {t.category || 'Other'}
                              </span>
                            )}
                          </td>

                          {/* Payment Mode Column */}
                          <td className="py-4 px-6 text-xs text-gray-400">
                            {isEditing ? (
                              <select 
                                value={editForm.paymentMode} 
                                onChange={e => setEditForm({ ...editForm, paymentMode: e.target.value })}
                                className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none w-32 cursor-pointer"
                              >
                                {wallets.map(w => <option key={w._id} value={w.name}>{w.name}</option>)}
                                <option value="Cash Wallet">Cash Wallet</option>
                              </select>
                            ) : (
                              t.paymentMode || 'Transfer'
                            )}
                          </td>

                          {/* Amount Column */}
                          <td className="py-4 px-6 text-right">
                            {isEditing ? (
                              <div className="flex flex-col items-end gap-1.5">
                                <select 
                                  value={editForm.type} 
                                  onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                                  className="bg-slate-950 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none w-20 cursor-pointer"
                                >
                                  <option value="expense">Expense</option>
                                  <option value="income">Income</option>
                                  <option value="transfer">Transfer</option>
                                </select>
                                <input 
                                  type="number" 
                                  value={editForm.amount} 
                                  onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                                  className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-right text-white focus:outline-none w-24"
                                />
                              </div>
                            ) : (
                              <span className={`font-extrabold text-sm ${t.type === 'income' ? 'text-emerald-400' : t.type === 'transfer' ? 'text-blue-400' : 'text-rose-400'}`}>
                                {t.type === 'income' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                              </span>
                            )}
                          </td>

                          {/* Actions Column */}
                          <td className="py-4 px-6 text-center">
                            {isEditing ? (
                              <div className="flex justify-center gap-1.5">
                                <button 
                                  onClick={() => handleSaveEditTx(t._id)}
                                  className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Save"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => setEditingTxId(null)}
                                  className="p-1.5 text-gray-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-center gap-1">
                                <button 
                                  onClick={() => startEditTx(t)}
                                  className="p-1.5 text-gray-500 hover:text-brand-purple hover:bg-brand-purple/10 rounded-lg transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTx(t._id)}
                                  className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: WALLETS & TRANSFERS
          ========================================== */}
      {activeTab === 'wallets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wallet List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-white">Your Wallets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {wallets.map(w => (
                editingWalletId === w._id ? (
                  <div key={w._id} className="glass-panel p-5 rounded-2xl border-l-4 border-amber-500 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Wallet Name</label>
                        <input 
                          type="text" 
                          value={walletEditForm.name}
                          onChange={e => setWalletEditForm({ ...walletEditForm, name: e.target.value })}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Type</label>
                          <select 
                            value={walletEditForm.type}
                            onChange={e => setWalletEditForm({ ...walletEditForm, type: e.target.value })}
                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                          >
                            <option value="cash">Cash</option>
                            <option value="bank">Bank</option>
                            <option value="credit_card">Credit Card</option>
                            <option value="e_wallet">E-Wallet</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Balance (₹)</label>
                          <input 
                            type="number" 
                            value={walletEditForm.balance}
                            onChange={e => setWalletEditForm({ ...walletEditForm, balance: e.target.value })}
                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                      <button 
                        onClick={() => setEditingWalletId(null)}
                        className="p-1 px-2.5 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5 text-[10px] font-bold flex items-center gap-1 transition-all"
                      >
                        <X className="h-3 w-3" /> Cancel
                      </button>
                      <button 
                        onClick={() => handleUpdateWallet(w._id)}
                        className="p-1 px-3 bg-brand-purple text-white hover:brightness-110 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                      >
                        <Check className="h-3 w-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={w._id} className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-brand-purple group relative overflow-hidden transition-all hover:bg-slate-900/10">
                    <div>
                      <span className="text-sm font-bold text-white block">{w.name}</span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">{w.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-extrabold ${w.balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ₹{w.balance.toLocaleString()}
                      </span>

                      {/* Hover actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2 border-l border-white/5 bg-slate-950/40 p-1 rounded-lg backdrop-blur-sm">
                        <button 
                          onClick={() => startEditWallet(w)}
                          className="p-1.5 text-brand-purple hover:bg-brand-purple/10 rounded-md transition-all"
                          title="Edit Wallet"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteWallet(w._id)}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/15 rounded-md transition-all"
                          title="Delete Wallet"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Quick Transfer funds widget */}
          <div className="glass-panel p-6 rounded-3xl h-fit">
            <h3 className="text-base font-bold text-white flex items-center gap-1.5 mb-4">
              <ArrowRightLeft className="h-4 w-4 text-brand-purple" />
              Transfer Funds
            </h3>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">Source Wallet</label>
                <select 
                  required
                  value={transferForm.sourceWalletId}
                  onChange={e => setTransferForm({ ...transferForm, sourceWalletId: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="">Select source</option>
                  {wallets.map(w => <option key={w._id} value={w._id}>{w.name} (₹{w.balance})</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">Destination Wallet</label>
                <select 
                  required
                  value={transferForm.targetWalletId}
                  onChange={e => setTransferForm({ ...transferForm, targetWalletId: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="">Select target</option>
                  {wallets.map(w => <option key={w._id} value={w._id}>{w.name} (₹{w.balance})</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">Amount (₹)</label>
                <input 
                  type="number"
                  required
                  placeholder="0"
                  value={transferForm.amount}
                  onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 focus:border-brand-purple/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isTransferring}
                className={`w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer ${
                  isTransferring ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isTransferring ? 'Transferring...' : 'Perform Atomic Transfer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: BUDGETS LIST
          ========================================== */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white">Active Budgets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-gray-500 text-xs font-semibold">
                No budgets set for this month. Click "Set Budget" to define one.
              </div>
            ) : (
              budgets.map(b => {
                const percent = Math.min(100, Math.round(((b.spent || 0) / b.amount) * 100));
                return (
                  <div key={b._id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between h-40">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-sm font-bold text-white block">{b.category} Budget</span>
                        <span className="text-[10px] text-gray-400 block">Month: {b.month}</span>
                        {b.walletId && (
                          <span className="text-[10px] text-brand-purple font-semibold mt-0.5 block">
                            Wallet: {wallets.find(w => w._id === b.walletId)?.name || 'Wallet'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-extrabold ${percent >= 100 ? 'text-rose-400' : percent >= 80 ? 'text-amber-400' : 'text-brand-purple'}`}>{percent}%</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditBudget(b)}
                            className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                            title="Edit Budget"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBudget(b._id)}
                            className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="Delete Budget"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                        <div 
                          className={`h-full ${percent >= 100 ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-brand-purple'}`} 
                          style={{ width: `${percent}%` }} 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span>Spent: ₹{(b.spent || 0).toLocaleString()}</span>
                        <span>Total: ₹{b.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL DIALOGS
          ========================================== */}
      
      {/* 1. Add Transaction Modal */}
      <AnimatePresence>
        {showAddTx && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <span className="font-bold text-sm text-white">Add Transaction</span>
                <button onClick={() => setShowAddTx(false)} className="p-1 rounded-lg text-gray-400 hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleAddTx} className="p-6 space-y-4 overflow-y-auto scrollbar-none flex-1">
                
                {/* Income / Expense Toggle */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'expense' })}
                    className={`py-2 text-xs font-bold rounded-lg ${txForm.type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-gray-400'}`}
                  >
                    Expense
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'income' })}
                    className={`py-2 text-xs font-bold rounded-lg ${txForm.type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400'}`}
                  >
                    Income
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Title</label>
                    <input 
                      type="text" required placeholder="Pizza Hut, Salary..."
                      value={txForm.title} onChange={e => setTxForm({ ...txForm, title: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Amount (₹)</label>
                    <input 
                      type="number" required placeholder="0"
                      value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Date</label>
                    <input 
                      type="date" required
                      value={txForm.date} onChange={e => setTxForm({ ...txForm, date: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Category</label>
                    <select 
                      value={txForm.category} onChange={e => setTxForm({ ...txForm, category: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    {txForm.type === 'income' ? 'Target Wallet' : 'Source Wallet'}
                  </label>
                  <select 
                    required
                    value={txForm.type === 'income' ? txForm.targetWalletId : txForm.sourceWalletId}
                    onChange={e => {
                      if (txForm.type === 'income') {
                        setTxForm({ ...txForm, targetWalletId: e.target.value });
                      } else {
                        setTxForm({ ...txForm, sourceWalletId: e.target.value });
                      }
                    }}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="">Select active wallet</option>
                    {wallets.map(w => <option key={w._id} value={w._id}>{w.name} (₹{w.balance})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Location</label>
                    <input 
                      type="text" placeholder="Mumbai, Online..."
                      value={txForm.location} onChange={e => setTxForm({ ...txForm, location: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Tags (comma-separated)</label>
                    <input 
                      type="text" placeholder="food, dinner, treat"
                      value={txForm.tags} onChange={e => setTxForm({ ...txForm, tags: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Notes</label>
                  <textarea 
                    placeholder="Short description notes..." rows="2"
                    value={txForm.notes} onChange={e => setTxForm({ ...txForm, notes: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isAddingTx}
                  className={`w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg transition-all mt-4 cursor-pointer ${
                    isAddingTx ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isAddingTx ? 'Logging Transaction...' : 'Log Transaction'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Add Wallet Modal */}
      <AnimatePresence>
        {showAddWallet && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <span className="font-bold text-sm text-white">Create New Wallet</span>
                <button onClick={() => setShowAddWallet(false)} className="p-1 rounded-lg text-gray-400 hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleAddWallet} className="p-6 space-y-4">
                
                {/* Premium Warning banner */}
                {!user?.isPremium && wallets.length >= 3 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg text-[10px] text-amber-400 leading-snug">
                    ⚠️ Premium limit warning. Free users are capped at 3 wallets. Upgrade in settings.
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Wallet Name</label>
                  <input 
                    type="text" required placeholder="SBI Bank, PayTM..."
                    value={walletForm.name} onChange={e => setWalletForm({ ...walletForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Type</label>
                  <select 
                    value={walletForm.type} onChange={e => setWalletForm({ ...walletForm, type: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Account</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="upi">UPI / e-Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Initial Balance (₹)</label>
                  <input 
                    type="number" placeholder="0"
                    value={walletForm.balance} onChange={e => setWalletForm({ ...walletForm, balance: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isAddingWallet}
                  className={`w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer ${
                    isAddingWallet ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isAddingWallet ? 'Creating Wallet...' : 'Create Wallet'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Set Budget Modal */}
      <AnimatePresence>
        {showSetBudget && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <span className="font-bold text-sm text-white">Define Budget Limit</span>
                <button onClick={() => setShowSetBudget(false)} className="p-1 rounded-lg text-gray-400 hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleSetBudget} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Month (YYYY-MM)</label>
                  <input 
                    type="month" required
                    value={budgetForm.month} onChange={e => setBudgetForm({ ...budgetForm, month: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Category limit</label>
                  <select 
                    value={budgetForm.category} onChange={e => setBudgetForm({ ...budgetForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="All">All Expenses (Overall Month)</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Target Wallet (Optional)</label>
                  <select 
                    value={budgetForm.walletId} onChange={e => setBudgetForm({ ...budgetForm, walletId: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="">All Wallets combined</option>
                    {wallets.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Limit (₹)</label>
                  <input 
                    type="number" required placeholder="50000"
                    value={budgetForm.amount} onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSettingBudget}
                  className={`w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer ${
                    isSettingBudget ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSettingBudget ? 'Configuring Budget...' : 'Configure Budget'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Import CSV Modal */}
      <AnimatePresence>
        {showImport && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                <span className="font-bold text-sm text-white">Import Bank Statement</span>
                <button onClick={() => setShowImport(false)} className="p-1 rounded-lg text-gray-400 hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleImport} className="p-6 space-y-4">
                <div className="border-2 border-dashed border-white/10 hover:border-brand-purple/40 rounded-xl p-6 text-center cursor-pointer relative transition-all">
                  <input 
                    type="file" accept=".csv" required
                    onChange={e => setImportFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                  <span className="text-xs font-bold text-gray-300 block">
                    {importFile ? importFile.name : 'Select statement CSV file'}
                  </span>
                  <span className="text-[10px] text-gray-500 mt-1 block">Expected fields: Date, Title, Type, Category, Amount</span>
                </div>

                <button 
                  type="submit"
                  disabled={!importFile || isImporting}
                  className={`w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer ${
                    isImporting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isImporting ? 'Parsing & Importing...' : 'Parse & Import Entries'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
