import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { 
  CalendarDays, 
  Clock, 
  BarChart3, 
  UserSquare2, 
  Building2, 
  Globe, 
  HelpCircle, 
  Menu, 
  X,
  ChevronRight,
  HeartHandshake,
  CheckCircle2,
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Bell,
  Search
} from 'lucide-react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/85 backdrop-blur-lg border-b border-slate-200/50 shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-orange-600 text-white p-2 rounded-xl group-hover:bg-orange-700 transition-colors shadow-sm">
            <HeartHandshake size={24} strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">VoluKZ</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm font-semibold text-slate-600 hover:text-orange-600 transition-colors">How it works</a>
          <Link to="/login" className="text-sm font-semibold text-orange-600 border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:border-orange-300 px-6 py-2.5 rounded-full transition-all shadow-sm hover:shadow">
            Sign In
          </Link>
        </nav>

        <button className="md:hidden text-slate-600 p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
      
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
          >
            <div className="flex flex-col px-6 py-4 gap-4">
              <a href="#how-it-works" className="text-base font-semibold text-slate-700">How it works</a>
              <Link to="/login" className="text-base font-semibold text-orange-600">Sign In</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white">
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-orange-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-teal-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold tracking-widest uppercase mb-8 border border-orange-200/50 shadow-sm">
              Empowering Kazakhstan's Future
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05] mb-6">
              Centralized <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Volunteer</span> <br/>
              Management System
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg font-medium">
              Forget Excel and chat chaos. Manage shifts, track volunteer hours, and scale your impact with one simple platform designed for NGOs and volunteers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-orange-600 text-white font-bold text-lg hover:bg-orange-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:ring-4 focus:ring-orange-200">
                Get Started Free
                <ChevronRight size={20} />
              </Link>
              <a href="#" className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-slate-100 text-slate-700 font-bold text-lg hover:bg-slate-200 hover:shadow-md transition-all duration-300">
                Learn More
              </a>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex -space-x-3">
                <img src="https://images.unsplash.com/photo-1758599668547-2b1192c10abb?crop=faces&fit=crop&w=100&h=100&q=80" alt="Volunteer" className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover" />
                <img src="https://images.unsplash.com/photo-1774504798113-a03e2aa24789?crop=faces&fit=crop&w=100&h=100&q=80" alt="Volunteer" className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover" />
                <img src="https://images.unsplash.com/photo-1698827623344-24b7d14e57a8?crop=faces&fit=crop&w=100&h=100&q=80" alt="Volunteer" className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover" />
              </div>
              <p className="text-sm font-medium text-slate-500 leading-tight">
                Joined by <span className="text-slate-800 font-bold">5,000+</span> volunteers <br className="hidden sm:block"/> in Almaty and Astana
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            className="relative lg:pl-8"
          >
            <div className="aspect-[4/3] w-full rounded-[2.5rem] bg-[#9CBDB1] shadow-2xl overflow-hidden relative p-8 md:p-12 flex items-center justify-center group transform transition-transform hover:scale-[1.02] duration-500">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              
              <div className="w-full h-full bg-slate-50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden flex border border-white/60 text-left relative z-10">
                <div className="w-14 hidden sm:flex bg-white border-r border-slate-200 flex-col items-center py-4 gap-6 z-10">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner mb-1">
                    <HeartHandshake size={18} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col gap-5 text-slate-400 w-full items-center">
                    <div className="p-2 rounded-lg bg-orange-50 text-orange-600 relative">
                      <LayoutDashboard size={18} strokeWidth={2} />
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-orange-600 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    </div>
                    <Users size={18} className="hover:text-slate-600 transition-colors cursor-pointer" />
                    <Calendar size={18} className="hover:text-slate-600 transition-colors cursor-pointer" />
                    <BarChart3 size={18} className="hover:text-slate-600 transition-colors cursor-pointer" />
                  </div>
                  <div className="mt-auto">
                    <Settings size={18} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" />
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                  <div className="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-4 z-10">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-slate-400 w-40">
                      <Search size={14} />
                      <span className="text-[10px] font-medium">Search volunteers...</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                        <Bell size={16} />
                        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white"></div>
                      </div>
                      <div className="w-6 h-6 rounded-full border border-slate-200 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=faces&fit=crop&w=100&h=100&q=80" alt="Admin" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-4 flex-1 overflow-hidden bg-slate-50/50">
                    <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-base font-extrabold text-slate-800 leading-tight">Today's Overview</h2>
                        <p className="text-[10px] text-slate-500 font-medium">Sat, Oct 24 • Astana Marathon</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-colors">
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">On Site</p>
                          <div className="flex items-baseline gap-1.5">
                            <p className="text-xl font-black text-slate-800">124</p>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">+12</span>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-colors">
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Total Hours</p>
                          <div className="flex items-baseline gap-1.5">
                            <p className="text-xl font-black text-slate-800">856</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <Clock size={16} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
                      <div className="px-3 py-2.5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <p className="text-[11px] font-bold text-slate-800">Live Shift Status</p>
                        <button className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md hover:bg-orange-100 transition-colors">View All</button>
                      </div>
                      <div className="p-1.5 flex flex-col gap-0.5 overflow-y-auto">
                        {[
                          { name: "Aruzhan K.", role: "Registration Desk", time: "08:00 - 14:00", status: "Checked In", statusColor: "emerald", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=faces&fit=crop&w=100&h=100&q=80" },
                          { name: "Dias M.", role: "Crowd Control", time: "09:00 - 15:00", status: "Pending", statusColor: "amber", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=faces&fit=crop&w=100&h=100&q=80" },
                          { name: "Madina T.", role: "Information Guide", time: "08:00 - 14:00", status: "Checked In", statusColor: "emerald", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?crop=faces&fit=crop&w=100&h=100&q=80" }
                        ].map((vol, i) => (
                          <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
                            <div className="flex items-center gap-2.5">
                              <img src={vol.img} alt={vol.name} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                              <div>
                                <p className="text-[11px] font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{vol.name}</p>
                                <p className="text-[9px] text-slate-500 font-medium">{vol.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-slate-400 font-medium hidden sm:block">{vol.time}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded flex items-center justify-center font-bold w-16 text-center ${
                                vol.statusColor === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {vol.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <motion.div 
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute -bottom-8 -left-8 md:-left-12 bg-white p-5 rounded-2xl shadow-xl flex items-center gap-4 border border-slate-100/50 backdrop-blur-md"
            >
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 shadow-inner">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">Shift Confirmed</p>
                <p className="text-sm font-medium text-slate-500">Today, 10:00 AM</p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

const Roles = () => {
  return (
    <section className="py-24 bg-[#FDF9F8]">
      <div className="container mx-auto px-6 md:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Join the VoluKZ Community</h2>
          <p className="text-xl text-slate-600 font-medium">Choose your path to making a difference in Kazakhstan</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
          <motion.div 
            whileHover={{ y: -8 }}
            className="bg-white rounded-[2rem] p-8 md:p-14 shadow-sm hover:shadow-2xl transition-all duration-400 border border-slate-100 flex flex-col items-center group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
            
            <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-10 group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-300 relative z-10">
              <UserSquare2 size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-6 relative z-10">I am a Volunteer</h3>
            <p className="text-lg text-slate-600 mb-12 leading-relaxed relative z-10">
              Discover opportunities, log your volunteering hours, and build your portfolio. Connect with causes that matter to you.
            </p>
            <Link to="/login" className="mt-auto w-full inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-orange-600 text-white font-bold text-lg hover:bg-orange-700 hover:shadow-lg transition-all relative z-10">
              Register as Volunteer
            </Link>
          </motion.div>

          <motion.div 
            whileHover={{ y: -8 }}
            className="bg-white rounded-[2rem] p-8 md:p-14 shadow-sm hover:shadow-2xl transition-all duration-400 border border-slate-100 flex flex-col items-center group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
            
            <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 mb-10 group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-300 relative z-10">
              <Building2 size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-6 relative z-10">I am an NGO Coordinator</h3>
            <p className="text-lg text-slate-600 mb-12 leading-relaxed relative z-10">
              Post volunteering opportunities, manage applications, track attendance, and generate reports automatically.
            </p>
            <Link to="/login" className="mt-auto w-full inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-orange-600 text-white font-bold text-lg hover:bg-orange-700 hover:shadow-lg transition-all relative z-10">
              Register Organization
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    {
      icon: <CalendarDays size={32} strokeWidth={1.5} />,
      title: "Shift Scheduling",
      description: "No more messy spreadsheets. Create shifts and let volunteers sign up in real-time."
    },
    {
      icon: <Clock size={32} strokeWidth={1.5} />,
      title: "Hour Tracking",
      description: "Automated check-ins and check-outs for accurate volunteering hour verification."
    },
    {
      icon: <BarChart3 size={32} strokeWidth={1.5} />,
      title: "Impact Reporting",
      description: "Generate professional impact reports for your board and donors with one click."
    }
  ];

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-3 gap-16 max-w-6xl mx-auto">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              className="flex flex-col group cursor-default"
            >
              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-8 group-hover:bg-orange-600 group-hover:text-white group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                {feature.icon}
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h4>
              <p className="text-lg text-slate-600 leading-relaxed font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Categories = () => {
  const categories = [
    { title: "Sustainable Projects", image: "https://images.unsplash.com/photo-1698827623344-24b7d14e57a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMHByb2plY3RzJTIwdm9sdW50ZWVyfGVufDF8fHx8MTc3NjI2MTU5M3ww&ixlib=rb-4.1.0&q=80&w=1080", span: "md:col-span-2" },
    { title: "Farmstay", image: "https://images.unsplash.com/photo-1774695475665-9bb23dff3d42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtJTIwc3RheSUyMGFncmljdWx0dXJlfGVufDF8fHx8MTc3NjI2MTU5M3ww&ixlib=rb-4.1.0&q=80&w=1080", span: "md:col-span-1" },
    { title: "NGO", image: "https://images.unsplash.com/photo-1758390285798-59b0d7d46371?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZ28lMjBjb21tdW5pdHklMjB3b3JrZXJzfGVufDF8fHx8MTc3NjI2MTU5M3ww&ixlib=rb-4.1.0&q=80&w=1080", span: "md:col-span-1" },
    { title: "Animal Welfare", image: "https://images.unsplash.com/photo-1774228170595-4d36960a2795?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltYWwlMjB3ZWxmYXJlJTIwd2lsZGxpZmUlMjByZXNjdWV8ZW58MXx8fHwxNzc2MjYxNTkzfDA&ixlib=rb-4.1.0&q=80&w=1080", span: "md:col-span-2" },
    { title: "Environmental Conservation", image: "https://images.unsplash.com/photo-1669553228878-bcacc4e49168?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbnZpcm9ubWVudGFsJTIwY29uc2VydmF0aW9uJTIwbmF0dXJlfGVufDF8fHx8MTc3NjIyMDc4MXww&ixlib=rb-4.1.0&q=80&w=1080", span: "md:col-span-2" },
    { title: "Community Development", image: "https://images.unsplash.com/photo-1774504798113-a03e2aa24789?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBkZXZlbG9wbWVudCUyMHBlb3BsZXxlbnwxfHx8fDE3NzYyNjE1OTN8MA&ixlib=rb-4.1.0&q=80&w=1080", span: "md:col-span-1" }
  ];

  return (
    <section className="py-24 bg-white relative border-t border-slate-50">
      <div className="w-full px-4 md:px-6 mx-auto max-w-[1800px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-[300px] lg:auto-rows-[400px]">
          {categories.map((cat, idx) => (
            <motion.a 
              href="#" 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className={`group relative overflow-hidden rounded-[2rem] block ${cat.span} shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer`}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-105"
                style={{ backgroundImage: `url(${cat.image})` }}
              />
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/35 transition-colors duration-500" />
              <div className="absolute inset-0 p-8 flex items-center justify-center">
                <h3 className="text-3xl lg:text-4xl font-extrabold text-center tracking-tight text-white drop-shadow-lg transform transition-transform duration-500 group-hover:scale-105">
                  {cat.title}
                </h3>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-100 py-12 md:py-16">
      <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <a href="#" className="flex items-center gap-2 group">
          <div className="bg-orange-600 text-white p-1.5 rounded-lg shadow-sm">
            <HeartHandshake size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">VoluKZ</span>
        </a>
        
        <p className="text-sm font-medium text-slate-500">© 2026 VoluKZ. All rights reserved.</p>
        
        <div className="flex items-center gap-6 text-slate-400">
          <a href="#" className="hover:text-slate-900 transition-colors bg-slate-50 p-2 rounded-full hover:bg-slate-100"><Globe size={20} /></a>
          <a href="#" className="hover:text-slate-900 transition-colors bg-slate-50 p-2 rounded-full hover:bg-slate-100"><HelpCircle size={20} /></a>
        </div>
      </div>
    </footer>
  );
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Roles />
        <Features />
        <Categories />
      </main>
      <Footer />
    </div>
  );
}