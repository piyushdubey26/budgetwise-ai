import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Sparkles, 
  Coins, 
  Check, 
  ShieldAlert, 
  Loader2, 
  Trash2, 
  CreditCard,
  X
} from 'lucide-react';
import axios from 'axios';
import { upgradePremiumSuccess, loadProfile } from '../store/authSlice.js';

export default function Settings({ refresh }) {
  const dispatch = useDispatch();
  const { user, settings } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  // Form profile setting
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currency: settings?.currency || 'INR',
    theme: settings?.theme || 'dark',
    language: settings?.language || 'en',
    timezone: settings?.timezone || 'Asia/Kolkata',
    notificationsEnabled: settings?.notificationsEnabled ?? true
  });

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put('/api/auth/settings', {
        currency: profileForm.currency,
        theme: profileForm.theme,
        language: profileForm.language,
        timezone: profileForm.timezone,
        notificationsEnabled: profileForm.notificationsEnabled
      });

      alert('Profile configurations updated successfully!');
      if (refresh) refresh();
    } catch (err) {
      alert('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateRazorpaySuccess = async () => {
    setRazorpayLoading(true);
    try {
      const res = await axios.post('/api/auth/upgrade');
      dispatch(upgradePremiumSuccess(res.data.user));
      alert('🏆 Payment Verified! Premium features unlocked + 500 Coins added!');
      setShowRazorpay(false);
      if (refresh) refresh();
    } catch (err) {
      alert('Upgrade validation failed.');
    } finally {
      setRazorpayLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-brand-indigo dark:from-white dark:via-slate-100 dark:to-brand-indigo bg-clip-text text-transparent">
          System Settings & Premium Plan
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Customise theme options, default currencies, notification preferences, and manage subscription.
        </p>
      </div>

      {/* Grid layouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Premium Plan Banner Widget */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900/80 border border-brand-purple/20 flex flex-col justify-between relative overflow-hidden h-fit">
            
            {/* Background glowing circle */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-purple/15 rounded-full filter blur-xl" />

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <span className="text-sm font-extrabold text-white">PRO Gold Plan</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Supercharge your budget management with unlimited capabilities.
              </p>

              {user?.isPremium ? (
                <div className="mt-6 space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <Check className="h-4.5 w-4.5" /> Premium Active
                  </div>
                  <span className="text-[9px] text-gray-500 block">Subscription period: 1 Year (Verified via Razorpay)</span>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  <div className="text-2xl font-black text-white">
                    ₹399<span className="text-xs text-gray-500 font-medium">/ year</span>
                  </div>
                  
                  <ul className="space-y-2 text-[10px] text-gray-300">
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-brand-purple shrink-0" /> Unlimited wallets (Free limit: 3)</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-brand-purple shrink-0" /> Unlimited savings goals</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-brand-purple shrink-0" /> Gemini 1.5 Pro AI Insights</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-brand-purple shrink-0" /> Premium PDF PDF report generators</li>
                  </ul>

                  <button
                    onClick={() => setShowRazorpay(true)}
                    className="w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-brand-indigo/20 transition-all mt-4"
                  >
                    Upgrade Plan via Razorpay
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configurations Form */}
        <div className="md:col-span-2 glass-panel p-6 rounded-3xl">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <SettingsIcon className="h-4.5 w-4.5 text-brand-purple" />
            Profile Preferences
          </h3>

          <form onSubmit={handleUpdateSettings} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Name</label>
                <input 
                  type="text" disabled
                  value={profileForm.name}
                  className="w-full bg-slate-950 border border-white/5 opacity-55 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Email</label>
                <input 
                  type="email" disabled
                  value={profileForm.email}
                  className="w-full bg-slate-950 border border-white/5 opacity-55 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Base Currency</label>
                <select 
                  value={profileForm.currency}
                  onChange={e => setProfileForm({ ...profileForm, currency: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-purple/40"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Language</label>
                <select 
                  value={profileForm.language}
                  onChange={e => setProfileForm({ ...profileForm, language: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-purple/40"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Timezone</label>
                <select 
                  value={profileForm.timezone}
                  onChange={e => setProfileForm({ ...profileForm, timezone: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-purple/40"
                >
                  <option value="Asia/Kolkata">GMT+05:30 (Kolkata)</option>
                  <option value="UTC">UTC (London)</option>
                  <option value="America/New_York">GMT-04:00 (New York)</option>
                </select>
              </div>
              <div className="flex items-center pt-5">
                <input 
                  type="checkbox" id="notif-toggle"
                  checked={profileForm.notificationsEnabled}
                  onChange={e => setProfileForm({ ...profileForm, notificationsEnabled: e.target.checked })}
                  className="h-4 w-4 bg-slate-950 border border-white/10 rounded focus:ring-brand-purple"
                />
                <label htmlFor="notif-toggle" className="text-xs font-bold text-gray-300 ml-2 cursor-pointer">
                  Enable Budget Notifications
                </label>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 flex justify-between items-center">
              <button 
                type="button" 
                onClick={() => alert('Account delete simulation. To complete, verify details on MongoDB.')}
                className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-rose-500/20 transition-all"
              >
                <Trash2 className="h-4 w-4" /> Delete Account
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-slate-900 border border-white/10 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Preferences'}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* ==========================================
          RAZORPAY SIMULATOR MODAL
          ========================================== */}
      <AnimatePresence>
        {showRazorpay && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white text-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Razorpay Widget Header */}
              <div className="bg-[#0f2d59] p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-white p-1 rounded">
                    <CreditCard className="h-5 w-5 text-[#0f2d59]" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-300 block">Razorpay Trusted Checkout</span>
                    <span className="text-xs font-bold block">BudgetWise AI PRO - ₹399</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRazorpay(false)} 
                  className="text-gray-300 hover:text-white p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Simulation Checkout Screen */}
              <div className="p-6 space-y-6">
                
                {/* Method Mock Selection */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Choose payment method</span>
                  
                  <div className="border border-slate-200 p-3.5 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Pay via UPI / QR</span>
                      <span className="text-[9px] text-gray-500">Google Pay, PhonePe, Paytm</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-gray-600">Popular</span>
                  </div>

                  <div className="border border-slate-200 p-3.5 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Credit / Debit Card</span>
                      <span className="text-[9px] text-gray-500">Visa, MasterCard, RuPay</span>
                    </div>
                  </div>
                </div>

                {/* Simulation actions */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3 text-center">
                  <span className="text-[10px] font-bold text-slate-500 block">Simulate Razorpay Callback</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowRazorpay(false)}
                      className="py-2 text-xs font-bold border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                    >
                      Cancel Payment
                    </button>
                    <button
                      onClick={handleSimulateRazorpaySuccess}
                      disabled={razorpayLoading}
                      className="py-2 text-xs font-bold bg-[#1d4ed8] hover:bg-blue-800 text-white rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      {razorpayLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                      Verify Success
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
