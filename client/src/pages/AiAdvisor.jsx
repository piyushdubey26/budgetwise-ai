import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb, 
  HelpCircle,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import axios from 'axios';

export default function AiAdvisor() {
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [advisorData, setAdvisorData] = useState(null);

  const fetchAdvisorFeedback = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/ai/advisor');
      setAdvisorData(res.data);
    } catch (e) {
      alert('Failed to generate AI insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisorFeedback();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30';
    if (score >= 60) return 'text-amber-400 border-amber-500/30';
    return 'text-rose-400 border-rose-500/30';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-indigo bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-brand-purple animate-pulse" />
            AI Financial Advisor
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Let Gemini AI audit your transaction records, analyze budgets, and suggest saving strategies.
          </p>
        </div>
        
        <button 
          onClick={fetchAdvisorFeedback}
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-indigo to-brand-purple hover:brightness-110 disabled:opacity-50 px-4.5 py-2.5 rounded-xl font-semibold text-sm text-white shadow shadow-brand-indigo/10 transition-all"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Re-Analyze Spending
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-t-brand-purple animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-400">Gemini is processing your transaction history...</p>
        </div>
      )}

      {!loading && advisorData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Health Score + analysis summary */}
          <div className="space-y-6 lg:col-span-1">
            <div className="glass-panel p-6 rounded-3xl text-center space-y-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Financial Health Score</span>
              
              <div className="relative h-32 w-32 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="8" fill="transparent" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    stroke="url(#purpleGradient)" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * advisorData.financialScore) / 100}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white">{advisorData.financialScore}</span>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">health score</span>
                </div>
              </div>

              <div className={`text-xs font-bold py-1 px-3 border rounded-full w-fit mx-auto ${getScoreColor(advisorData.financialScore)}`}>
                {advisorData.financialScore >= 80 ? 'Excellent Standing' : advisorData.financialScore >= 60 ? 'Stable Standing' : 'Needs Improvement'}
              </div>
            </div>

            {/* Analysis card */}
            <div className="glass-panel p-6 rounded-3xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                <AlertTriangle className="h-4 w-4 text-brand-purple" />
                Advisor Audit Analysis
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">
                {advisorData.expenseAnalysis}
              </p>
            </div>
          </div>

          {/* Right Column: Saving options, micro leakages, tips */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Savings opportunities */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Recommended Savings Allocations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {advisorData.savingsOpportunities?.map((opp, i) => (
                  <div key={i} className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-l-4 border-emerald-400">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-white block">{opp.area}</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-extrabold">
                          Save ₹{opp.potentialSavings}/mo
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{opp.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Micro leakage / Unnecessary spend */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Spotted Financial Leakages</h3>
              <div className="glass-panel p-6 rounded-3xl divide-y divide-white/5">
                {advisorData.unnecessarySpending?.length === 0 ? (
                  <span className="text-xs text-gray-500 font-medium">No leakage trends identified. Keep it up!</span>
                ) : (
                  advisorData.unnecessarySpending?.map((leak, i) => (
                    <div key={i} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                      <div>
                        <span className="text-xs font-bold text-white block">{leak.item}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{leak.reason}</span>
                      </div>
                      <span className="text-xs font-extrabold text-rose-400">
                        - ₹{leak.amount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* General tips */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-1">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Strategic Financial Advice
              </h3>
              <div className="glass-panel p-6 rounded-3xl">
                <ul className="space-y-3">
                  {advisorData.generalTips?.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-gray-300">
                      <CheckCircle className="h-4 w-4 text-brand-purple shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Premium wall for AI Advisor suggestions (Mock Check for UI completeness) */}
      {!user?.isPremium && (
        <div className="bg-gradient-to-r from-brand-indigo/10 to-brand-purple/10 border border-brand-purple/20 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <ShieldAlert className="h-4.5 w-4.5 text-brand-purple" />
              Unlock High Precision Advisor Insights
            </h4>
            <p className="text-[11px] text-gray-400 mt-1 leading-normal max-w-xl">
              Free accounts use generic spending templates. Upgrade to Premium for direct Gemini 1.5 Pro personalized recommendations tailored to your investments, EMIs, and local goals timeline.
            </p>
          </div>
          <button 
            onClick={() => navigate('/settings')}
            className="bg-gradient-to-r from-brand-indigo to-brand-purple px-4.5 py-2.5 rounded-xl font-bold text-xs text-white shadow shadow-brand-indigo/10 hover:brightness-110 whitespace-nowrap"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

    </div>
  );
}
