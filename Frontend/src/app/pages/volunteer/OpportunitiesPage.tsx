import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, MapPin, Calendar, Users, HeartHandshake, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';

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
  photoUrl: string;
  coordinatorId: string;
  coordinatorName: string;
  createdAt: string;
  shifts?: Shift[];
}

interface JoinRequest {
  id: string;
  eventId: string;
  eventName: string;
  shift: string;
  status: 'pending' | 'approved' | 'declined';
  requestedAt: string;
}

const categories = ['All', 'Environmental', 'Animal Welfare', 'Community', 'Education', 'Health'];

const getEventCategory = (eventName: string): string => {
  const name = eventName.toLowerCase();
  if (name.includes('tree') || name.includes('plant') || name.includes('clean')) return 'Environmental';
  if (name.includes('dog') || name.includes('cat') || name.includes('animal') || name.includes('paw')) return 'Animal Welfare';
  if (name.includes('food') || name.includes('community') || name.includes('care')) return 'Community';
  if (name.includes('mentor') || name.includes('teach') || name.includes('youth') || name.includes('student')) return 'Education';
  if (name.includes('health') || name.includes('medical') || name.includes('clinic')) return 'Health';
  return 'Community';
};

export default function OpportunitiesPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<Record<string, string>>({});
  const [showApplyModal, setShowApplyModal] = useState<Event | null>(null);
  const [message, setMessage] = useState<{ text: string; type: string; eventId?: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('ngo_current_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserId(user.id);
    }
  }, []);

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
      const [eventsRes, requestsRes] = await Promise.all([
        fetch(`${API_BASE}/api/items`),
        fetch(`${API_BASE}/api/participants/${userId}/joins`)
      ]);
      
      // Параллельный парсинг JSON
      const [eventsData, requestsData] = await Promise.all([
        eventsRes.json(),
        requestsRes.ok ? requestsRes.json() : []
      ]);
      
      // Парсим смены из отдельного поля
      const parsedEvents = eventsData.map((event: any) => {
        let shifts: Shift[] = [];
        if (event.shifts) {
          try {
            shifts = typeof event.shifts === 'string' ? JSON.parse(event.shifts) : event.shifts;
          } catch (e) {
            shifts = [];
          }
        }
        return { ...event, shifts };
      });
      
      setEvents(parsedEvents);
      setMyRequests(requestsData);
      
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleJoinEvent = useCallback(async (eventId: string, shiftName: string) => {
    if (!shiftName) {
      setMessage({ text: 'Please select a shift', type: 'error', eventId });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/items/${eventId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: userId, shift: shiftName })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage({ text: result.message || 'Request sent successfully!', type: 'success', eventId });
        loadData();
        setShowApplyModal(null);
        setSelectedShift({});
      } else {
        setMessage({ text: result.message || 'Failed to join', type: 'error', eventId });
      }
    } catch (error) {
      setMessage({ text: 'Network error', type: 'error', eventId });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  }, [userId, loadData]);

  const getRequestStatus = useCallback((eventId: string) => {
    const request = myRequests.find(r => r.eventId === eventId);
    if (!request) return null;
    return { status: request.status, shift: request.shift };
  }, [myRequests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-50 border-green-200 text-green-700';
      case 'declined': return 'bg-red-50 border-red-200 text-red-700';
      default: return 'bg-amber-50 border-amber-200 text-amber-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} className="text-green-600" />;
      case 'declined': return <AlertCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-amber-600" />;
    }
  };

  const getImageUrl = useCallback((photoUrl: string | undefined) => {
    if (!photoUrl) return 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
    if (photoUrl.startsWith('http')) return photoUrl;
    return `${API_BASE}${photoUrl}`;
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesCategory = activeCategory === 'All' || getEventCategory(event.name) === activeCategory;
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.coordinatorName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Skeleton Loader
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
          <div>
            <div className="h-9 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-6 w-80 bg-slate-200 rounded-lg mt-2 animate-pulse" />
          </div>
          <div className="h-12 w-72 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        
        <div className="flex overflow-x-auto pb-4 mb-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-10 w-24 bg-slate-200 rounded-full animate-pulse" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
              <div className="h-48 bg-slate-200 animate-pulse" />
              <div className="p-6">
                <div className="h-4 w-24 bg-slate-200 rounded mb-2 animate-pulse" />
                <div className="h-6 w-32 bg-slate-200 rounded mb-3 animate-pulse" />
                <div className="h-4 w-full bg-slate-200 rounded mb-2 animate-pulse" />
                <div className="h-4 w-3/4 bg-slate-200 rounded mb-4 animate-pulse" />
                <div className="h-10 w-full bg-slate-200 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Explore Opportunities</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Find the perfect cause to dedicate your time to.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search events, NGOs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all shadow-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex overflow-x-auto pb-4 mb-6 hide-scrollbar gap-3">
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-2">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-100">
            <HeartHandshake size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No events found</h3>
            <p className="text-slate-500">Try adjusting your search or check back later for new opportunities!</p>
          </div>
        ) : (
          filteredEvents.map((event, i) => {
            const requestStatus = getRequestStatus(event.id);
            const showMessage = message?.eventId === event.id;
            
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="group bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-400 flex flex-col h-full"
              >
                <div className="h-48 relative overflow-hidden bg-slate-100">
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold uppercase tracking-wider shadow-sm">
                      {getEventCategory(event.name)}
                    </span>
                  </div>
                  <img 
                    src={getImageUrl(event.photoUrl)} 
                    alt={event.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Image+Error';
                    }}
                  />
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4">
                    <p className="text-sm font-bold text-orange-600 mb-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                      {event.coordinatorName}
                    </p>
                    <h3 className="text-xl font-extrabold text-slate-900 leading-tight group-hover:text-orange-600 transition-colors line-clamp-2">
                      {event.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">{event.description}</p>
                    
                    {/* Показываем превью смен */}
                    {event.shifts && event.shifts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {event.shifts.slice(0, 2).map((shift) => (
                          <span key={shift.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {shift.name}
                          </span>
                        ))}
                        {event.shifts.length > 2 && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            +{event.shifts.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3 mb-6 mt-auto">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Calendar size={16} className="text-slate-400" />
                      <span className="text-sm font-medium">Created {new Date(event.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <MapPin size={16} className="text-slate-400" />
                      <span className="text-sm font-medium truncate">{event.region}, Kazakhstan</span>
                    </div>
                  </div>
                  
                  {showMessage && message && (
                    <div className={`mb-3 p-2 rounded-lg text-xs text-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {message.text}
                    </div>
                  )}
                  
                  {requestStatus ? (
                    <div className={`p-3 rounded-xl ${getStatusColor(requestStatus.status)}`}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(requestStatus.status)}
                        <span className="font-medium text-sm capitalize">{requestStatus.status}</span>
                        <span className="text-xs ml-auto">Shift: {requestStatus.shift}</span>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowApplyModal(event)}
                      className="w-full py-3.5 bg-slate-50 text-slate-900 font-bold rounded-xl hover:bg-orange-600 hover:text-white transition-all duration-300 border border-slate-200 group-hover:border-transparent"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowApplyModal(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Apply to Join</h2>
              <button onClick={() => setShowApplyModal(null)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-1">{showApplyModal.name}</h3>
              <p className="text-sm text-slate-500">by {showApplyModal.coordinatorName}</p>
            </div>
            
            <div className="mb-6">
              <label className="text-sm font-bold text-slate-700 block mb-2">Select Shift</label>
              
              {!showApplyModal.shifts || showApplyModal.shifts.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  No shifts available for this event yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {showApplyModal.shifts.map((shift) => (
                    <label key={shift.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-all">
                      <input
                        type="radio"
                        name="shift"
                        value={shift.name}
                        checked={selectedShift[showApplyModal.id] === shift.name}
                        onChange={() => setSelectedShift({ ...selectedShift, [showApplyModal.id]: shift.name })}
                        className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{shift.name}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(shift.date).toLocaleDateString()} • {shift.startTime} - {shift.endTime}
                        </div>
                        <div className="text-xs text-slate-400">Needs: {shift.volunteersNeeded} volunteers</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => handleJoinEvent(showApplyModal.id, selectedShift[showApplyModal.id])}
                disabled={!selectedShift[showApplyModal.id]}
                className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Application
              </button>
              <button 
                onClick={() => setShowApplyModal(null)}
                className="flex-1 border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}