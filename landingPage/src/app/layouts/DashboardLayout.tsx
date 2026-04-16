import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { 
  HeartHandshake, 
  LayoutDashboard, 
  Search, 
  Bell, 
  Calendar, 
  UserCircle, 
  Settings, 
  LogOut,
  Menu,
  X,
  Briefcase
} from 'lucide-react';

export default function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Opportunities', href: '/dashboard/opportunities', icon: <Briefcase size={20} /> },
    { name: 'My Schedule', href: '/dashboard/schedule', icon: <Calendar size={20} /> },
    { name: 'Profile', href: '/dashboard/profile', icon: <UserCircle size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-100 z-20">
        <div className="h-20 flex items-center px-8 border-b border-slate-50">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-orange-600 text-white p-1.5 rounded-lg shadow-sm group-hover:bg-orange-700 transition-colors">
              <HeartHandshake size={20} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">VoluKZ</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <p className="px-4 text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (location.pathname.startsWith(item.href) && item.href !== '/dashboard');
            return (
              <Link 
                key={item.name} 
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isActive 
                    ? 'bg-orange-50 text-orange-600 shadow-[inset_0_1px_2px_rgba(255,237,213,0.5)] border border-orange-100/50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`${isActive ? 'text-orange-600' : 'text-slate-400'}`}>
                  {item.icon}
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link to="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200">
            <Settings size={20} className="text-slate-400" />
            Settings
          </Link>
          <Link to="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-rose-600 hover:bg-rose-50 transition-all duration-200">
            <LogOut size={20} className="text-rose-400" />
            Log Out
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-10">
          <div className="flex items-center gap-4 lg:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-orange-600 text-white p-1 rounded-md">
                <HeartHandshake size={18} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">VoluKZ</span>
            </Link>
          </div>

          {/* Search Bar - hidden on mobile */}
          <div className="hidden lg:flex relative w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search events, NGOs, or skills..." 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium focus:ring-4 focus:ring-orange-50 focus:border-orange-300 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-5 ml-auto">
            <button className="relative p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-all">
              <Bell size={20} />
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            <Link to="/dashboard/profile" className="flex items-center gap-3 pl-2">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-900 leading-none">Dias M.</p>
                <p className="text-xs font-medium text-slate-500 mt-1">Volunteer</p>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=faces&fit=crop&w=100&h=100&q=80" 
                alt="User" 
                className="w-10 h-10 rounded-full object-cover border-2 border-slate-100 shadow-sm"
              />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            className="w-72 h-full bg-white flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="bg-orange-600 text-white p-1.5 rounded-lg shadow-sm">
                  <HeartHandshake size={20} strokeWidth={2.5} />
                </div>
                <span className="text-2xl font-extrabold tracking-tight text-slate-900">VoluKZ</span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-8 space-y-2">
              <p className="px-4 text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Main Menu</p>
              {navigation.map((item) => (
                <Link 
                  key={item.name} 
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
          </motion.div>
        </div>
      )}
    </div>
  );
}