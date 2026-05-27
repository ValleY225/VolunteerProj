import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search,
  MessageCircle,
  Lock,
  Send,
  User,
  ChevronRight
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
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string;
}

export default function VoluGroupsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('ngo_current_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserId(user.id);
      setUserName(user.name);
    } else {
      window.location.href = '/login';
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
      const response = await fetch(`${API_BASE}/api/users/${userId}/groups`);
      if (response.ok) {
        const groupsData = await response.json();
        setGroups(groupsData);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
      showMessage('Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

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

  const handleSendMessage = async (groupId: string) => {
    if (!userId || !newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    const messageText = newMessage;
    setNewMessage('');
    
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
        setNewMessage(messageText);
      }
    } catch (error) {
      showMessage('Network error', 'error');
      setNewMessage(messageText);
    } finally {
      setSendingMessage(false);
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
        <div>
          <div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-5 w-64 bg-slate-200 rounded-lg mt-2 animate-pulse" />
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
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Group Chats</h1>
        <p className="text-slate-500 font-medium mt-2 text-lg">Chat with coordinators and other volunteers.</p>
      </div>

      {/* Groups List */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
          <MessageCircle size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No groups yet</h3>
          <p className="text-slate-500">You haven't been added to any groups yet.</p>
          <p className="text-sm text-slate-400 mt-2">Coordinators will add you to groups for events you join.</p>
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

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedGroup ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
                {/* Chat Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-transparent">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">{selectedGroup.name}</h2>
                    <p className="text-sm text-slate-500">{selectedGroup.eventName}</p>
                    {selectedGroup.coordinatorsOnly && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <Lock size={10} /> Only coordinators can send messages
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages */}
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
                      const canWrite = !selectedGroup.coordinatorsOnly || msg.senderRole === 'Coordinator';
                      
                      return (
                        <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isSelf ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-900'} rounded-2xl px-4 py-2`}>
                            {!isSelf && (
                              <p className="text-xs font-semibold text-orange-600 mb-1 flex items-center gap-1">
                                {msg.senderName}
                                {msg.senderRole === 'Coordinator' && (
                                  <span className="text-[10px] bg-orange-100 text-orange-600 px-1 rounded">Coordinator</span>
                                )}
                              </p>
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

                {/* Message Input - только если волонтер может писать */}
                {!selectedGroup.coordinatorsOnly ? (
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
                ) : (
                  <div className="p-4 border-t border-slate-100 bg-amber-50 text-center">
                    <p className="text-sm text-amber-700 flex items-center justify-center gap-2">
                      <Lock size={14} />
                      Only coordinators can send messages in this group
                    </p>
                  </div>
                )}
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
    </div>
  );
}