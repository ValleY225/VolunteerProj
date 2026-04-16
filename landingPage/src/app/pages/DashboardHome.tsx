import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { 
  Clock, 
  MapPin, 
  CalendarDays, 
  Trophy, 
  Heart,
  ChevronRight,
  Award,
  ArrowUpRight
} from 'lucide-react';

export default function DashboardHome() {
  const stats = [
    { label: 'Total Hours', value: '142.5', icon: <Clock size={24} className="text-blue-500" />, bg: 'bg-blue-50', trend: '+12 this month' },
    { label: 'Impact Score', value: '8.4K', icon: <Heart size={24} className="text-rose-500" />, bg: 'bg-rose-50', trend: 'Top 5% of users' },
    { label: 'Shifts Completed', value: '34', icon: <Trophy size={24} className="text-amber-500" />, bg: 'bg-amber-50', trend: '+3 this month' },
  ];

  const upcomingShifts = [
    {
      id: 1,
      title: "Astana City Marathon",
      ngo: "RunKazakhstan",
      date: "Oct 24, 2026",
      time: "06:00 - 14:00",
      location: "Astana Expo Center",
      role: "Water Station Coordinator",
      status: "Confirmed"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back, Dias! 👋</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Here's your volunteering impact at a glance.</p>
        </div>
        <Link 
          to="/dashboard/opportunities" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 hover:shadow-lg transition-all"
        >
          Find New Opportunities
          <ChevronRight size={18} />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-start justify-between group hover:shadow-xl transition-all duration-300"
          >
            <div>
              <p className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-3">{stat.label}</p>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{stat.value}</h3>
              <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                <ArrowUpRight size={14} />
                {stat.trend}
              </p>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Shift */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900">Your Next Shift</h2>
              <Link to="/dashboard/schedule" className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1">
                View Schedule <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-colors">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-bl-full opacity-30 -z-0 group-hover:scale-110 transition-transform duration-700" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                    {upcomingShifts[0].status}
                  </span>
                  <span className="text-sm font-bold text-slate-400">Starts in 3 days</span>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="hidden sm:block">
                    <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex flex-col items-center justify-center font-bold">
                      <span className="text-xs uppercase opacity-80">Oct</span>
                      <span className="text-xl">24</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 mb-2">{upcomingShifts[0].title}</h3>
                    <p className="text-lg text-slate-500 font-medium mb-6">by {upcomingShifts[0].ngo}</p>
                    
                    <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Clock size={18} className="text-slate-400" />
                        <span className="font-semibold text-sm">{upcomingShifts[0].time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <MapPin size={18} className="text-slate-400" />
                        <span className="font-semibold text-sm truncate">{upcomingShifts[0].location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600 sm:col-span-2">
                        <UserSquare2 size={18} className="text-slate-400" />
                        <span className="font-semibold text-sm">Role: {upcomingShifts[0].role}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex -space-x-3">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=faces&fit=crop&w=100&h=100&q=80" alt="Peer" className="w-10 h-10 rounded-full border-2 border-white" />
                    <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?crop=faces&fit=crop&w=100&h=100&q=80" alt="Peer" className="w-10 h-10 rounded-full border-2 border-white" />
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">+12</div>
                  </div>
                  <button className="px-6 py-2.5 rounded-xl bg-slate-50 text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors border border-slate-200">
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-600 rounded-full blur-3xl opacity-50" />
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6">
                <Award size={24} className="text-orange-400" />
              </div>
              <h3 className="text-2xl font-extrabold mb-3">Eco Warrior Badge</h3>
              <p className="text-slate-300 font-medium mb-6 leading-relaxed">
                You're just 4 hours away from earning the Eco Warrior status. Join a sustainability project this weekend!
              </p>
              <div className="w-full bg-white/10 rounded-full h-3 mb-3">
                <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full" style={{ width: '80%' }}></div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-right">16 / 20 hrs</p>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900 mb-6">Recent Activity</h3>
            <div className="space-y-6">
              {[
                { title: 'Checked out of Animal Shelter', time: '2 days ago', icon: <Heart size={16} className="text-rose-500" /> },
                { title: 'Earned "Early Bird" Badge', time: '1 week ago', icon: <Award size={16} className="text-amber-500" /> },
                { title: 'Registered for City Marathon', time: '2 weeks ago', icon: <CalendarDays size={16} className="text-blue-500" /> },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {activity.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{activity.title}</p>
                    <p className="text-xs font-medium text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}