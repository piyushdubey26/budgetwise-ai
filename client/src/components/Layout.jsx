import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowUpDown,
  Goal,
  Cpu,
  FileText,
  Calendar,
  Settings,
  Bell,
  Coins,
  Award,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Shield,
  UserCheck,
  Sun,
  Moon
} from 'lucide-react';
import { logout, updateLocalSettings, setAdminViewMode } from '../store/authSlice.js';
import axios from 'axios';

export default function Layout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const { user, settings } = useSelector((state) => state.auth);
  const { notifications } = useSelector((state) => state.finance);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleTheme = async () => {
    const nextTheme = (settings?.theme || 'dark') === 'dark' ? 'light' : 'dark';
    dispatch(updateLocalSettings({ theme: nextTheme }));
    try {
      await axios.put('/api/auth/settings', { ...settings, theme: nextTheme });
    } catch (e) {
      console.error('Failed to update theme:', e.message);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const markRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}`);
    } catch (e) {
      console.error(e.message);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ArrowUpDown },
    { name: 'Receipt OCR', path: '/receipt-scanner', icon: FileText },
    { name: 'Goals & Gamification', path: '/goals', icon: Goal },
    { name: 'AI Finance Advisor', path: '/ai-advisor', icon: Cpu },
    { name: 'Bills & Subscriptions', path: '/bills-subs', icon: Calendar },
    { name: 'Investments', path: '/investments', icon: TrendingUp },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Show Admin panel link only for specific users (we can let users with level > 3 or standard admin email look at it)
  const showAdmin = user && (user.email === 'admin@budgetwise.ai' || user.level > 1);

  const unreadNotifs = notifications.filter(n => !n.read);

  return (
    <div className="flex h-screen bg-[#020617] text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-950 border-r border-white/5 py-6 px-4 shrink-0 justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 mb-8">
            <div className="bg-gradient-to-tr from-brand-indigo to-brand-purple p-2.5 rounded-xl shadow-lg shadow-brand-indigo/20">
              <Coins className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-indigo bg-clip-text text-transparent">
                BudgetWise
              </span>
              <span className="text-[10px] block font-semibold text-brand-purple tracking-widest uppercase">
                AI Assistant
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-indigo/20 to-brand-purple/10 text-white border border-brand-indigo/20 shadow-md shadow-brand-indigo/5'
                      : 'text-gray-400 hover:bg-slate-900/50 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-brand-purple' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              );
            })}
            
            {user?.role === 'admin' && (
              <button
                onClick={() => dispatch(setAdminViewMode('admin'))}
                className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20 mt-2"
              >
                <Shield className="h-4.5 w-4.5 text-red-500" />
                Admin Console
              </button>
            )}
          </nav>
        </div>

        {/* User profile Summary at Bottom */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand-purple to-brand-rose flex items-center justify-center font-bold text-white shadow-inner">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white">{user?.name}</span>
                {user?.isPremium && (
                  <span className="text-[9px] bg-brand-purple/20 text-brand-purple border border-brand-purple/30 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    PRO
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-500 block truncate w-36">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 border border-transparent transition-all"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          >
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-72 bg-slate-950 h-full p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <Coins className="h-6 w-6 text-brand-purple" />
                    <span className="font-display font-extrabold text-lg text-white">BudgetWise</span>
                  </div>
                  <button onClick={() => setIsMobileOpen(false)} className="p-1 rounded-lg text-gray-400 hover:bg-slate-900">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-brand-indigo/20 text-white'
                            : 'text-gray-400 hover:bg-slate-900 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5 text-brand-purple" />
                        {item.name}
                      </Link>
                    );
                  })}
                  {showAdmin && (
                    <button
                      onClick={() => {
                        setIsMobileOpen(false);
                        dispatch(setAdminViewMode('admin'));
                      }}
                      className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20 mt-2"
                    >
                      <Shield className="h-4.5 w-4.5 text-red-500" />
                      Admin Console
                    </button>
                  )}
                </nav>
              </div>

              <div className="border-t border-white/5 pt-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  Logout
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content viewport */}
      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 border-b border-white/5 bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileOpen(true)} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-slate-900">
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Header Level & Coins Widget */}
            <div className="flex items-center gap-4 bg-slate-900/60 border border-white/5 px-3 py-1.5 rounded-full shadow-inner">
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-brand-purple" />
                <span className="text-xs font-bold text-gray-300">Lvl {user?.level || 1}</span>
              </div>
              
              {/* Progress to level up */}
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                <div 
                  className="h-full bg-gradient-to-r from-brand-indigo to-brand-purple transition-all" 
                  style={{ width: `${(user?.xp || 0) % 100}%` }}
                />
              </div>

              <div className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-yellow-500" />
                <span className="text-xs font-bold text-yellow-400">{user?.coins || 0}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-400 hover:bg-slate-900/50 hover:text-white dark:hover:bg-slate-900 hover:bg-slate-200 transition-all"
              title="Toggle Theme"
            >
              {(settings?.theme || 'dark') === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-brand-purple" />
              )}
            </button>

            {/* Notification drop */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)} 
                className="p-2 rounded-xl text-gray-400 hover:bg-slate-900/50 hover:text-white dark:hover:bg-slate-900 hover:bg-slate-200 transition-all relative"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-rose animate-ping" />
                )}
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-rose" />
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-xl z-20 overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <span className="font-semibold text-sm">Notifications</span>
                        <span className="text-[10px] bg-brand-purple/20 text-brand-purple px-2 py-0.5 rounded-full font-bold">
                          {unreadNotifs.length} New
                        </span>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto divide-y divide-white/5 scrollbar-none">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-gray-500">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div 
                              key={notif._id} 
                              onClick={() => {
                                markRead(notif._id);
                                notif.read = true;
                              }}
                              className={`p-3.5 transition-all cursor-pointer ${notif.read ? 'opacity-60 bg-transparent' : 'bg-slate-800/40 hover:bg-slate-800/80'}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold text-xs text-white">{notif.title}</span>
                                <span className="text-[9px] text-gray-500">{new Date(notif.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              <p className="text-[11px] text-gray-400 leading-relaxed">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar click settings */}
            <div 
              onClick={() => navigate('/settings')}
              className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-purple flex items-center justify-center font-bold text-white shadow shadow-brand-indigo/10 cursor-pointer hover:scale-105 transition-all"
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Sub-view Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-none">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
