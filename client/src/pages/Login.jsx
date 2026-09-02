import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, Sparkles, Loader2, ArrowRight, ShieldAlert, KeyRound, Zap, CheckCircle2, Lock, Mail } from 'lucide-react';
import axios from 'axios';
import { authStart, authSuccess, authFailure } from '../store/authSlice.js';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [mode, setMode] = useState('login'); // login, forgot, otp
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // OTP/Forgot form state
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(authStart());
    try {
      const res = await axios.post('/api/auth/login', { email, password, rememberMe });
      dispatch(authSuccess(res.data));
      navigate('/');
    } catch (err) {
      dispatch(authFailure(err.response?.data?.message || 'Login failed'));
    }
  };

  const handleFastDemoLogin = async () => {
    setEmail('hey@budgetwise.ai');
    setPassword('password123');
    dispatch(authStart());
    try {
      const res = await axios.post('/api/auth/login', { email: 'hey@budgetwise.ai', password: 'password123', rememberMe: true });
      dispatch(authSuccess(res.data));
      navigate('/');
    } catch {
      // If mock backend fallback
      dispatch(authSuccess({
        token: 'demo-token-' + Date.now(),
        user: { id: 'u-1', name: 'Demo Explorer', email: 'hey@budgetwise.ai', level: 2, coins: 450, xp: 280, isPremium: true }
      }));
      navigate('/');
    }
  };

  const handleGoogleLogin = async () => {
    dispatch(authStart());
    try {
      const res = await axios.post('/api/auth/google', {
        email: 'google_user@budgetwise.ai',
        name: 'Google User',
        googleId: '123456789'
      });
      dispatch(authSuccess(res.data));
      navigate('/');
    } catch (err) {
      dispatch(authFailure('Google Login simulation failed'));
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      alert(`OTP sent! ${res.data.otp ? `For testing, check console or use OTP: ${res.data.otp}` : 'Check server logs for OTP code.'}`);
      setMode('otp');
    } catch (err) {
      alert(err.response?.data?.message || 'Forgot password failed');
    }
  };

  const handleOtpReset = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/verify-otp', { email, otp, newPassword });
      alert('Password reset successfully! Please log in with your new password.');
      setMode('login');
      setPassword('');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      alert(err.response?.data?.message || 'OTP Verification failed');
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
            BudgetWise AI
          </h1>
          <p className="text-xs text-slate-300/80 max-w-xs mx-auto">
            Autonomous Personal Finance & Smart Budget Platform
          </p>
        </div>

        {/* 1-CLICK DEMO ACCESS BUTTON */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleFastDemoLogin}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-sky-500/20 hover:from-blue-600/35 hover:to-indigo-600/35 border border-blue-400/30 hover:border-blue-400/60 rounded-2xl text-xs font-bold text-blue-300 hover:text-white transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer group"
          >
            <Zap className="h-4 w-4 text-amber-300 group-hover:scale-110 transition-transform" />
            <span>1-Click Fast Demo Login</span>
          </button>
        </div>

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 pt-1">
            
            {error && (
              <div className="bg-rose-500/15 border border-rose-500/30 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300 backdrop-blur-md">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" /> 
                <span>{error}</span>
              </div>
            )}

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
              <div className="flex justify-between items-baseline">
                <label className="text-[11px] font-semibold text-slate-300 tracking-wide">
                  Password
                </label>
                <button 
                  type="button" 
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-medium hover:underline cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded-lg bg-slate-900/80 border-white/20 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Or Continue With
              </span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 active:scale-[0.99] border border-white/20 text-white font-semibold text-xs rounded-2xl transition-all flex items-center justify-center gap-2.5 backdrop-blur-md shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <p className="text-center text-xs text-slate-400 pt-2">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-bold hover:underline transition-colors">
                Create one for free
              </Link>
            </p>
          </form>
        )}

        {/* FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4 pt-1">
            <div className="text-center space-y-1">
              <h2 className="text-base font-bold text-white">Reset Account Password</h2>
              <p className="text-xs text-slate-300">Enter your registered email to receive a 6-digit OTP verification code.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 block">Email Address</label>
              <input 
                type="email" 
                required 
                placeholder="name@example.com"
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/15 focus:border-blue-400 focus:bg-slate-900/80 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer border border-white/20"
            >
              Request OTP Code
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-2xl transition-all border border-white/15 cursor-pointer"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* OTP VERIFICATION MODE */}
        {mode === 'otp' && (
          <form onSubmit={handleOtpReset} className="space-y-4 pt-1">
            <div className="text-center flex flex-col items-center space-y-1">
              <KeyRound className="h-8 w-8 text-blue-400 animate-bounce" />
              <h2 className="text-base font-bold text-white">Enter OTP Verification</h2>
              <p className="text-xs text-slate-300">A 6-digit verification code was generated in the server terminal.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 block">Verification OTP</label>
              <input 
                type="text" 
                required 
                maxLength="6" 
                placeholder="000000"
                value={otp} 
                onChange={e => setOtp(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/15 text-center tracking-[0.5em] text-lg font-mono rounded-2xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 block">New Password</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-2xl shadow-lg transition-all cursor-pointer border border-white/20"
            >
              Verify OTP & Reset
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-2xl transition-all border border-white/15"
            >
              Cancel
            </button>
          </form>
        )}

      </motion.div>
    </div>
  );
}
