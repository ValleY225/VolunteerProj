import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Calendar, MapPin, Clock, Edit, FileText, CheckCircle2, AlertCircle, ChevronDown, X } from 'lucide-react';

const API_BASE = (() => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  return '';
})();

const SHIFT_OPTIONS = ['Morning', 'Afternoon', 'Night'];

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

interface JoinRequest {
  id: string;
  eventId: string;
  eventName: string;
  eventRegion: string;
  shift: string;
  status: 'pending' | 'approved' | 'declined';
  requestedAt: string;
  decidedAt?: string;
  formAnswers?: any;
}

export default function SchedulePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past' | 'Pending'>('Upcoming');
  const [joins, setJoins] = useState<JoinRequest[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<Record<string, string>>({});
  const [showUpdateModal, setShowUpdateModal] = useState<JoinRequest | null>(null);
  const [message, setMessage] = useState<{ text: string; type: string; id?: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('ngo_current_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserId(user.id);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // 🚀 ПАРАЛЛЕЛЬНЫЕ запросы
      const [joinsRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE}/api/participants/${userId}/joins`),
        fetch(`${API_BASE}/api/items`)
      ]);
      
      // Параллельный парсинг JSON
      const [joinsData, eventsData] = await Promise.all([
        joinsRes.json(),
        eventsRes.json()
      ]);
      
      // Parse shifts from events
      const parsedEvents = eventsData.map((event: any) => ({
        ...event,
        shifts: event.shifts ? (typeof event.shifts === 'string' ? JSON.parse(event.shifts) : event.shifts) : []
      }));
      
      setEvents(parsedEvents);
      setJoins(joinsData);
      
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const getShiftDetails = useCallback((eventId: string, shiftName: string): Shift | null => {
    const event = events.find(e => e.id === eventId);
    if (!event || !event.shifts) return null;
    return event.shifts.find(s => s.name === shiftName) || null;
  }, [events]);

  const getShiftDate = useCallback((eventId: string, shiftName: string): Date | null => {
    const shift = getShiftDetails(eventId, shiftName);
    if (!shift) return null;
    return new Date(shift.date);
  }, [getShiftDetails]);

  const getShiftStartTime = useCallback((eventId: string, shiftName: string): string | null => {
    const shift = getShiftDetails(eventId, shiftName);
    if (!shift) return null;
    return shift.startTime;
  }, [getShiftDetails]);

  const getShiftEndTime = useCallback((eventId: string, shiftName: string): string | null => {
    const shift = getShiftDetails(eventId, shiftName);
    if (!shift) return null;
    return shift.endTime;
  }, [getShiftDetails]);

  // Функция для проверки, прошла ли смена уже (с учетом времени окончания)
  const isUpcomingShift = useCallback((eventId: string, shiftName: string): boolean => {
    const shift = getShiftDetails(eventId, shiftName);
    if (!shift) return false;
    
    // Создаем дату и время ОКОНЧАНИЯ смены
    const [year, month, day] = shift.date.split('-');
    const [endHour, endMinute] = shift.endTime.split(':');
    const shiftEndDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(endHour), parseInt(endMinute));
    
    const now = new Date();
    
    // Смена считается предстоящей, если время окончания еще не наступило
    return shiftEndDateTime > now;
  }, [getShiftDetails]);

  // Функция для расчета оставшихся дней (до начала смены, для отображения)
  const getDaysLeft = useCallback((eventId: string, shiftName: string): number | null => {
    const shift = getShiftDetails(eventId, shiftName);
    if (!shift) return null;
    
    const [year, month, day] = shift.date.split('-');
    const [startHour, startMinute] = shift.startTime.split(':');
    const shiftStartDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(startHour), parseInt(startMinute));
    
    const now = new Date();
    const diffTime = shiftStartDateTime.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, [getShiftDetails]);

  const getFilteredJoins = useCallback(() => {
    switch (activeTab) {
      case 'Pending':
        return joins.filter(j => j.status === 'pending');
      case 'Past':
        return joins.filter(j => {
          if (j.status !== 'approved') return false;
          return !isUpcomingShift(j.eventId, j.shift); // ← прошлые (время окончания уже прошло)
        });
      case 'Upcoming':
      default:
        return joins.filter(j => {
          if (j.status !== 'approved') return false;
          return isUpcomingShift(j.eventId, j.shift); // ← предстоящие (время окончания еще не наступило)
        });
    }
  }, [activeTab, joins, isUpcomingShift]);

  const handleUpdateShift = useCallback(async (joinId: string, newShift: string) => {
    const join = joins.find(j => j.id === joinId);
    if (!join) return;

    try {
      const response = await fetch(`${API_BASE}/api/items/${join.eventId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: userId, shift: newShift })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage({ text: result.message || 'Shift updated successfully!', type: 'success', id: joinId });
        loadData();
        setShowUpdateModal(null);
      } else {
        setMessage({ text: result.message || 'Failed to update shift', type: 'error', id: joinId });
      }
    } catch (error) {
      setMessage({ text: 'Network error', type: 'error', id: joinId });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  }, [joins, userId, loadData]);

  const filteredJoins = getFilteredJoins();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { 
          label: 'Confirmed', 
          className: 'bg-emerald-100 text-emerald-700',
          icon: <CheckCircle2 size={14} className="text-emerald-600" />
        };
      case 'declined':
        return { 
          label: 'Declined', 
          className: 'bg-red-100 text-red-700',
          icon: <AlertCircle size={14} className="text-red-600" />
        };
      default:
        return { 
          label: 'Pending', 
          className: 'bg-amber-100 text-amber-700',
          icon: <Clock size={14} className="text-amber-600" />
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Функция для расчета длительности (исправлена с учетом минут)
  const getDurationFormatted = (startTime: string, endTime: string): string => {
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    
    let startMinutes = start[0] * 60 + (start[1] || 0);
    let endMinutes = end[0] * 60 + (end[1] || 0);
    
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };

  // Skeleton Loader
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
          <div>
            <div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-6 w-80 bg-slate-200 rounded-lg mt-2 animate-pulse" />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 w-24 bg-slate-200 rounded-lg animate-pulse mx-1" />
            ))}
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="h-7 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-24 bg-slate-200 rounded animate-pulse" />
                      <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                    </div>
                    <div className="h-7 w-48 bg-slate-200 rounded animate-pulse" />
                    <div className="h-5 w-64 bg-slate-200 rounded animate-pulse" />
                    <div className="flex gap-6">
                      <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
                      <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="md:w-56">
                    <div className="h-10 w-full bg-slate-200 rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Schedule</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Manage your event applications and upcoming shifts.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {['Upcoming', 'Past', 'Pending'].map(tab => {
            let count = 0;
            if (tab === 'Pending') count = joins.filter(j => j.status === 'pending').length;
            else if (tab === 'Upcoming') count = joins.filter(j => j.status === 'approved' && isUpcomingShift(j.eventId, j.shift)).length;
            else count = joins.filter(j => j.status === 'approved' && !isUpcomingShift(j.eventId, j.shift)).length;
            
            return (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === tab 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">
          {activeTab === 'Pending' ? 'Pending Applications' : `${activeTab} Shifts`}
        </h2>
        
        <div className="grid gap-6">
          {filteredJoins.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center">
              <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No {activeTab.toLowerCase()} shifts</h3>
              <p className="text-slate-500">
                {activeTab === 'Pending' 
                  ? "You don't have any pending applications at the moment." 
                  : activeTab === 'Upcoming' 
                    ? "You don't have any upcoming shifts scheduled." 
                    : "You haven't completed any shifts yet."}
              </p>
            </div>
          ) : (
            filteredJoins.map((join, i) => {
              const statusConfig = getStatusConfig(join.status);
              const showMessage = message?.id === join.id;
              const daysLeft = getDaysLeft(join.eventId, join.shift);
              const shiftDate = getShiftDate(join.eventId, join.shift);
              const startTime = getShiftStartTime(join.eventId, join.shift);
              const endTime = getShiftEndTime(join.eventId, join.shift);
              
              return (
                <motion.div 
                  key={join.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full opacity-30 -z-0 group-hover:scale-110 transition-transform duration-700" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusConfig.className}`}>
                          {statusConfig.icon}
                          Request status: {statusConfig.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          Applied on {formatDate(join.requestedAt)}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="text-2xl font-extrabold text-slate-900 mb-2">{join.eventName}</h3>
                        <p className="text-slate-600 font-medium leading-relaxed max-w-3xl">
                          {join.eventRegion} region
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500 pt-2">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-slate-400" />
                          Current Shift: <span className="font-bold text-slate-700">{join.shift}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-slate-400" />
                          Region: {join.eventRegion}
                        </div>
                        {join.status === 'approved' && shiftDate && (
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            Shift Date: <span className="font-bold text-slate-700">{shiftDate.toLocaleDateString()}</span>
                            {daysLeft !== null && daysLeft >= 0 && (
                              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${daysLeft === 0 ? 'bg-orange-100 text-orange-700' : daysLeft < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                {daysLeft === 0 ? 'Today!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days left`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Время смены - с исправленной длительностью */}
                      {join.status === 'approved' && startTime && endTime && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-orange-500" />
                              <span className="font-semibold text-slate-700">Shift Time:</span>
                              <span className="text-slate-600">{startTime} - {endTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">|</span>
                              <span className="text-slate-500 text-xs">
                                Duration: {getDurationFormatted(startTime, endTime)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col justify-end gap-3 md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                      {showMessage && message && (
                        <div className={`text-xs text-center p-2 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {message.text}
                        </div>
                      )}
                      
                      {join.status === 'pending' ? (
                        <button 
                          onClick={() => setShowUpdateModal(join)}
                          className="w-full py-3 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-all shadow-sm"
                        >
                          Update Request
                        </button>
                      ) : join.status === 'approved' ? (
                        <div className="text-center">
                          <p className="text-xs text-slate-500 mb-2">Shift confirmed</p>
                          <button 
                            disabled
                            className="w-full py-3 bg-emerald-100 text-emerald-700 font-bold rounded-xl cursor-default"
                          >
                            ✓ Confirmed
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-xs text-red-500 mb-2">Request declined</p>
                          <button 
                            disabled
                            className="w-full py-3 bg-red-100 text-red-700 font-bold rounded-xl cursor-default"
                          >
                            ✗ Declined
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Update Shift Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowUpdateModal(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Update Shift Request</h2>
              <button onClick={() => setShowUpdateModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1">{showUpdateModal.eventName}</h3>
              <p className="text-sm text-slate-500">Current shift: {showUpdateModal.shift}</p>
            </div>
            
            <div className="mb-6">
              <label className="text-sm font-bold text-slate-700 block mb-2">Select New Shift</label>
              <select 
                value={selectedShift[showUpdateModal.id] || ''}
                onChange={(e) => setSelectedShift({ ...selectedShift, [showUpdateModal.id]: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              >
                <option value="">Choose a shift</option>
                {SHIFT_OPTIONS.map(shift => (
                  <option key={shift} value={shift}>{shift}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => handleUpdateShift(showUpdateModal.id, selectedShift[showUpdateModal.id])}
                disabled={!selectedShift[showUpdateModal.id]}
                className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Request
              </button>
              <button 
                onClick={() => setShowUpdateModal(null)}
                className="flex-1 border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}