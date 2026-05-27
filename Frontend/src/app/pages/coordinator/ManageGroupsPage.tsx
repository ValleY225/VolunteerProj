import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { 
  Users, 
  PlusCircle, 
  ChevronRight,
  Search,
  MessageCircle,
  UserPlus,
  Settings,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react';

const API_BASE = (() => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  return '';
})();

interface Group {
  id: string;
  eventId: string;
  eventName: string;
  name: string;
  description: string;
  coordinatorsOnly: boolean;
  memberCount: number;
  isMember: boolean;
  canManageSettings: boolean;
  members?: GroupMember[];
}

interface GroupMember {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userPhotoUrl?: string;
}

interface Event {
  id: string;
  name: string;
  region: string;
  coordinatorId: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

interface Participant {
  participantId: string;
  participantName: string;
  eventName: string;
  shift: string;
}

export default function CoordinatorGroupsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [availableMembers, setAvailableMembers] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('ngo_current_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role !== 'Coordinator') {
        window.location.href = '/dashboard';
        return;
      }
      setUserId(user.id);
      setUserName(user.name);
      setUserRole(user.role);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  // Оптимизированная загрузка - ПАРАЛЛЕЛЬНЫЕ запросы
  const loadData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Запускаем оба запроса ПАРАЛЛЕЛЬНО
      const [eventsRes, groupsRes] = await Promise.all([
        fetch(`${API_BASE}/api/items`),
        fetch(`${API_BASE}/api/users/${userId}/groups`)
      ]);
      
      // Параллельно парсим JSON
      const [allEvents, groupsData] = await Promise.all([
        eventsRes.json(),
        groupsRes.ok ? groupsRes.json() : []
      ]);
      
      const myEventsList = allEvents.filter((e: Event) => e.coordinatorId === userId);
      setMyEvents(myEventsList);
      setGroups(groupsData);
      
    } catch (error) {
      console.error('Failed to load data:', error);
      showMessage('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Загрузка чата выбранной группы
  const loadGroupChat = useCallback(async (groupId: string) => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/groups/${groupId}/chat?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  }, [userId]);

  const loadAvailableMembers = async (eventId: string) => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/coordinators/${userId}/participants?eventId=${eventId}`);
      if (response.ok) {
        const participants = await response.json();
        setAvailableMembers(participants);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!userId || !selectedEventId || !newGroupName.trim()) {
      showMessage('Please fill all required fields', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/items/${selectedEventId}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coordinatorId: userId,
          name: newGroupName,
          description: newGroupDesc
        })
      });

      if (response.ok) {
        showMessage('Group created successfully!', 'success');
        setShowCreateModal(false);
        setNewGroupName('');
        setNewGroupDesc('');
        setSelectedEventId('');
        await loadData(); // Обновляем список групп
      } else {
        const error = await response.json();
        showMessage(error.message || 'Failed to create group', 'error');
      }
    } catch (error) {
      showMessage('Network error', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async (groupId: string, memberUserId: string) => {
    if (!userId) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinatorId: userId, memberUserId })
      });

      if (response.ok) {
        showMessage('Member added successfully!', 'success');
        await loadData(); // Обновляем список групп
        setShowAddMemberModal(false);
      } else {
        const error = await response.json();
        showMessage(error.message || 'Failed to add member', 'error');
      }
    } catch (error) {
      showMessage('Network error', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async (groupId: string) => {
    if (!userId || !newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    const messageText = newMessage;
    setNewMessage(''); // Очищаем сразу для UX
    
    try {
      const response = await fetch(`${API_BASE}/api/groups/${groupId}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: messageText })
      });

      if (response.ok) {
        await loadGroupChat(groupId);
      } else {
        const error = await response.json();
        showMessage(error.message || 'Failed to send message', 'error');
        setNewMessage(messageText); // Восстанавливаем сообщение при ошибке
      }
    } catch (error) {
      showMessage('Network error', 'error');
      setNewMessage(messageText);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleToggleChatSettings = async (groupId: string, coordinatorsOnly: boolean) => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE}/api/groups/${groupId}/chat/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinatorId: userId, coordinatorsOnly: !coordinatorsOnly })
      });

      if (response.ok) {
        showMessage(`Chat mode updated`, 'success');
        await loadData();
        if (selectedGroup?.id === groupId) {
          setSelectedGroup({ ...selectedGroup, coordinatorsOnly: !coordinatorsOnly });
        }
      } else {
        const error = await response.json();
        showMessage(error.message || 'Failed to update settings', 'error');
      }
    } catch (error) {
      showMessage('Network error', 'error');
    }
  };

  const handleSelectGroup = useCallback(async (group: Group) => {
    setSelectedGroup(group);
    await loadGroupChat(group.id);
  }, [loadGroupChat]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.eventName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Skeleton Loader
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-5 w-64 bg-slate-200 rounded-lg mt-2 animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-slate-200 rounded-full animate-pulse" />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="h-12 bg-slate-200 rounded-xl animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="h-[600px] bg-slate-100 rounded-3xl animate-pulse" />
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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Groups</h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">Manage chat groups for your events.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => loadData()}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 hover:shadow-lg transition-all"
          >
            <PlusCircle size={18} />
            Create New Group
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Groups List */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
          <Users size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No groups yet</h3>
          <p className="text-slate-500 mb-6">Create a group to start chatting with volunteers.</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700"
          >
            <PlusCircle size={18} />
            Create Group
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Groups Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search groups..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all shadow-sm"
              />
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filteredGroups.map((group) => (
                <motion.button
                  key={group.id}
                  onClick={() => handleSelectGroup(group)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-200 ${
                    selectedGroup?.id === group.id
                      ? 'bg-orange-50 border-orange-200 shadow-md'
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-extrabold text-slate-900">{group.name}</h3>
                    <span className="text-xs text-slate-400">{group.memberCount} members</span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-1">{group.eventName}</p>
                  {group.coordinatorsOnly && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      <Lock size={10} /> Coordinators only
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Chat Area - остальное без изменений */}
          <div className="lg:col-span-2">
            {selectedGroup ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">{selectedGroup.name}</h2>
                      <p className="text-sm text-slate-500">{selectedGroup.eventName}</p>
                    </div>
                    {selectedGroup.canManageSettings && (
                      <button
                        onClick={() => handleToggleChatSettings(selectedGroup.id, selectedGroup.coordinatorsOnly)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
                      >
                        {selectedGroup.coordinatorsOnly ? <Lock size={14} /> : <Unlock size={14} />}
                        {selectedGroup.coordinatorsOnly ? 'Coordinators only' : 'All members'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <button
                    onClick={() => {
                      loadAvailableMembers(selectedGroup.eventId);
                      setShowAddMemberModal(true);
                    }}
                    className="flex items-center gap-2 text-sm text-orange-600 font-semibold hover:text-orange-700 transition-colors"
                  >
                    <UserPlus size={16} />
                    Add Member
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle size={40} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No messages yet</p>
                      <p className="text-sm text-slate-400">Be the first to send a message!</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isSelf = msg.senderId === userId;
                      return (
                        <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isSelf ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-900'} rounded-2xl px-4 py-2`}>
                            {!isSelf && (
                              <p className="text-xs font-semibold text-orange-600 mb-1">{msg.senderName}</p>
                            )}
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-[10px] mt-1 ${isSelf ? 'text-orange-200' : 'text-slate-400'}`}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-white">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !sendingMessage && handleSendMessage(selectedGroup.id)}
                      placeholder="Type a message..."
                      disabled={sendingMessage}
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all disabled:opacity-50"
                    />
                    <button
                      onClick={() => handleSendMessage(selectedGroup.id)}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="px-5 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessage ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 h-[600px] flex flex-col items-center justify-center">
                <MessageCircle size={48} className="text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Select a group</h3>
                <p className="text-slate-500">Choose a group from the list to start chatting</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальные окна (Create Group, Add Member) - без изменений */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Create New Group</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Select Event *</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                >
                  <option value="">Choose an event</option>
                  {myEvents.map(event => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Group Name *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Cleanup Team"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="What is this group for?"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none resize-none"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCreateGroup}
                  disabled={actionLoading || !selectedEventId || !newGroupName.trim()}
                  className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Group'}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showAddMemberModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddMemberModal(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Add Member to {selectedGroup.name}</h2>
              <button onClick={() => setShowAddMemberModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableMembers.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No participants found for this event</p>
              ) : (
                availableMembers.map((member) => (
                  <div key={member.participantId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-slate-900">{member.participantName}</p>
                      <p className="text-xs text-slate-500">{member.shift} shift</p>
                    </div>
                    <button
                      onClick={() => handleAddMember(selectedGroup.id, member.participantId)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}