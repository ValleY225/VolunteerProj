import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  PlusCircle,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Download,
  X,
  RefreshCw
} from 'lucide-react';

const API_BASE = (() => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  return '';
})();

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
}

interface Event {
  id: string;
  name: string;
  description: string;
  region: string;
  photoUrl?: string;
  coordinatorId: string;
  coordinatorName: string;
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
}

interface Participant {
  participantId: string;
  participantName: string;
  eventName: string;
  shift: string;
}

export default function DashboardHomeCoordinator() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState<JoinRequest | null>(null);
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('ngo_current_user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    
    const currentUser = JSON.parse(storedUser);
    if (currentUser.role !== 'Coordinator') {
      navigate('/dashboard');
      return;
    }
    
    setUser(currentUser);
    loadData(currentUser.id);
  }, [navigate]);

  // Оптимизированная загрузка данных - все запросы параллельно
  const loadData = useCallback(async (coordinatorId: string) => {
    setIsLoading(true);
    try {
      // Запускаем ВСЕ запросы ПАРАЛЛЕЛЬНО, а не последовательно
      const [eventsRes, requestsRes, participantsRes] = await Promise.all([
        fetch(`${API_BASE}/api/items`),
        fetch(`${API_BASE}/api/coordinators/${coordinatorId}/join-requests?status=pending`),
        fetch(`${API_BASE}/api/coordinators/${coordinatorId}/participants`)
      ]);
      
      // Параллельно парсим JSON
      const [allEvents, requests, allParticipants] = await Promise.all([
        eventsRes.json(),
        requestsRes.ok ? requestsRes.json() : [],
        participantsRes.ok ? participantsRes.json() : []
      ]);
      
      // Фильтруем события координатора
      const myEventsList = allEvents.filter((e: Event) => e.coordinatorId === coordinatorId);
      
      setMyEvents(myEventsList);
      setPendingRequests(requests);
      setParticipants(allParticipants);
      
    } catch (err) {
      console.error('Failed to load coordinator data:', err);
      showMessage('Failed to load data. Please refresh.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleApprove = async (request: JoinRequest) => {
    setActionLoading(request.joinId);
    try {
      const response = await fetch(`${API_BASE}/api/joins/${request.joinId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinatorId: user?.id, decision: 'approved' }),
      });
      
      if (response.ok) {
        showMessage(`✅ Approved ${request.participantName} for ${request.eventName}`, 'success');
        if (user) loadData(user.id);
      } else {
        const error = await response.json();
        showMessage(error.message || 'Failed to approve request', 'error');
      }
    } catch (err) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (request: JoinRequest) => {
    setActionLoading(request.joinId);
    try {
      const response = await fetch(`${API_BASE}/api/joins/${request.joinId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinatorId: user?.id, decision: 'declined' }),
      });
      
      if (response.ok) {
        showMessage(`❌ Declined ${request.participantName}'s request`, 'success');
        setShowDeclineModal(null);
        if (user) loadData(user.id);
      } else {
        const error = await response.json();
        showMessage(error.message || 'Failed to decline request', 'error');
      }
    } catch (err) {
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = async (eventId: string, eventName: string) => {
    window.open(`${API_BASE}/api/items/${eventId}/volunteers.csv?coordinatorId=${user?.id}`, '_blank');
    showMessage(`Exporting ${eventName} volunteers...`, 'success');
  };

  const stats = [
    { 
      label: 'My Events', 
      value: myEvents.length.toString(), 
      icon: <Calendar size={24} className="text-blue-500" />, 
      bg: 'bg-blue-50', 
      trend: 'Active events',
      link: '/dashboard/events'
    },
    { 
      label: 'Pending Requests', 
      value: pendingRequests.length.toString(), 
      icon: <Clock size={24} className="text-amber-500" />, 
      bg: 'bg-amber-50', 
      trend: 'Awaiting action',
      link: '/dashboard/events'
    },
    { 
      label: 'Total Volunteers', 
      value: participants.length.toString(), 
      icon: <Users size={24} className="text-emerald-500" />, 
      bg: 'bg-emerald-50', 
      trend: 'Across all events',
      link: '/dashboard/participants'
    },
  ];

  // Показываем скелетон во время загрузки
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Skeleton for header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="h-9 w-64 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-6 w-96 bg-slate-200 rounded-lg mt-2 animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-12 w-32 bg-slate-200 rounded-full animate-pulse" />
            <div className="h-12 w-40 bg-slate-200 rounded-full animate-pulse" />
          </div>
        </div>
        
        {/* Skeleton for stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-[2rem] p-8 border border-slate-100">
              <div className="h-4 w-24 bg-slate-200 rounded mb-3 animate-pulse" />
              <div className="h-10 w-16 bg-slate-200 rounded mb-2 animate-pulse" />
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        {/* Skeleton for main content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] p-8">
              <div className="h-8 w-48 bg-slate-200 rounded mb-4 animate-pulse" />
              <div className="h-4 w-64 bg-slate-200 rounded mb-6 animate-pulse" />
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="h-64 bg-gradient-to-r from-orange-600 to-orange-500 rounded-[2rem] animate-pulse" />
            <div className="h-48 bg-white rounded-[2rem] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Message Toast */}
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Here's your NGO coordination hub.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => user && loadData(user.id)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <Link 
            to="/dashboard/create-event" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 hover:shadow-lg transition-all"
          >
            <PlusCircle size={18} />
            Create New Event
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
            onClick={() => stat.link && navigate(stat.link)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-extrabold text-slate-400 uppercase tracking-widest mb-3">{stat.label}</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{stat.value}</h3>
                <p className="text-sm font-bold text-slate-500 group-hover:text-orange-600 transition-colors">
                  {stat.trend} →
                </p>
              </div>
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Pending Requests Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Pending Volunteer Requests</h2>
                <p className="text-slate-500 text-sm mt-1">Review and manage volunteer applications</p>
              </div>
              {pendingRequests.length > 0 && (
                <Link to="/dashboard/events" className="text-sm font-bold text-orange-600 hover:text-orange-700">
                  View All →
                </Link>
              )}
            </div>
            
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-600">No pending requests</p>
                <p className="text-sm text-slate-400 mt-1">All caught up! Great job managing your events.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.slice(0, 5).map((request) => (
                  <motion.div 
                    key={request.joinId} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-orange-200 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Clock size={12} /> Pending
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            {request.shift} shift
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{request.participantName}</h3>
                        <p className="text-sm text-slate-600">
                          wants to join <span className="font-semibold text-orange-700">{request.eventName}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApprove(request)}
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
                          onClick={() => setShowDeclineModal(request)}
                          disabled={actionLoading === request.joinId}
                          className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Quick Stats Widget */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-[2rem] p-8 text-white relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <TrendingUp size={32} className="mb-4 opacity-90" />
              <h3 className="text-2xl font-extrabold mb-3">Growing Impact</h3>
              <p className="text-orange-100 font-medium mb-6">
                You've managed {myEvents.length} event{myEvents.length !== 1 ? 's' : ''} with {participants.length} volunteer{participants.length !== 1 ? 's' : ''}. Keep up the great work!
              </p>
              <Link 
                to="/dashboard/participants"
                className="block text-center px-4 py-3 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-colors"
              >
                View All Participants →
              </Link>
            </div>
          </div>

          {/* Recent Events List */}
          {myEvents.length > 0 && (
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-slate-900">Recent Events</h3>
                <Link to="/dashboard/events" className="text-xs font-bold text-orange-600 hover:text-orange-700">
                  Manage All
                </Link>
              </div>
              <div className="space-y-3">
                {myEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{event.name}</p>
                      <p className="text-xs text-slate-500">{event.region}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleExportCSV(event.id, event.name)}
                        className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                        title="Export CSV"
                      >
                        <Download size={14} />
                      </button>
                      <Link 
                        to={`/dashboard/events/${event.id}`}
                        className="p-1.5 rounded-lg bg-orange-100 text-orange-600 hover:bg-orange-200"
                      >
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decline Confirmation Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeclineModal(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Decline Request</h2>
              <button onClick={() => setShowDeclineModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-slate-700">
                Are you sure you want to decline <span className="font-bold">{showDeclineModal.participantName}</span>'s request to join <span className="font-bold">{showDeclineModal.eventName}</span>?
              </p>
              <p className="text-sm text-slate-500 mt-3">This action cannot be undone.</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => handleDecline(showDeclineModal)}
                className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-semibold hover:bg-rose-700 transition-colors"
              >
                Yes, Decline
              </button>
              <button 
                onClick={() => setShowDeclineModal(null)}
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