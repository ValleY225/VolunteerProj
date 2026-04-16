import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { HeartHandshake, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 800);
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
                <a href="#" className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors">Forgot password?</a>
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

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Don't have an account? <Link to="/register" className="font-bold text-orange-600 hover:text-orange-700 transition-colors">Sign up as a Volunteer</Link>
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