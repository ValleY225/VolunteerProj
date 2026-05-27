import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { HeartHandshake, Mail, Lock, User, ArrowRight, CheckCircle2, MapPin, Calendar, Camera } from 'lucide-react';

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ??
  (window.location.hostname === 'localhost' ? 'http://localhost:4000' : '');

// Регионы из server.js
const REGIONS = ['Almaty', 'Astana'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'Participant' | 'Coordinator' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const handleRoleSelect = (selectedRole: 'Participant' | 'Coordinator') => {
    setRole(selectedRole);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1 && role) {
      setStep(2);
      return;
    }
    
    if (step === 2) {
      setIsLoading(true);
      setError('');
      
      try {
        // Validate all fields
        if (!name || !email || !password || !region || !birthDate || !photo) {
          throw new Error('All fields are required');
        }
        
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        
        // Create FormData
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('region', region);
        formData.append('birthDate', birthDate);
        formData.append('role', role);
        // Use a conditional to check if photo exists
        if (photo) {
          formData.append('photo', photo);
        }
        
        // Send registration to backend
        const response = await fetch(`${API_BASE}/api/register`, {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Registration failed');
        }
        
        // Registration successful - redirect to login
        setTimeout(() => {
          navigate('/login');
        }, 1500);
        
      } catch (err: any) {
        setError(err.message || 'Registration failed. Please try again.');
        setIsLoading(false);
      }
    }
  };

  // Reset error when changing steps
  const goBack = () => {
    setStep(1);
    setError('');
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
          {/* Stepper */}
          <div className="flex items-center gap-2 mb-10">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-orange-600' : 'bg-slate-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-orange-600' : 'bg-slate-200'}`} />
          </div>

          {step === 1 ? (
            <>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Join VoluKZ</h1>
              <p className="text-slate-500 font-medium mb-10 text-lg">How would you like to participate?</p>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('Participant')}
                  className={`w-full p-6 border-2 rounded-2xl text-left transition-all duration-200 flex gap-4 ${
                    role === 'Participant' 
                      ? 'border-orange-600 bg-orange-50 shadow-md scale-[1.02]' 
                      : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    role === 'Participant' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                      I'm a Volunteer
                      {role === 'Participant' && <CheckCircle2 size={18} className="text-orange-600" />}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">I want to find opportunities, join events, and track my hours.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('Coordinator')}
                  className={`w-full p-6 border-2 rounded-2xl text-left transition-all duration-200 flex gap-4 ${
                    role === 'Coordinator' 
                      ? 'border-emerald-600 bg-emerald-50 shadow-md scale-[1.02]' 
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    role === 'Coordinator' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <HeartHandshake size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                      I'm an NGO Coordinator
                      {role === 'Coordinator' && <CheckCircle2 size={18} className="text-emerald-600" />}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">I want to post shifts, manage volunteers, and track our impact.</p>
                  </div>
                </button>

                <button 
                  onClick={handleSubmit}
                  disabled={!role}
                  className="w-full mt-8 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  Continue
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </>
          ) : (
            <>
              <button 
                type="button"
                onClick={goBack} 
                className="text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 flex items-center gap-1 transition-colors"
              >
                <ArrowRight size={16} className="rotate-180" /> Back
              </button>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Create account</h1>
              <p className="text-slate-500 font-medium mb-6 text-lg">Enter your details to get started.</p>

              {/* Error message */}
              {error && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Full Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <User size={18} />
                    </div>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aruzhan K."
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Email Address *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Password * (min. 8 characters)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Region *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <MapPin size={18} />
                    </div>
                    <select
                      required
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="">Select region</option>
                      {REGIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Date of Birth *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Calendar size={18} />
                    </div>
                    <input 
                      type="date" 
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Profile Photo *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <Camera size={18} />
                    </div>
                    <input 
                      type="file" 
                      required
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all shadow-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                    />
                  </div>
                  {photoPreview && (
                    <div className="mt-2">
                      <img src={photoPreview} alt="Preview" className="h-20 w-20 rounded-full object-cover border-2 border-orange-200" />
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 focus:ring-4 focus:ring-orange-200 transition-all shadow-md mt-6 disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Complete Registration
                      <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                    </>
                  )}
                </button>
              </form>
              
              {isLoading && (
                <p className="mt-4 text-center text-sm text-slate-500">
                  Creating your account...
                </p>
              )}
            </>
          )}

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Already have an account? <Link to="/login" className="font-bold text-orange-600 hover:text-orange-700 transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>

      <div className="hidden lg:block lg:flex-1 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-teal-600/20 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1774504798113-a03e2aa24789?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBkZXZlbG9wbWVudCUyMHBlb3BsZXxlbnwxfHx8fDE3NzYyNjE1OTN8MA&ixlib=rb-4.1.0&q=80&w=1080" 
          alt="Community Development" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        
        <div className="absolute bottom-0 left-0 p-16 z-20 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold uppercase tracking-wider mb-6">
              Join the Movement
            </div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4 drop-shadow-sm">
              "Over 5,000 volunteers are already making a real difference across Kazakhstan."
            </h2>
            <div className="flex items-center gap-3 mt-8">
              <div className="flex -space-x-3">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=faces&fit=crop&w=100&h=100&q=80" alt="Peer" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=faces&fit=crop&w=100&h=100&q=80" alt="Peer" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?crop=faces&fit=crop&w=100&h=100&q=80" alt="Peer" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
              </div>
              <p className="text-sm font-medium text-teal-50 drop-shadow-sm">Join them today</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}