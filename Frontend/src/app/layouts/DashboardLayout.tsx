import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
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
  Briefcase,
  Users,
  PlusCircle,
  MessageCircle  // ← добавить иконку для групп
} from 'lucide-react';

const API_BASE = (() => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  return '';
})();

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Participant' | 'Coordinator';
  region: string;
  photoUrl?: string;
}

export default function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('ngo_current_user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  // Navigation based on user role
  const getNavigation = () => {
    const baseNav = [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    ];
    
    if (user?.role === 'Participant') {
      return [
        ...baseNav,
        { name: 'Opportunities', href: '/dashboard/opportunities', icon: <Briefcase size={20} /> },
        { name: 'My Schedule', href: '/dashboard/schedule', icon: <Calendar size={20} /> },
        { name: 'Groups', href: '/dashboard/groups', icon: <MessageCircle size={20} /> }, // ← ДОБАВЛЕНО
        { name: 'Profile', href: '/dashboard/profile', icon: <UserCircle size={20} /> },
      ];
    } else if (user?.role === 'Coordinator') {
      return [
        ...baseNav,
        { name: 'My Events', href: '/dashboard/events', icon: <Calendar size={20} /> },
        { name: 'Create Event', href: '/dashboard/create-event', icon: <PlusCircle size={20} /> },
        { name: 'Participants', href: '/dashboard/participants', icon: <Users size={20} /> },
        { name: 'Groups', href: '/dashboard/groups', icon: <Users size={20} /> },
        { name: 'Profile', href: '/dashboard/profile', icon: <UserCircle size={20} /> },
      ];
    }
    
    return [...baseNav, { name: 'Profile', href: '/dashboard/profile', icon: <UserCircle size={20} /> }];
  };

  const navigation = getNavigation();

  const handleLogout = () => {
    localStorage.removeItem('ngo_current_user');
    window.dispatchEvent(new CustomEvent('userChanged', { detail: null }));
    navigate('/login');
  };

  const getAvatarUrl = () => {
    if (user?.photoUrl) return `${API_BASE}${user.photoUrl}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=f97316&color=fff&bold=true`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

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
            const isActive = location.pathname === item.href;
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
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-rose-600 hover:bg-rose-50 transition-all duration-200"
          >
            <LogOut size={20} className="text-rose-400" />
            Log Out
          </button>
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

          <div className="flex items-center gap-5 ml-auto">
            <button className="relative p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-all">
              <Bell size={20} />
            </button>
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            <Link to="/dashboard/profile" className="flex items-center gap-3 pl-2">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-900 leading-none">{user.name}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  {user.role === 'Participant' ? 'Volunteer' : 'Coordinator'}
                </p>
              </div>
              <img 
                src={getAvatarUrl()} 
                alt={user.name} 
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
            
            <div className="p-4 border-t border-slate-100">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-rose-600 hover:bg-rose-50 transition-all duration-200"
              >
                <LogOut size={20} className="text-rose-400" />
                Log Out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}