import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { 
  Users, 
  Search, 
  Download, 
  Calendar, 
  MapPin, 
  Clock,
  ChevronRight,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  Filter,
  X,
  Eye,
  RefreshCw
} from 'lucide-react';

const API_BASE = (() => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  return '';
})();

interface Event {
  id: string;
  name: string;
  description: string;
  region: string;
  coordinatorId: string;
  coordinatorName: string;
  createdAt: string;
  shifts?: Shift[];
}

interface Shift {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  volunteersNeeded: number;
}

interface Participant {
  joinId: string;
  eventId: string;
  eventName: string;
  participantId: string;
  participantName: string;
  shift: string;
  formAnswers?: any;
}

export default function CoordinatorParticipantsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('ngo_current_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role !== 'Coordinator') {
        window.location.href = '/dashboard';
        return;
      }
      setUserId(user.id);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // 🚀 ПАРАЛЛЕЛЬНЫЕ запросы
      const [eventsRes, participantsRes] = await Promise.all([
        fetch(`${API_BASE}/api/items`),
        fetch(`${API_BASE}/api/coordinators/${userId}/participants`)
      ]);
      
      // Параллельный парсинг JSON
      const [allEvents, participantsData] = await Promise.all([
        eventsRes.json(),
        participantsRes.ok ? participantsRes.json() : []
      ]);
      
      const myEvents = allEvents.filter((e: Event) => e.coordinatorId === userId);
      
      // Parse shifts
      const parsedEvents = myEvents.map((event: any) => ({
        ...event,
        shifts: event.shifts ? (typeof event.shifts === 'string' ? JSON.parse(event.shifts) : event.shifts) : []
      }));
      
      setEvents(parsedEvents);
      setParticipants(participantsData);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      showMessage('Failed to load participants', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, showMessage]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleExportCSV = useCallback(async () => {
    if (!userId) return;
    
    if (selectedEventId !== 'all') {
      const event = events.find(e => e.id === selectedEventId);
      if (event) {
        window.open(`${API_BASE}/api/items/${selectedEventId}/volunteers.csv?coordinatorId=${userId}`, '_blank');
        showMessage(`Exporting ${event.name} volunteers...`, 'success');
      }
    } else {
      showMessage('Please select a specific event to export CSV', 'error');
    }
  }, [userId, selectedEventId, events, showMessage]);

  // Get unique shifts for filter (мемоизировано)
  const uniqueShifts = useMemo(() => {
    const shifts = new Set<string>();
    participants.forEach(p => shifts.add(p.shift));
    return Array.from(shifts).sort();
  }, [participants]);

  // Apply filters (мемоизировано)
  const filteredParticipants = useMemo(() => {
    let filtered = participants;
    
    if (selectedEventId !== 'all') {
      filtered = filtered.filter(p => p.eventId === selectedEventId);
    }
    
    if (selectedShift !== 'all') {
      filtered = filtered.filter(p => p.shift === selectedShift);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.participantName.toLowerCase().includes(term) ||
        p.eventName.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [participants, selectedEventId, selectedShift, searchTerm]);

  // Get shift details (мемоизировано)
  const getShiftDetails = useCallback((eventId: string, shiftName: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event || !event.shifts) return null;
    return event.shifts.find(s => s.name === shiftName);
  }, [events]);

  // Group participants by event (мемоизировано)
  const participantsByEvent = useMemo(() => {
    const grouped: { [key: string]: Participant[] } = {};
    filteredParticipants.forEach(p => {
      if (!grouped[p.eventId]) {
        grouped[p.eventId] = [];
      }
      grouped[p.eventId].push(p);
    });
    return grouped;
  }, [filteredParticipants]);

  // Stats (мемоизировано)
  const stats = useMemo(() => ({
    totalEvents: events.length,
    totalParticipants: participants.length,
    uniqueVolunteers: new Set(participants.map(p => p.participantId)).size,
    activeEvents: new Set(participants.map(p => p.eventId)).size
  }), [events, participants]);

  // Skeleton Loader
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Skeleton header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-6 w-64 bg-slate-200 rounded-lg mt-2 animate-pulse" />
          </div>
          <div className="h-12 w-32 bg-slate-200 rounded-full animate-pulse" />
        </div>
        
        {/* Skeleton stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className="h-4 w-24 bg-slate-200 rounded mb-2 animate-pulse" />
              <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        {/* Skeleton filters */}
        <div className="bg-white rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <div className="h-4 w-16 bg-slate-200 rounded mb-2 animate-pulse" />
                <div className="h-10 w-full bg-slate-200 rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Skeleton table */}
        <div className="bg-white rounded-3xl overflow-hidden">
          <div className="p-6 border-b">
            <div className="h-7 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-5 w-64 bg-slate-200 rounded mt-2 animate-pulse" />
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-6 z-50 px-4 py-3 rounded-xl shadow-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Participants</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Manage volunteers across your events.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={selectedEventId === 'all'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Export CSV
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Total Events</p>
          <p className="text-3xl font-bold text-slate-900">{stats.totalEvents}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Total Participants</p>
          <p className="text-3xl font-bold text-slate-900">{stats.totalParticipants}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Unique Volunteers</p>
          <p className="text-3xl font-bold text-slate-900">{stats.uniqueVolunteers}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-sm text-slate-500 mb-1">Active Events</p>
          <p className="text-3xl font-bold text-slate-900">{stats.activeEvents}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Event Filter */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
            >
              <option value="all">All Events ({events.length})</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} ({participants.filter(p => p.eventId === event.id).length})
                </option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Shift</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
            >
              <option value="all">All Shifts</option>
              {uniqueShifts.map(shift => (
                <option key={shift} value={shift}>{shift}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="md:col-span-2">
            <label className="text-sm font-bold text-slate-700 block mb-2">Search</label>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by volunteer name or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Participants List */}
      {Object.keys(participantsByEvent).length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
          <Users size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No participants found</h3>
          <p className="text-slate-500">
            {selectedEventId !== 'all' || selectedShift !== 'all' || searchTerm
              ? "Try adjusting your filters"
              : "Volunteers will appear here when they join your events"}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(participantsByEvent).map(([eventId, eventParticipants]) => {
            const event = events.find(e => e.id === eventId);
            return (
              <div key={eventId} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Event Header */}
                <div className="p-6 bg-gradient-to-r from-orange-50 to-transparent border-b border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">{event?.name}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><MapPin size={14} /> {event?.region}</span>
                        <span className="flex items-center gap-1"><Users size={14} /> {eventParticipants.length} participants</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEventId(eventId);
                        setTimeout(() => handleExportCSV(), 100);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-semibold hover:bg-emerald-100 transition-colors"
                    >
                      <Download size={14} /> Export Event CSV
                    </button>
                  </div>
                </div>

                {/* Participants Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider">Volunteer</th>
                        <th className="px-6 py-4 text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider">Shift</th>
                        <th className="px-6 py-4 text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-4 text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {eventParticipants.map((participant, idx) => {
                        const shiftDetails = getShiftDetails(eventId, participant.shift);
                        return (
                          <motion.tr
                            key={participant.joinId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                  <User size={18} className="text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{participant.participantName}</p>
                                  <p className="text-xs text-slate-500">ID: {participant.participantId.slice(0, 8)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                <Clock size={12} />
                                {participant.shift}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {shiftDetails ? (
                                <div>
                                  <p className="text-sm text-slate-700">
                                    {new Date(shiftDetails.date).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {shiftDetails.startTime} - {shiftDetails.endTime}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-500">-</p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => {
                                  setSelectedParticipant(participant);
                                  setShowDetailsModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-orange-100 hover:text-orange-700 transition-colors"
                              >
                                <Eye size={14} />
                                View Details
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Participant Details Modal */}
      {showDetailsModal && selectedParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Participant Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <User size={32} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedParticipant.participantName}</h3>
                  <p className="text-sm text-slate-500">{selectedParticipant.eventName}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={16} className="text-slate-400" />
                  <span className="font-medium text-slate-700">Shift:</span>
                  <span className="text-slate-600">{selectedParticipant.shift}</span>
                </div>
                
                {(() => {
                  const shiftDetails = getShiftDetails(selectedParticipant.eventId, selectedParticipant.shift);
                  return shiftDetails && (
                    <>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar size={16} className="text-slate-400" />
                        <span className="font-medium text-slate-700">Date:</span>
                        <span className="text-slate-600">{new Date(shiftDetails.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Clock size={16} className="text-slate-400" />
                        <span className="font-medium text-slate-700">Time:</span>
                        <span className="text-slate-600">{shiftDetails.startTime} - {shiftDetails.endTime}</span>
                      </div>
                    </>
                  );
                })()}
                
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="font-medium text-slate-700">Event:</span>
                  <span className="text-slate-600">{selectedParticipant.eventName}</span>
                </div>
                
                {selectedParticipant.formAnswers && Object.keys(selectedParticipant.formAnswers).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <FileText size={14} className="text-orange-600" />
                      Form Answers
                    </h4>
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl">
                      {Object.entries(selectedParticipant.formAnswers).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-semibold text-slate-700">{key}:</span>
                          <span className="text-slate-600 ml-2">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}