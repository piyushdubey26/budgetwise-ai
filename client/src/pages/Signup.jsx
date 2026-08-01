import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Coins, Sparkles, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';
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

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">Create a new account</h2>
            <p className="text-xs text-gray-500 mt-1">Start tracking budgets, scan receipts, and get AI reviews</p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-2 text-xs text-rose-400">
              <ShieldAlert className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Name</label>
            <input 
              type="text" required placeholder="Enter your name"
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 focus:border-brand-purple/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Email</label>
            <input 
              type="email" required placeholder="name@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 focus:border-brand-purple/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Password</label>
            <input 
              type="password" required placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 focus:border-brand-purple/40 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign Up'}
            <ArrowRight className="h-4 w-4" />
          </button>

          <span className="text-xs text-gray-500 text-center block pt-4">
            Already have an account? <Link to="/login" className="text-brand-purple font-bold hover:underline">Log in</Link>
          </span>
        </form>

      </div>
    </div>
  );
}
