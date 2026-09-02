import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, Sparkles, Loader2, ArrowRight, ShieldAlert, User, Mail, Lock } from 'lucide-react';
import axios from 'axios';
import { authStart, authSuccess, authFailure } from '../store/authSlice.js';

export default function Signup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    dispatch(authStart());
    try {
      const res = await axios.post('/api/auth/signup', { name, email, password });
      dispatch(authSuccess(res.data));
      navigate('/');
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Signup failed'));
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 sm:p-6 relative font-sans overflow-hidden">
      
      {/* Ambient background light orbs for depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-sky-400/10 rounded-full filter blur-[90px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <motion.div 
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10 rounded-[2rem] p-8 sm:p-10 space-y-7 shadow-2xl transition-all"
        style={{
          background: 'rgba(15, 23, 42, 0.52)',
          backdropFilter: 'blur(30px) saturate(190%)',
          WebkitBackdropFilter: 'blur(30px) saturate(190%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.25)'
        }}
      >
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/30 border border-white/20 mb-1">
            <Coins className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight text-white drop-shadow-sm">
            Create Account
          </h1>
          <p className="text-xs text-slate-300/80 max-w-xs mx-auto">
            Join BudgetWise AI for smart financial auditing & OCR trackers
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4 pt-1">
          
          {error && (
            <div className="bg-rose-500/15 border border-rose-500/30 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300 backdrop-blur-md">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" /> 
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 tracking-wide block">
              Full Name
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                required 
                placeholder="Aarav Sharma"
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/15 focus:border-blue-400 focus:bg-slate-900/80 focus:ring-4 focus:ring-blue-500/15 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-400/70 focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 tracking-wide block">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input 
                type="email" 
                required 
                placeholder="name@example.com"
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/15 focus:border-blue-400 focus:bg-slate-900/80 focus:ring-4 focus:ring-blue-500/15 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-400/70 focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 tracking-wide block">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/15 focus:border-blue-400 focus:bg-slate-900/80 focus:ring-4 focus:ring-blue-500/15 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-400/70 focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20 mt-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Create Free Account</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 pt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold hover:underline transition-colors">
              Sign in
            </Link>
          </p>
        </form>

      </motion.div>
    </div>
  );
}
