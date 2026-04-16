import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, MapPin, Calendar, Users, HeartHandshake } from 'lucide-react';

export default function OpportunitiesPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Environmental', 'Animal Welfare', 'Community', 'Education', 'Health'];

  const opportunities = [
    {
      id: 1,
      title: "Tree Planting Drive",
      ngo: "EcoAlmaty",
      image: "https://images.unsplash.com/photo-1669553228878-bcacc4e49168?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbnZpcm9ubWVudGFsJTIwY29uc2VydmF0aW9uJTIwbmF0dXJlfGVufDF8fHx8MTc3NjIyMDc4MXww&ixlib=rb-4.1.0&q=80&w=1080",
      date: "This Saturday",
      spots: "15/40 filled",
      location: "Central Park, Almaty",
      category: "Environmental"
    },
    {
      id: 2,
      title: "Weekend Dog Walking",
      ngo: "Paws Rescue",
      image: "https://images.unsplash.com/photo-1774228170595-4d36960a2795?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltYWwlMjB3ZWxmYXJlJTIwd2lsZGxpZmUlMjByZXNjdWV8ZW58MXx8fHwxNzc2MjYxNTkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Every Sunday",
      spots: "8/10 filled",
      location: "Shelter #4, Astana",
      category: "Animal Welfare"
    },
    {
      id: 3,
      title: "Youth Mentorship Program",
      ngo: "Future Leaders KZ",
      image: "https://images.unsplash.com/photo-1758599668547-2b1192c10abb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2b2x1bnRlZXJpbmclMjBjb21tdW5pdHklMjBkaXZlcnNlJTIwZ3JvdXB8ZW58MXx8fHwxNzc2MjYxNTk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Starts Nov 1",
      spots: "12/20 filled",
      location: "Online / Hybrid",
      category: "Education"
    },
    {
      id: 4,
      title: "Food Bank Distribution",
      ngo: "Community Care",
      image: "https://images.unsplash.com/photo-1758390285798-59b0d7d46371?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZ28lMjBjb21tdW5pdHklMjB3b3JrZXJzfGVufDF8fHx8MTc3NjI2MTU5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Tomorrow, 14:00",
      spots: "Almost Full (2 left)",
      location: "Dostyk Ave 42",
      category: "Community"
    },
    {
      id: 5,
      title: "Farmstay Harvest Helper",
      ngo: "AgriKZ",
      image: "https://images.unsplash.com/photo-1774695475665-9bb23dff3d42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtJTIwc3RheSUyMGFncmljdWx0dXJlfGVufDF8fHx8MTc3NjI2MTU5M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Flexible (Weekends)",
      spots: "Open slots",
      location: "Almaty Region Farms",
      category: "Environmental"
    },
    {
      id: 6,
      title: "Community Builder Workshop",
      ngo: "Urban Dev",
      image: "https://images.unsplash.com/photo-1774504798113-a03e2aa24789?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBkZXZlbG9wbWVudCUyMHBlb3BsZXxlbnwxfHx8fDE3NzYyNjE1OTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      date: "Oct 28-29",
      spots: "30/50 filled",
      location: "Innovation Hub",
      category: "Community"
    }
  ];

  const filtered = activeCategory === 'All' 
    ? opportunities 
    : opportunities.filter(o => o.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Explore Opportunities</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Find the perfect cause to dedicate your time to.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search roles, NGOs..." 
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all shadow-sm font-medium"
            />
          </div>
          <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-orange-600 transition-colors shadow-sm flex-shrink-0">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex overflow-x-auto pb-4 -mb-4 hide-scrollbar gap-3">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 border ${
              activeCategory === cat 
                ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((opp, i) => (
          <motion.div
            key={opp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="group bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-400 flex flex-col h-full"
          >
            <div className="h-48 relative overflow-hidden bg-slate-100">
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold uppercase tracking-wider shadow-sm">
                  {opp.category}
                </span>
              </div>
              <div className="absolute top-4 right-4 z-10">
                <button className="p-2 rounded-full bg-white/90 backdrop-blur-md text-slate-400 hover:text-rose-500 hover:bg-white shadow-sm transition-all">
                  <HeartHandshake size={18} />
                </button>
              </div>
              <img 
                src={opp.image} 
                alt={opp.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>
            
            <div className="p-6 flex flex-col flex-1">
              <div className="mb-4">
                <p className="text-sm font-bold text-orange-600 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                  {opp.ngo}
                </p>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight group-hover:text-orange-600 transition-colors line-clamp-2">
                  {opp.title}
                </h3>
              </div>
              
              <div className="space-y-3 mb-8 mt-auto">
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar size={16} className="text-slate-400" />
                  <span className="text-sm font-medium">{opp.date}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="text-sm font-medium truncate">{opp.location}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Users size={16} className="text-slate-400" />
                  <span className="text-sm font-medium">{opp.spots}</span>
                </div>
              </div>
              
              <button className="w-full py-3.5 bg-slate-50 text-slate-900 font-bold rounded-xl hover:bg-orange-600 hover:text-white transition-all duration-300 border border-slate-200 group-hover:border-transparent">
                View Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}