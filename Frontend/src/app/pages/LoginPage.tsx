// LoginPage.tsx - полная версия с улучшенной обработкой аватаров
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { HeartHandshake, Mail, Lock, ArrowRight, User } from 'lucide-react';

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ??
  (window.location.hostname === 'localhost' ? 'http://localhost:4000' : '');

// SVG аватар по умолчанию (инициальный аватар)
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f97316'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

// Функция для получения аватара с инициалью, если нет фото
const getAvatarUrl = (user: QuickUser) => {
  // Если есть photoUrl и он не пустой и не null
  if (user.photoUrl && user.photoUrl.trim() !== '') {
    // Если URL уже полный (начинается с http)
    if (user.photoUrl.startsWith('http')) {
      return user.photoUrl;
    }
    // Если это путь к файлу на сервере
    return `${API_BASE}${user.photoUrl}`;
  }
  
  // Если нет фото, генерируем аватар с инициалью
  const name = user.name || 'User';
  const initial = name.charAt(0).toUpperCase();
  const color = getColorFromName(name);
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=${color}&color=fff&bold=true&size=36`;
};

// Генерируем цвет на основе имени
const getColorFromName = (name: string): string => {
  const colors = ['f97316', 'ef4444', '3b82f6', '10b981', '8b5cf6', 'ec4899', '06b6d4', 'f59e0b'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % colors.length;
  }
  return colors[hash];
};

interface QuickUser {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
  photoUrl?: string;
}

// Функции для работы с localStorage (синхронизация с main.js)
const saveUser = (user: any) => {
  localStorage.setItem('ngo_current_user', JSON.stringify(user));
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [quickUsers, setQuickUsers] = useState<QuickUser[]>([]);
  const [isLoadingQuickUsers, setIsLoadingQuickUsers] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Загружаем быстрых пользователей из вашего API
  useEffect(() => {
    const loadQuickUsers = async () => {
      setIsLoadingQuickUsers(true);
      try {
        const response = await fetch(`${API_BASE}/api/users/short`);
        const result = await response.json();
        if (response.ok && Array.isArray(result)) {
          console.log('Loaded users:', result); // Отладка - посмотреть какие пользователи приходят
          setQuickUsers(result.slice(0, 8));
        }
      } catch (err) {
        console.error('Failed to load quick users:', err);
      } finally {
        setIsLoadingQuickUsers(false);
      }
    };
    loadQuickUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Login failed.');

      saveUser(result.user);
      window.dispatchEvent(new CustomEvent('userChanged', { detail: result.user }));
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Unexpected error happened.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('12345678');
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 100);
  };

  const handleImageError = (userId: string) => {
    // Добавляем ID пользователя в список неудачных загрузок
    setFailedImages(prev => new Set(prev).add(userId));
  };

  // Функция для получения URL аватара с учетом ошибок загрузки
  const getAvatarSrc = (user: QuickUser) => {
    // Если изображение уже не загрузилось, показываем инициальный аватар
    if (failedImages.has(user.id)) {
      const name = user.name || 'User';
      const initial = name.charAt(0).toUpperCase();
      const color = getColorFromName(name);
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=${color}&color=fff&bold=true&size=36`;
    }
    
    // Если есть photoUrl
    if (user.photoUrl && user.photoUrl.trim() !== '') {
      if (user.photoUrl.startsWith('http')) {
        return user.photoUrl;
      }
      return `${API_BASE}${user.photoUrl}`;
    }
    
    // Если нет photoUrl, показываем инициальный аватар
    const name = user.name || 'User';
    const initial = name.charAt(0).toUpperCase();
    const color = getColorFromName(name);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=${color}&color=fff&bold=true&size=36`;
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
      <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-24 py-12 relative z-10">
        <Link to="/" className="absolute top-8 left-6 md:left-12 flex items-center gap-2 group">
          <div className="bg-orange-600 text-white p-1.5 rounded-lg shadow-sm group-hover:bg-orange-700 transition-colors">
            <HeartHandshake size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">VoluKZ</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome back</h1>
          <p className="text-slate-500 font-medium mb-10 text-lg">Enter your details to access your dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all shadow-sm font-medium placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <a href="#" className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all shadow-sm font-medium placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 focus:ring-4 focus:ring-orange-200 transition-all shadow-md mt-4 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Секция быстрых пользователей */}
          {quickUsers.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <User size={14} className="text-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Quick Login Users
                </p>
              </div>
              <div className="grid gap-2 max-h-64 overflow-y-auto pr-1">
                {quickUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => quickLogin(user.email)}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left hover:bg-slate-50 hover:border-orange-200 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={getAvatarSrc(user)}
                        onError={() => handleImageError(user.id)}
                        alt={user.name}
                        className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user.role} · {user.region}
                        </p>
                      </div>
                    </div>
                    <span className="rounded bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700 ml-2 group-hover:bg-orange-200 transition-colors">
                      Use
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoadingQuickUsers && (
            <div className="mt-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
            </div>
          )}

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-orange-600 hover:text-orange-700 transition-colors">
              Sign up as a Volunteer
            </Link>
          </p>
        </motion.div>
      </div>

      <div className="hidden lg:block lg:flex-1 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-orange-600/20 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent z-10" />
        <img
          src="https://images.unsplash.com/photo-1758599668547-2b1192c10abb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2b2x1bnRlZXJpbmclMjBjb21tdW5pdHklMjBkaXZlcnNlJTIwZ3JvdXB8ZW58MXx8fHwxNzc2MjYxNTk2fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Volunteers"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute bottom-0 left-0 p-16 z-20 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-wider mb-6">
              Impact Highlight
            </div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4 drop-shadow-sm">
              "VoluKZ changed how we organize community cleanups entirely."
            </h2>
            <p className="text-orange-100 font-medium text-lg drop-shadow-sm">
              — Aruzhan K., Coordinator at EcoAlmaty
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}