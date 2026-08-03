import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  IndianRupee, 
  MessageSquare,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

export default function Admin() {
  
  // Mock Admin Analytics data
  const revenueTrend = [
    { name: 'Apr', Revenue: 12000, Users: 140 },
    { name: 'May', Revenue: 21000, Users: 280 },
    { name: 'Jun', Revenue: 34000, Users: 490 },
    { name: 'Jul', Revenue: 57000, Users: 780 }
  ];

  const recentUsers = [
    { id: 1, name: 'Aarav Sharma', email: 'aarav@gmail.com', date: '2026-07-28', plan: 'PRO', revenue: '₹399' },
    { id: 2, name: 'Priya Patel', email: 'priya@gmail.com', date: '2026-07-27', plan: 'Free', revenue: '₹0' },
    { id: 3, name: 'Kabir Singh', email: 'kabir@gmail.com', date: '2026-07-26', plan: 'PRO', revenue: '₹399' },
    { id: 4, name: 'Ananya Roy', email: 'ananya@gmail.com', date: '2026-07-25', plan: 'Free', revenue: '₹0' }
  ];

  const feedbackLogs = [
    { id: 1, user: 'Aarav Sharma', msg: 'Gemini recommendations saved me ₹3000 this month! Loving it.', rating: '5/5' },
    { id: 2, user: 'Rohan Verma', msg: 'Can we add shared group wallets in the next release?', rating: '4/5' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-red-500 via-rose-400 to-slate-900 dark:to-white bg-clip-text text-transparent flex items-center gap-2">
          Admin Control Center
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Review enterprise-wide platform metrics, active subscriptions, revenue aggregates, and user feedback logs.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Total Registered Users</span>
            <h3 className="text-2xl font-black text-white mt-1">1,482</h3>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> +28% this month
            </span>
          </div>
          <div className="p-3 bg-red-500/10 rounded-xl text-red-400 border border-red-500/10">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Premium Users</span>
            <h3 className="text-2xl font-black text-white mt-1">143</h3>
            <span className="text-[10px] text-gray-400 font-semibold block mt-1">9.6% conversion rate</span>
          </div>
          <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500 border border-yellow-500/10">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Gross Revenue</span>
            <h3 className="text-2xl font-black text-white mt-1">₹57,057</h3>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> +15% week-on-week
            </span>
          </div>
          <div className="p-3 bg-[#10b981]/10 rounded-xl text-[#10b981] border border-[#10b981]/10">
            <IndianRupee className="h-6 w-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Active API Queries</span>
            <h3 className="text-2xl font-black text-white mt-1">2,842</h3>
            <span className="text-[10px] text-gray-400 font-semibold block mt-1">99.98% successful server requests</span>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/10">
            <Activity className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Revenue growth Area chart */}
      <div className="glass-panel p-6 rounded-3xl">
        <h3 className="text-base font-bold text-white mb-6">Gross Revenue & Signup Trends</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" stroke="#6b7280" tickLine={false} />
              <YAxis stroke="#6b7280" tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="Revenue" stroke="#ef4444" strokeWidth={2.5} fill="url(#revGlow)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom sections: users table + feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User signups */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl">
          <h3 className="text-base font-bold text-white mb-4">Recent User Registrations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 pb-2 text-gray-500 font-bold uppercase">
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Signup Date</th>
                  <th className="py-2.5">Plan</th>
                  <th className="py-2.5 text-right">Revenue Contributions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {recentUsers.map(ru => (
                  <tr key={ru.id}>
                    <td className="py-3 font-semibold text-white">{ru.name}</td>
                    <td className="py-3">{ru.email}</td>
                    <td className="py-3">{ru.date}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded font-extrabold ${ru.plan === 'PRO' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-slate-800 text-gray-400'}`}>
                        {ru.plan}
                      </span>
                    </td>
                    <td className="py-3 text-right font-extrabold">{ru.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feedback logs */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-1">
              <MessageSquare className="h-4.5 w-4.5 text-red-500" />
              Latest Feedback
            </h3>
            <div className="space-y-4">
              {feedbackLogs.map(fl => (
                <div key={fl.id} className="bg-slate-900/60 p-3 rounded-xl border border-white/5 space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span className="font-bold">{fl.user}</span>
                    <span className="text-yellow-500 font-extrabold">{fl.rating}</span>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-relaxed font-medium">"{fl.msg}"</p>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => alert('Feature flag: Feedback analytics is currently offline.')}
            className="w-full py-2 bg-slate-900 border border-white/10 hover:bg-slate-800 text-xs font-bold text-white rounded-lg transition-all mt-4"
          >
            Export Feedback Logs
          </button>
        </div>

      </div>

    </div>
  );
}
