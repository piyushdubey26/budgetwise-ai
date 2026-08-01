import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, Sparkles, Loader2, ArrowRight, ShieldAlert, KeyRound } from 'lucide-react';
import axios from 'axios';
import { authStart, authSuccess, authFailure } from '../store/authSlice.js';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [mode, setMode] = useState('login'); // login, forgot, otp
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

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
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative font-sans overflow-hidden">
      
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-indigo/10 rounded-full filter blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-purple/10 rounded-full filter blur-3xl" />

      <div className="w-full max-w-md bg-slate-950/60 border border-white/10 p-8 rounded-3xl backdrop-blur-md shadow-2xl relative z-10 space-y-6">
        
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="bg-gradient-to-tr from-brand-indigo to-brand-purple p-2.5 rounded-xl shadow-lg">
            <Coins className="h-6 w-6 text-white" />
          </div>
          <span className="font-display font-extrabold text-2xl tracking-tight text-white">BudgetWise AI</span>
        </div>

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-bold text-white">Log in to your account</h2>
              <p className="text-xs text-gray-500 mt-1">Enter your email and password to access dashboard</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-2 text-xs text-rose-400">
                <ShieldAlert className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Email</label>
              <input 
                type="email" required placeholder="name@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 focus:border-brand-purple/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Password</label>
                <button 
                  type="button" 
                  onClick={() => setMode('forgot')}
                  className="text-[10px] text-brand-purple font-bold hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input 
                type="password" required placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 focus:border-brand-purple/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center">
              <input 
                type="checkbox" id="remember"
                checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                className="h-4 w-4 bg-slate-950 border border-white/10 rounded focus:ring-brand-purple"
              />
              <label htmlFor="remember" className="text-xs text-gray-400 ml-2 cursor-pointer">Remember Me (30 Days)</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In'}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-[9px] text-gray-500 font-bold uppercase tracking-wider">or signin with</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
            >
              Simulate Google Sign-In
            </button>

            <span className="text-xs text-gray-500 text-center block pt-4">
              Don't have an account? <Link to="/signup" className="text-brand-purple font-bold hover:underline">Sign up</Link>
            </span>
          </form>
        )}

        {/* FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-bold text-white">Reset Account Password</h2>
              <p className="text-xs text-gray-500 mt-1">Enter your registered email to request a 6-digit OTP verification code.</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Email</label>
              <input 
                type="email" required placeholder="name@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 focus:border-brand-purple/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
            >
              Request OTP Code
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full py-2.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
            >
              Back to Login
            </button>
          </form>
        )}

        {/* OTP VERIFICATION MODE */}
        {mode === 'otp' && (
          <form onSubmit={handleOtpReset} className="space-y-4">
            <div className="text-center flex flex-col items-center">
              <KeyRound className="h-8 w-8 text-brand-purple mb-2 animate-bounce" />
              <h2 className="text-lg font-bold text-white">Enter OTP Verification</h2>
              <p className="text-xs text-gray-500 mt-1">We logged a 6-digit verification code in the server terminal.</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Verification OTP</label>
              <input 
                type="text" required maxLength="6" placeholder="000000"
                value={otp} onChange={e => setOtp(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 text-center tracking-widest text-lg rounded-xl px-3.5 py-2 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">New Password</label>
              <input 
                type="password" required placeholder="••••••••"
                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
            >
              Verify OTP & Reset
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full py-2.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
            >
              Cancel
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
