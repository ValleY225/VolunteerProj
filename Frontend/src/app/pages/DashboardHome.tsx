import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { 
  Clock, 
  MapPin, 
  CalendarDays, 
  Trophy, 
  Heart,
  ChevronRight,
  ArrowUpRight,
  User,
  Briefcase
} from 'lucide-react';

const API_BASE = (() => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  return '';
})();

interface Shift {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  volunteersNeeded: number;
}

interface Event {
  id: string;
  name: string;
  description: string;
  region: string;
  shifts?: Shift[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
  photoUrl?: string;
}

interface Join {
  id: string;
  eventId: string;
  eventName: string;
  eventRegion: string;
  shift: string;
  status: string;
  requestedAt: string;
  decidedAt?: string;
}

export default function DashboardHome() {
  const [user, setUser] = useState<User | null>(null);
  const [approvedJoins, setApprovedJoins] = useState<Join[]>([]);
  const [pendingJoins, setPendingJoins] = useState<Join[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    const storedUser = localStorage.getItem('ngo_current_user');
    if (!storedUser) {
      setIsLoading(false);
      return;
    }
    
    const currentUser = JSON.parse(storedUser);
    setUser(currentUser);
    
    try {
      const [joinsRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/${currentUser.id}/joins`),
        fetch(`${API_BASE}/api/items`)
      ]);
      
      const [joinsData, eventsData] = await Promise.all([
        joinsRes.json(),
        eventsRes.json()
      ]);
      
      const parsedEvents = eventsData.map((event: any) => ({
        ...event,
        shifts: event.shifts ? (typeof event.shifts === 'string' ? JSON.parse(event.shifts) : event.shifts) : []
      }));
      
      setEvents(parsedEvents);
      setApprovedJoins(joinsData.filter((j: Join) => j.status === 'approved'));
      setPendingJoins(joinsData.filter((j: Join) => j.status === 'pending'));
      
    } catch (err) {
      console.error('Failed to load joins:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getShiftDetails = useCallback((eventId: string, shiftName: string): Shift | null => {
    const event = events.find(e => e.id === eventId);
    if (!event || !event.shifts) return null;
    return event.shifts.find(s => s.name === shiftName) || null;
  }, [events]);

  // 🔧 ИСПРАВЛЕНО: проверка, прошла ли смена (по времени окончания)
  const isPastShift = useCallback((eventId: string, shiftName: string): boolean => {
    const shift = getShiftDetails(eventId, shiftName);
    if (!shift) return false;
    
    // Создаем дату и время ОКОНЧАНИЯ смены
    const [year, month, day] = shift.date.split('-');
    const [endHour, endMinute] = shift.endTime.split(':');
    const shiftEndDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(endHour), parseInt(endMinute));
    
    const now = new Date();
    return shiftEndDateTime < now;
  }, [getShiftDetails]);

  // 🔧 ИСПРАВЛЕНО: проверка, предстоящая ли смена (по времени окончания)
  const isUpcomingShift = useCallback((eventId: string, shiftName: string): boolean => {
    const shift = getShiftDetails(eventId, shiftName);
    if (!shift) return false;
    
    // Создаем дату и время ОКОНЧАНИЯ смены
    const [year, month, day] = shift.date.split('-');
    const [endHour, endMinute] = shift.endTime.split(':');
    const shiftEndDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(endHour), parseInt(endMinute));
    
    const now = new Date();
    return shiftEndDateTime > now;
  }, [getShiftDetails]);

  const getShiftDurationInHours = useCallback((startTime: string, endTime: string): number => {
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    
    let startMinutes = start[0] * 60 + (start[1] || 0);
    let endMinutes = end[0] * 60 + (end[1] || 0);
    
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const durationMinutes = endMinutes - startMinutes;
    return durationMinutes / 60;
  }, []);

  // Расчет часов только для прошедших смен
  const getTotalHours = useCallback((): number => {
    let total = 0;
    approvedJoins.forEach(join => {
      if (isPastShift(join.eventId, join.shift)) {
        const shift = getShiftDetails(join.eventId, join.shift);
        if (shift) {
          total += getShiftDurationInHours(shift.startTime, shift.endTime);
        } else {
          total += 4;
        }
      }
    });
    return total;
  }, [approvedJoins, isPastShift, getShiftDetails, getShiftDurationInHours]);

  // Количество завершенных смен (прошедших)
  const getCompletedShiftsCount = useCallback((): number => {
    return approvedJoins.filter(join => isPastShift(join.eventId, join.shift)).length;
  }, [approvedJoins, isPastShift]);

  const totalHours = getTotalHours();
  const completedShifts = getCompletedShiftsCount();

  // Предстоящие смены (по времени окончания)
  const upcomingApprovedJoins = approvedJoins.filter(join => 
    isUpcomingShift(join.eventId, join.shift)
  );
  
  const nextShift = upcomingApprovedJoins[0] || null;
  const nextShiftDetails = nextShift ? getShiftDetails(nextShift.eventId, nextShift.shift) : null;

  const stats = [
    { label: 'Total Hours', value: totalHours.toFixed(1), icon: <Clock size={24} className="text-blue-500" />, bg: 'bg-blue-50', trend: `${completedShifts} completed shifts` },
    { label: 'Active Applications', value: pendingJoins.length.toString(), icon: <Briefcase size={24} className="text-amber-500" />, bg: 'bg-amber-50', trend: 'Waiting for approval' },
    { label: 'Completed Shifts', value: completedShifts.toString(), icon: <Trophy size={24} className="text-emerald-500" />, bg: 'bg-emerald-50', trend: 'Total completed' },
  ];

  const getDaysLeft = useCallback((eventId: string, shiftName: string): number | null => {
    const shift = getShiftDetails(eventId, shiftName);
    if (!shift) return null;
    
    // Используем время НАЧАЛА смены для отображения дней до события
    const [year, month, day] = shift.date.split('-');
    const [startHour, startMinute] = shift.startTime.split(':');
    const shiftStartDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(startHour), parseInt(startMinute));
    
    const now = new Date();
    const diffTime = shiftStartDateTime.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, [getShiftDetails]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="h-9 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-6 w-80 bg-slate-200 rounded-lg mt-2 animate-pulse" />
          </div>
          <div className="h-12 w-48 bg-slate-200 rounded-full animate-pulse" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-[2rem] p-8 border border-slate-100">
              <div className="h-4 w-24 bg-slate-200 rounded mb-3 animate-pulse" />
              <div className="h-10 w-16 bg-slate-200 rounded mb-2 animate-pulse" />
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="h-8 w-32 bg-slate-200 rounded mb-4 animate-pulse" />
            <div className="bg-white rounded-[2rem] p-8">
              <div className="h-32 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          </div>
          <div className="space-y-8">
            <div className="h-64 bg-gradient-to-r from-orange-600 to-orange-500 rounded-[2rem] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
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
        <div className="lg:col-span-2 space-y-8">
          {nextShift ? (
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
                      Approved
                    </span>
                    {(() => {
                      const daysLeft = getDaysLeft(nextShift.eventId, nextShift.shift);
                      return daysLeft !== null && daysLeft >= 0 && (
                        <span className="text-sm font-bold text-slate-400">
                          {daysLeft === 0 ? 'Today!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days away`}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex gap-6 items-start">
                    {(() => {
                      const shiftDate = getShiftDetails(nextShift.eventId, nextShift.shift)?.date;
                      return shiftDate && (
                        <div className="hidden sm:block">
                          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex flex-col items-center justify-center font-bold">
                            <span className="text-xs uppercase opacity-80">
                              {new Date(shiftDate).toLocaleDateString('en', { month: 'short' })}
                            </span>
                            <span className="text-xl">
                              {new Date(shiftDate).getDate()}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                    <div>
                      <h3 className="text-2xl font-extrabold text-slate-900 mb-2">{nextShift.eventName}</h3>
                      <p className="text-lg text-slate-500 font-medium mb-6">{nextShift.eventRegion}</p>
                      
                      <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
                        <div className="flex items-center gap-3 text-slate-600">
                          <Clock size={18} className="text-slate-400" />
                          <span className="font-semibold text-sm">{nextShift.shift} shift</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                          <MapPin size={18} className="text-slate-400" />
                          <span className="font-semibold text-sm">{nextShift.eventRegion}, Kazakhstan</span>
                        </div>
                        {(() => {
                          const shiftDate = getShiftDetails(nextShift.eventId, nextShift.shift)?.date;
                          return shiftDate && (
                            <div className="flex items-center gap-3 text-slate-600">
                              <CalendarDays size={18} className="text-slate-400" />
                              <span className="font-semibold text-sm">{new Date(shiftDate).toLocaleDateString()}</span>
                            </div>
                          );
                        })()}
                        {nextShiftDetails && (
                          <div className="flex items-center gap-3 text-slate-600">
                            <Clock size={18} className="text-slate-400" />
                            <span className="font-semibold text-sm">
                              {nextShiftDetails.startTime} - {nextShiftDetails.endTime}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100">
              <Briefcase size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No upcoming shifts</h3>
              <p className="text-slate-500 mb-6">You haven't been approved for any upcoming events yet.</p>
              <Link 
                to="/dashboard/opportunities" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700"
              >
                Browse Opportunities
                <ChevronRight size={18} />
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {pendingJoins.length > 0 && (
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-6">Pending Applications</h3>
              <div className="space-y-4">
                {pendingJoins.slice(0, 3).map((join) => (
                  <div key={join.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <Clock size={14} className="text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{join.eventName}</p>
                      <p className="text-xs text-slate-500">{join.shift} shift</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-6">
                <Heart size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-extrabold mb-3">Ready to make an impact?</h3>
              <p className="text-orange-100 font-medium mb-6 leading-relaxed">
                Check out new volunteering opportunities in your region.
              </p>
              <Link 
                to="/dashboard/opportunities"
                className="block text-center px-4 py-3 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-colors"
              >
                Find Opportunities
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}