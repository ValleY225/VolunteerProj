import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { 
  Calendar, 
  Users, 
  Clock, 
  MapPin, 
  ChevronRight,
  Eye,
  Download,
  Trash2,
  PlusCircle,
  Search,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  AlertCircle,
  X,
  ListChecks,
  FileText,
  Award,
  Flag
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
  photoUrl: string;
  coordinatorId: string;
  coordinatorName: string;
  shifts?: Shift[];
  createdAt: string;
}

interface JoinRequest {
  joinId: string;
  eventId: string;
  eventName: string;
  participantId: string;
  participantName: string;
  participantPhotoUrl?: string;
  shift: string;
  status: string;
  requestedAt: string;
  formAnswers?: any;
  attendanceMarked?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
}

export default function CoordinatorEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);
  const [completingEvent, setCompletingEvent] = useState<string | null>(null);

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
      loadEvents();
    }
  }, [userId]);

  const loadEvents = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/items`);
      const allEvents = await response.json();
      
      const myEvents = allEvents
        .filter((e: Event) => e.coordinatorId === userId)
        .map((event: any) => ({
          ...event,
          shifts: event.shifts ? JSON.parse(event.shifts) : []
        }));
      
      setEvents(myEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
      showMessage('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRequestsForEvent = async (eventId: string) => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/coordinators/${userId}/join-requests?eventId=${eventId}`);
      if (response.ok) {
        const data = await response.json();
        
        const requestsWithAttendance = await Promise.all(data.map(async (req: JoinRequest) => {
          try {
            const joinRes = await fetch(`${API_BASE}/api/joins/${req.joinId}`);
            if (joinRes.ok) {
              const joinData = await joinRes.json();
              return { ...req, ...joinData };
            }
          } catch (e) {
            console.error('Failed to load attendance:', e);
          }
          return req;
        }));
        
        setRequests(requestsWithAttendance);
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const handleViewDetails = async (event: Event) => {
    setSelectedEvent(event);
    await loadRequestsForEvent(event.id);
    setShowDetailsModal(true);
  };

  const handleRequestDecision = async (joinId: string, decision: 'approved' | 'declined') => {
    setActionLoading(joinId);
    try {
      const response = await fetch(`${API_BASE}/api/joins/${joinId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinatorId: userId, decision }),
      });
      
      if (response.ok) {
        showMessage(`Request ${decision} successfully!`, 'success');
        if (selectedEvent) {
          await loadRequestsForEvent(selectedEvent.id);
        }
      } else {
        const error = await response.json();
        showMessage(error.message || 'Failed to process request', 'error');
      }
    } catch (error) {
      showMessage('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAttendance = async (joinId: string, participantName: string) => {
    setActionLoading(joinId);
    try {
      const response = await fetch(`${API_BASE}/api/joins/${joinId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinatorId: userId,
          checkInTime: new Date().toISOString(),
          attendanceMarked: true
        }),
      });
      
      if (response.ok) {
        showMessage(`✅ Attendance marked for ${participantName}! Hours will be credited.`, 'success');
        if (selectedEvent) {
          await loadRequestsForEvent(selectedEvent.id);
        }
      } else {
        const error = await response.json();
        showMessage(error.message || 'Failed to mark attendance', 'error');
      }
    } catch (error) {
      showMessage('Network error', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Mark "${eventName}" as completed? This will allow volunteers to receive hours for their participation.`)) return;
    
    setCompletingEvent(eventId);
    try {
      const approvedRequests = requests.filter(r => r.status === 'approved');
      
      for (const request of approvedRequests) {
        await fetch(`${API_BASE}/api/joins/${request.joinId}/attendance`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coordinatorId: userId,
            checkInTime: new Date().toISOString(),
            attendanceMarked: true
          }),
        });
      }
      
      showMessage(`✅ Event "${eventName}" completed! Hours awarded to ${approvedRequests.length} volunteers.`, 'success');
      
      // Обновляем состояние, чтобы кнопка исчезла
      await loadRequestsForEvent(eventId);
      await loadEvents();
      
    } catch (error) {
      showMessage('Failed to complete event', 'error');
    } finally {
      setCompletingEvent(null);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/items/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinatorId: userId }),
      });
      
      if (response.ok) {
        showMessage('Event deleted successfully', 'success');
        loadEvents();
        if (selectedEvent?.id === eventId) {
          setShowDetailsModal(false);
          setSelectedEvent(null);
        }
      } else {
        const error = await response.json();
        showMessage(error.message || 'Failed to delete event', 'error');
      }
    } catch (error) {
      showMessage('Network error', 'error');
    }
  };

  const handleExportCSV = async (eventId: string, eventName: string) => {
    window.open(`${API_BASE}/api/items/${eventId}/volunteers.csv?coordinatorId=${userId}`, '_blank');
    showMessage(`Exporting ${eventName} volunteers...`, 'success');
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-semibold"><CheckCircle size={12} /> Approved</span>;
      case 'declined':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-semibold"><XCircle size={12} /> Declined</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-semibold"><ClockIcon size={12} /> Pending</span>;
    }
  };

  const getImageUrl = (photoUrl: string | undefined) => {
    if (!photoUrl) return 'https://placehold.co/800x500/e2e8f0/64748b?text=No+Image';
    if (photoUrl.startsWith('http')) return photoUrl;
    return `${API_BASE}${photoUrl}`;
  };

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Проверка, все ли смены прошли по времени
  const isEventPast = (event: Event): boolean => {
    if (!event.shifts || event.shifts.length === 0) return false;
    const now = new Date();
    return event.shifts.every(shift => {
      const [year, month, day] = shift.date.split('-');
      const [endHour, endMinute] = shift.endTime.split(':');
      const shiftEnd = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(endHour), parseInt(endMinute));
      return shiftEnd < now;
    });
  };

  // Проверка, отмечено ли событие как завершенное (все approved участники получили часы)
  const isEventCompleted = (event: Event): boolean => {
    if (!event.shifts || event.shifts.length === 0) return false;
    // Если есть approved участники и никто из них не получил часы -> не завершено
    const approvedRequestsForEvent = requests.filter(r => r.status === 'approved');
    if (approvedRequestsForEvent.length === 0) return isEventPast(event);
    return approvedRequestsForEvent.every(r => r.attendanceMarked === true);
  };

  const getShiftStats = (shifts: Shift[] | undefined) => {
    if (!shifts || shifts.length === 0) return [];
    
    return shifts.map(shift => ({
      shiftName: shift.name,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      volunteersNeeded: shift.volunteersNeeded,
      approved: requests.filter(r => r.shift === shift.name && r.status === 'approved').length,
      pending: requests.filter(r => r.shift === shift.name && r.status === 'pending').length,
      total: requests.filter(r => r.shift === shift.name).length,
      attendanceMarked: requests.filter(r => r.shift === shift.name && r.attendanceMarked).length
    }));
  };

  const stats = {
    totalEvents: events.length,
    totalRequests: requests.length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    approvedVolunteers: requests.filter(r => r.status === 'approved').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Events</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Manage your volunteer events and applications.</p>
        </div>
        <Link 
          to="/dashboard/create-event" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 hover:shadow-lg transition-all"
        >
          <PlusCircle size={18} />
          Create New Event
          <ChevronRight size={18} />
        </Link>
      </div>

      {/* Stats Cards */}
      {events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Total Events</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalEvents}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Total Applications</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalRequests}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Pending Review</p>
            <p className="text-3xl font-bold text-amber-600">{stats.pendingRequests}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Approved Volunteers</p>
            <p className="text-3xl font-bold text-emerald-600">{stats.approvedVolunteers}</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search events by name or description..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all shadow-sm"
        />
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
          <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No events yet</h3>
          <p className="text-slate-500 mb-6">Create your first volunteer event to get started.</p>
          <Link to="/dashboard/create-event" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700">
            <PlusCircle size={18} />
            Create Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.map((event, index) => {
            const isPast = isEventPast(event);
            const isCompleted = isEventCompleted(event);
            
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className={`group bg-white rounded-2xl border overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer ${
                  isCompleted ? 'border-emerald-200 bg-emerald-50/30' : isPast ? 'border-slate-200 opacity-75' : 'border-slate-100'
                }`}
                onClick={() => handleViewDetails(event)}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img 
                    src={getImageUrl(event.photoUrl)} 
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/800x500/e2e8f0/64748b?text=Event';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-xs font-bold text-slate-700">
                      {event.region}
                    </span>
                  </div>
                  {isCompleted && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-1 rounded-lg bg-emerald-600/90 backdrop-blur-sm text-white text-xs font-bold flex items-center gap-1">
                        <Award size={12} /> Completed
                      </span>
                    </div>
                  )}
                  {isPast && !isCompleted && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-1 rounded-lg bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold flex items-center gap-1">
                        <Flag size={12} /> Past
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={`p-5 flex-1 flex flex-col ${isCompleted ? 'bg-emerald-50/20' : isPast ? 'bg-slate-50' : 'bg-white'}`}>
                  <h3 className="text-xl font-extrabold text-slate-900 line-clamp-1 mb-2">
                    {event.name}
                  </h3>
                  
                  <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                    {event.description}
                  </p>

                  {event.shifts && event.shifts.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Shifts:</p>
                      <div className="flex flex-wrap gap-2">
                        {event.shifts.slice(0, 2).map((shift) => (
                          <span key={shift.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {shift.name}
                          </span>
                        ))}
                        {event.shifts.length > 2 && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            +{event.shifts.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(event.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {event.shifts?.length || 0} shifts
                    </span>
                  </div>

                  {/* Action Buttons - останавливаем всплытие, чтобы не открывать модалку при клике на кнопки */}
                  <div className="flex gap-2 mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleViewDetails(event)}
                      className="flex-1 py-2.5 rounded-xl bg-orange-50 text-orange-700 font-semibold text-sm hover:bg-orange-600 hover:text-white transition-all duration-200 flex items-center justify-center gap-1"
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                    <button
                      onClick={() => handleExportCSV(event.id, event.name)}
                      className="py-2.5 px-3 rounded-xl bg-slate-50 text-slate-600 font-semibold text-sm hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200"
                      title="Export CSV"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="py-2.5 px-3 rounded-xl bg-slate-50 text-slate-600 font-semibold text-sm hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                      title="Delete Event"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Event Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative h-64 overflow-hidden rounded-t-3xl">
                <img 
                  src={getImageUrl(selectedEvent.photoUrl)} 
                  alt={selectedEvent.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/1200x400/e2e8f0/64748b?text=Event+Header';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h2 className="text-3xl font-extrabold mb-2">{selectedEvent.name}</h2>
                  <div className="flex items-center gap-4 text-sm opacity-90">
                    <span className="flex items-center gap-1"><MapPin size={14} /> {selectedEvent.region}</span>
                    <span className="flex items-center gap-1"><Calendar size={14} /> Created {new Date(selectedEvent.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText size={20} className="text-orange-600" />
                    Description
                  </h3>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedEvent.description}
                  </p>
                </div>

                {/* Complete Event Button - появляется только если событие прошло и еще не завершено */}
                {isEventPast(selectedEvent) && !isEventCompleted(selectedEvent) && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h4 className="font-bold text-blue-900 flex items-center gap-2">
                          <Award size={18} />
                          Mark Event as Completed
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          After the event ends, mark it as completed to award hours to volunteers.
                        </p>
                      </div>
                      <button
                        onClick={() => handleCompleteEvent(selectedEvent.id, selectedEvent.name)}
                        disabled={completingEvent === selectedEvent.id}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {completingEvent === selectedEvent.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          'Complete Event'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Shifts Section */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-orange-600" />
                    Event Shifts & Schedule
                  </h3>
                  
                  {!selectedEvent.shifts || selectedEvent.shifts.length === 0 ? (
                    <div className="bg-slate-50 rounded-xl p-6 text-center">
                      <Clock size={32} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">No shifts configured for this event</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getShiftStats(selectedEvent.shifts).map((shiftStat, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-slate-900 mb-2">{shiftStat.shiftName}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div className="flex items-center gap-1 text-slate-600">
                                  <Calendar size={14} />
                                  <span>{new Date(shiftStat.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-600">
                                  <Clock size={14} />
                                  <span>{shiftStat.startTime} - {shiftStat.endTime}</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-600">
                                  <Users size={14} />
                                  <span>Need: {shiftStat.volunteersNeeded}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="space-y-1 text-sm">
                                <p className="text-emerald-600">✅ Approved: {shiftStat.approved}</p>
                                <p className="text-amber-600">⏳ Pending: {shiftStat.pending}</p>
                                <p className="text-emerald-500">🏆 Attended: {shiftStat.attendanceMarked}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Fill rate</span>
                              <span>{Math.round((shiftStat.approved / shiftStat.volunteersNeeded) * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-emerald-500 rounded-full h-2 transition-all duration-500"
                                style={{ width: `${Math.min((shiftStat.approved / shiftStat.volunteersNeeded) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Applications Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Users size={20} className="text-orange-600" />
                      Volunteer Applications
                      <span className="text-sm font-normal text-slate-500">({stats.totalRequests} total)</span>
                    </h3>
                  </div>

                  {requests.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl">
                      <Users size={40} className="text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">No applications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {requests.map((request) => (
                        <div key={request.joinId} className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-orange-200 transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className="font-semibold text-slate-900">{request.participantName}</span>
                                {getStatusBadge(request.status)}
                                <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded">
                                  {request.shift} shift
                                </span>
                                {request.attendanceMarked && (
                                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Award size={10} /> Hours awarded
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500">
                                Applied on {new Date(request.requestedAt).toLocaleDateString()}
                              </p>
                            </div>
                            
                            {request.status === 'approved' && !request.attendanceMarked && isEventPast(selectedEvent) && !isEventCompleted(selectedEvent) && (
                              <button
                                onClick={() => handleMarkAttendance(request.joinId, request.participantName)}
                                disabled={actionLoading === request.joinId}
                                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                              >
                                {actionLoading === request.joinId ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Award size={14} />
                                )}
                                Award Hours
                              </button>
                            )}
                            
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleRequestDecision(request.joinId, 'approved')}
                                  disabled={actionLoading === request.joinId}
                                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                  {actionLoading === request.joinId ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <CheckCircle size={14} />
                                  )}
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleRequestDecision(request.joinId, 'declined')}
                                  disabled={actionLoading === request.joinId}
                                  className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleExportCSV(selectedEvent.id, selectedEvent.name)}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    Delete Event
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}