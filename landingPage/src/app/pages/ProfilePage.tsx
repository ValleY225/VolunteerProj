import React from 'react';
import { motion } from 'motion/react';
import { Clock, Trophy, MapPin, Award, BookOpen, Star, CalendarDays, Edit3, CheckCircle2, UserSquare2 } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Profile Card */}
      <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-50 to-teal-50 rounded-bl-full opacity-60 -z-0 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=faces&fit=crop&w=200&h=200&q=80" 
              alt="Dias M." 
              className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-lg"
            />
            <button className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors shadow-md border-2 border-white">
              <Edit3 size={16} />
            </button>
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dias Muratov</h1>
                <p className="text-lg font-medium text-slate-500 mt-1">Almaty, Kazakhstan</p>
              </div>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-bold uppercase tracking-widest border border-orange-200/50">
                <Star size={16} className="fill-orange-600 text-orange-600" /> Top Volunteer
              </span>
            </div>
            
            <p className="text-slate-600 font-medium max-w-xl leading-relaxed mb-6">
              Passionate about environmental sustainability and youth education. Studying Computer Science at KazNU. Always ready to lend a hand for a good cause!
            </p>
            
            <div className="flex flex-wrap gap-3">
              {['English (Fluent)', 'Kazakh (Native)', 'First Aid Certified', 'Event Coordination'].map((skill, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Stats & Badges */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900 mb-6">Impact Summary</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Total Hours</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">142.5</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Trophy size={24} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Shifts</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">34</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Locations</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">12</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-extrabold text-slate-900">Earned Badges</h3>
              <span className="text-sm font-bold text-orange-600">View All</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Award size={28} className="text-orange-500" />, title: 'Early Bird', color: 'orange' },
                { icon: <HeartHandshake size={28} className="text-rose-500" />, title: 'Care Giver', color: 'rose' },
                { icon: <BookOpen size={28} className="text-blue-500" />, title: 'Mentor', color: 'blue' },
                { icon: <Trophy size={28} className="text-emerald-500" />, title: 'Century', color: 'emerald' },
              ].map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center hover:bg-white hover:shadow-md transition-all cursor-pointer">
                  <div className={`w-14 h-14 rounded-full bg-${badge.color}-100 flex items-center justify-center mb-1`}>
                    {badge.icon}
                  </div>
                  <p className="text-xs font-bold text-slate-700 leading-tight">{badge.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm h-full">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-8">Volunteering History</h3>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-100 before:via-slate-200 before:to-slate-100">
              
              {[
                { date: 'Oct 15, 2026', title: 'City Park Cleanup', ngo: 'EcoAlmaty', hours: 4, role: 'Team Leader', status: 'Verified' },
                { date: 'Oct 02, 2026', title: 'Food Distribution', ngo: 'Community Care', hours: 3, role: 'Packer', status: 'Verified' },
                { date: 'Sep 18, 2026', title: 'Marathon Setup', ngo: 'RunKazakhstan', hours: 6, role: 'Logistics', status: 'Verified' },
                { date: 'Sep 05, 2026', title: 'Animal Shelter Day', ngo: 'Paws Rescue', hours: 5, role: 'Dog Walker', status: 'Verified' },
              ].map((item, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-orange-100 text-orange-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 transform -translate-x-1/2 z-10">
                    <CalendarDays size={16} />
                  </div>
                  
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group-odd:ml-auto group-even:mr-auto ml-12 md:ml-0">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{item.date}</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 size={12} /> {item.status}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-sm font-medium text-slate-500 mb-4">{item.ngo}</p>
                    
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md"><Clock size={14} className="text-slate-400"/> {item.hours} hrs</span>
                      <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><UserSquare2 size={14} className="text-slate-400"/> {item.role}</span>
                    </div>
                  </div>
                </div>
              ))}
              
            </div>
            
            <button className="w-full mt-8 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition-all">
              Load More History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
