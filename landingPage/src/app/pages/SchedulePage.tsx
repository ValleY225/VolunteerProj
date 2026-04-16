import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, MapPin, Clock, Edit, FileText, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState('Upcoming');
  
  const shifts = [
    {
      id: 1,
      title: "Chess Fide international between youngsters",
      description: "Chess tournament 6 - 11 March. We need volunteers. 1) Double shifts 2) Approvals 3) Certificates.",
      region: "Almaty Jester",
      status: "Pending",
      shiftTime: "Afternoon",
      type: "Upcoming"
    },
    {
      id: 2,
      title: "Astana City Marathon Support",
      description: "Assist with runner registration and water stations at the 10km mark. Early morning shift required.",
      region: "Astana Expo Center",
      status: "Confirmed",
      shiftTime: "Morning",
      type: "Upcoming"
    }
  ];

  const filteredShifts = shifts.filter(s => 
    activeTab === 'Upcoming' ? s.type === 'Upcoming' : s.type === 'Past'
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Events & Shift Join</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Manage your event applications and upcoming schedule.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {['Upcoming', 'Past', 'Pending'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Available Events & Applications</h2>
        
        <div className="grid gap-6">
          {filteredShifts.map((shift, i) => (
            <motion.div 
              key={shift.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full opacity-30 -z-0 group-hover:scale-110 transition-transform duration-700" />
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                      shift.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      Request status: {shift.status}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 mb-2">{shift.title}</h3>
                    <p className="text-slate-600 font-medium leading-relaxed max-w-3xl">
                      {shift.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm font-medium text-slate-500 pt-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-slate-400" />
                      Region: {shift.region}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col justify-end gap-3 md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                  <div className="relative">
                    <select className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm px-4 py-3 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none cursor-pointer">
                      <option value="Afternoon">{shift.shiftTime}</option>
                      <option value="Morning">Morning</option>
                      <option value="Evening">Evening</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  
                  <button className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 focus:ring-4 focus:ring-orange-200 transition-all shadow-sm">
                    {shift.status === 'Pending' ? 'Send Update Request' : 'Manage Shift'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredShifts.length === 0 && (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center">
              <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No shifts found</h3>
              <p className="text-slate-500">You don't have any {activeTab.toLowerCase()} shifts at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}