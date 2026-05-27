import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import QRCode from 'qrcode';
import { 
  Clock, Trophy, MapPin, Edit3, CheckCircle2, X, AlertCircle, 
  Calendar, Users, Briefcase, TrendingUp, PlusCircle, Download, Award
} from 'lucide-react';
import { jsPDF } from 'jspdf';

const API_BASE = (() => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  return '';
})();

const REGIONS = ['Almaty', 'Astana'];

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
  coordinatorId: string;
  coordinatorName: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Participant' | 'Coordinator';
  region: string;
  birthDate: string;
  photoUrl?: string;
}

interface JoinHistory {
  id: string;
  eventId: string;
  eventName: string;
  eventRegion: string;
  shift: string;
  status: string;
  requestedAt: string;
  decidedAt?: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [history, setHistory] = useState<JoinHistory[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);
  
  // Certificate modal state
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateName, setCertificateName] = useState('');
  
  const [editName, setEditName] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem('ngo_current_user');
        if (!storedUser) {
          navigate('/login');
          return;
        }
        
        const currentUser: User = JSON.parse(storedUser);
        setUser(currentUser);
        setEditName(currentUser.name);
        setEditRegion(currentUser.region);
        setEditBirthDate(currentUser.birthDate?.split('T')[0] || '');
        
        // Load events
        const eventsRes = await fetch(`${API_BASE}/api/items`);
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          const parsedEvents = eventsData.map((event: any) => ({
            ...event,
            shifts: event.shifts ? (typeof event.shifts === 'string' ? JSON.parse(event.shifts) : event.shifts) : []
          }));
          setEvents(parsedEvents);
          
          if (currentUser.role === 'Coordinator') {
            const myEventsList = parsedEvents.filter((e: Event) => e.coordinatorId === currentUser.id);
            setMyEvents(myEventsList);
          }
        }
        
        // Load volunteer history for all users
        const joinsRes = await fetch(`${API_BASE}/api/users/${currentUser.id}/joins`);
        if (joinsRes.ok) {
          const joinsData = await joinsRes.json();
          setHistory(joinsData.filter((j: JoinHistory) => j.status === 'approved'));
        }
        
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [navigate]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const getShiftDetails = (eventId: string, shiftName: string): Shift | null => {
    const event = events.find(e => e.id === eventId);
    if (!event || !event.shifts) return null;
    return event.shifts.find(s => s.name === shiftName) || null;
  };

  const getShiftDurationInHours = (startTime: string, endTime: string): number => {
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    
    let startMinutes = start[0] * 60 + (start[1] || 0);
    let endMinutes = end[0] * 60 + (end[1] || 0);
    
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    const durationMinutes = endMinutes - startMinutes;
    return durationMinutes / 60;
  };

  const isPastShift = (eventId: string, shiftName: string): boolean => {
    const shift = getShiftDetails(eventId, shiftName);
    if (!shift) return false;
    
    const [year, month, day] = shift.date.split('-');
    const [endHour, endMinute] = shift.endTime.split(':');
    const shiftEndDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(endHour), parseInt(endMinute));
    
    const now = new Date();
    return shiftEndDateTime < now;
  };

  const getTotalHours = (): number => {
    let total = 0;
    history.forEach(join => {
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
  };

  const getCompletedShiftsCount = (): number => {
    return history.filter(join => isPastShift(join.eventId, join.shift)).length;
  };

  const getUniqueRegions = (): number => {
    return new Set(history.map(h => h.eventRegion)).size;
  };

  const totalHours = getTotalHours();
  const completedShifts = getCompletedShiftsCount();
  const uniqueRegions = getUniqueRegions();

  // Экспорт CSV для волонтера
  const handleExportMyHours = () => {
    if (!user || history.length === 0) {
      showMessage('No volunteer history to export', 'error');
      return;
    }
    
    const headers = ['Event Name', 'Region', 'Shift', 'Date', 'Time', 'Duration (hours)', 'Status'];
    
    const rows = history.map(item => {
      const shiftDetails = getShiftDetails(item.eventId, item.shift);
      const isPast = isPastShift(item.eventId, item.shift);
      const duration = shiftDetails ? getShiftDurationInHours(shiftDetails.startTime, shiftDetails.endTime) : 4;
      const shiftDate = shiftDetails ? new Date(shiftDetails.date).toLocaleDateString() : '-';
      const shiftTime = shiftDetails ? `${shiftDetails.startTime} - ${shiftDetails.endTime}` : '-';
      
      return [
        `"${item.eventName}"`,
        `"${item.eventRegion}"`,
        `"${item.shift}"`,
        `"${shiftDate}"`,
        `"${shiftTime}"`,
        duration.toFixed(1),
        isPast ? 'Completed' : 'Upcoming'
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    const filename = `volunteer_hours_${user.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showMessage('Impact report downloaded successfully!', 'success');
  };

  // Открытие модального окна для сертификата
  const handleOpenCertificateModal = () => {
    if (!user || history.length === 0) {
      showMessage('No volunteer history to generate certificate', 'error');
      return;
    }
    if (completedShifts === 0) {
      showMessage('You need to complete at least one shift to get a certificate', 'error');
      return;
    }
    setCertificateName(user.name);
    setShowCertificateModal(true);
  };

  // Генерация PDF сертификата
  const handleGenerateCertificate = async () => {
    if (!certificateName.trim()) {
      showMessage('Please enter your name', 'error');
      return;
    }

    const completedHistory = history.filter(join => isPastShift(join.eventId, join.shift));
    const totalHoursValue = getTotalHours();

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297, H = 210, cx = W / 2;

    // === ФОН ===
    pdf.setFillColor(255, 252, 245);
    pdf.rect(0, 0, W, H, 'F');

    // Боковые декоративные полосы
    pdf.setFillColor(251, 146, 60); // orange-400
    pdf.rect(0, 0, 8, H, 'F');
    pdf.rect(W - 8, 0, 8, H, 'F');

    // Тонкая золотая линия рядом с полосой
    pdf.setDrawColor(251, 146, 60);
    pdf.setLineWidth(0.5);
    pdf.line(11, 20, 11, H - 20);
    pdf.line(W - 11, 20, W - 11, H - 20);

    // === ВЕРХНИЙ БЛОК ===
    pdf.setFillColor(255, 237, 213); // orange-100
    pdf.rect(20, 14, W - 40, 28, 'F');

    pdf.setFontSize(11);
    pdf.setTextColor(154, 52, 18); // orange-800
    pdf.setFont('helvetica', 'bold');
    pdf.text('V O L U K Z', cx, 24, { align: 'center' });

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(194, 65, 12);
    pdf.text('VOLUNTEER MANAGEMENT PLATFORM · KAZAKHSTAN', cx, 31, { align: 'center' });

    pdf.setDrawColor(251, 146, 60);
    pdf.setLineWidth(0.8);
    pdf.line(20, 42, W - 20, 42);

    // === ЗАГОЛОВОК ===
    pdf.setFontSize(42);
    pdf.setFont('times', 'bold');
    pdf.setTextColor(30, 30, 30);
    pdf.text('Certificate', cx, 68, { align: 'center' });

    pdf.setFontSize(13);
    pdf.setFont('times', 'italic');
    pdf.setTextColor(120, 120, 130);
    pdf.text('of Volunteer Appreciation', cx, 80, { align: 'center' });

    // Декоративная линия с ромбом
    pdf.setDrawColor(251, 146, 60);
    pdf.setLineWidth(0.6);
    pdf.line(cx - 70, 87, cx - 6, 87);
    pdf.line(cx + 6, 87, cx + 70, 87);
    pdf.setFillColor(251, 146, 60);
    pdf.circle(cx, 87, 2.5, 'F');

    // === ОСНОВНОЙ ТЕКСТ ===
    pdf.setFontSize(10);
    pdf.setFont('times', 'normal');
    pdf.setTextColor(100, 100, 110);
    pdf.text('This certificate is proudly presented to', cx, 98, { align: 'center' });

    // Имя получателя
    pdf.setFontSize(30);
    pdf.setFont('times', 'bold');
    pdf.setTextColor(20, 20, 30);
    pdf.text(certificateName, cx, 118, { align: 'center' });

    // Подчёркивание имени
    const nameWidth = pdf.getTextWidth(certificateName);
    pdf.setDrawColor(251, 146, 60);
    pdf.setLineWidth(1);
    pdf.line(cx - nameWidth / 2, 121, cx + nameWidth / 2, 121);

    pdf.setFontSize(10);
    pdf.setFont('times', 'italic');
    pdf.setTextColor(100, 100, 110);
    pdf.text('in recognition of dedicated volunteer service and community contribution', cx, 131, { align: 'center' });

    // === БЛОКИ СО СТАТИСТИКОЙ ===
    const statsY = 141;
    const blockW = 72, blockH = 24, gap = 8;
    const totalW = blockW * 3 + gap * 2;
    const startX = cx - totalW / 2;

    const drawStatBlock = (x: number, icon: string, value: string, label: string) => {
      pdf.setFillColor(255, 247, 237);
      pdf.setDrawColor(251, 146, 60);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(x, statsY, blockW, blockH, 3, 3, 'FD');

      pdf.setFontSize(16);
      pdf.setFont('times', 'bold');
      pdf.setTextColor(234, 88, 12);
      pdf.text(value, x + blockW / 2, statsY + 11, { align: 'center' });

      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 130);
      pdf.text(label.toUpperCase(), x + blockW / 2, statsY + 19, { align: 'center' });
    };

    drawStatBlock(startX, '🏆', String(completedHistory.length), 'Events Completed');
    drawStatBlock(startX + blockW + gap, '⏱', `${totalHoursValue.toFixed(1)}h`, 'Hours Contributed');
    drawStatBlock(startX + (blockW + gap) * 2, '📍', String(uniqueRegions), 'Regions Served');

    // === ПОДПИСИ ===
    const sigY = H - 42;

    // Левая подпись
    pdf.setDrawColor(180, 180, 190);
    pdf.setLineWidth(0.4);
    pdf.line(cx - 95, sigY, cx - 25, sigY);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 60, 70);
    pdf.text('AUTHORIZED BY', cx - 60, sigY + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 130);
    pdf.text('VoluKZ Platform', cx - 60, sigY + 10, { align: 'center' });

    // Центральная печать
    pdf.setDrawColor(251, 146, 60);
    pdf.setFillColor(255, 247, 237);
    pdf.setLineWidth(0.8);
    pdf.circle(cx, sigY + 3, 10, 'FD');
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(154, 52, 18);
    pdf.text('VOLUKZ', cx, sigY + 2, { align: 'center' });
    pdf.text('OFFICIAL', cx, sigY + 6, { align: 'center' });

    // Правая подпись
    pdf.setDrawColor(180, 180, 190);
    pdf.setLineWidth(0.4);
    pdf.line(cx + 25, sigY, cx + 95, sigY);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 60, 70);
    pdf.text('DATE OF ISSUE', cx + 60, sigY + 5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 130);
    pdf.text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), cx + 60, sigY + 10, { align: 'center' });

    // === НИЖНИЙ КОЛОНТИТУЛ ===
    pdf.setFillColor(255, 237, 213);
    pdf.rect(20, H - 18, W - 40, 12, 'F');
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(154, 52, 18);
    pdf.text('Thank you for making a difference · www.volukz.org · Kazakhstan Volunteer Platform', cx, H - 10, { align: 'center' });

    // Генерация QR кода
    const qrData = `http://localhost:5173/verify?name=${encodeURIComponent(certificateName)}&hours=${totalHoursValue.toFixed(1)}&events=${completedHistory.length}&date=${new Date().toISOString().split('T')[0]}&uid=${user?.id}-${Date.now()}`;
    const qrDataUrl = await QRCode.toDataURL(qrData, { 
      width: 80, 
      margin: 1,
      color: { dark: '#1e1e2e', light: '#fff7ed' }
    });

    // Добавляем QR в PDF
    pdf.addImage(qrDataUrl, 'PNG', W - 42, H - 42, 22, 22);
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(154, 52, 18);
    pdf.text('SCAN TO VERIFY', W - 31, H - 18, { align: 'center' });

    pdf.save(`VoluKZ_Certificate_${certificateName.replace(/\s/g, '_')}.pdf`);
    showMessage('Certificate generated successfully! 🎉', 'success');
    setShowCertificateModal(false);
    setCertificateName('');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('region', editRegion);
      formData.append('birthDate', editBirthDate);
      if (editPhoto) {
        formData.append('photo', editPhoto);
      }
      
      const response = await fetch(`${API_BASE}/api/users/${user?.id}`, {
        method: 'PATCH',
        body: formData,
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update profile');
      
      localStorage.setItem('ngo_current_user', JSON.stringify(result.user));
      setUser(result.user);
      setSuccess('Profile updated successfully!');
      window.dispatchEvent(new CustomEvent('userChanged', { detail: result.user }));
      
      setTimeout(() => {
        setSuccess('');
        setIsEditing(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setEditPhotoPreview(previewUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getAvatarUrl = () => {
    if (editPhotoPreview) return editPhotoPreview;
    if (user.photoUrl) return `${API_BASE}${user.photoUrl}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f97316&color=fff&bold=true`;
  };

  const isCoordinator = user.role === 'Coordinator';
  const hasCompletedShifts = completedShifts > 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {message && (
        <div className={`fixed top-24 right-6 z-50 px-4 py-3 rounded-xl shadow-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-50 to-teal-50 rounded-bl-full opacity-60 -z-0 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="relative">
            <img 
              src={getAvatarUrl()} 
              alt={user.name} 
              className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-lg"
            />
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors shadow-md border-2 border-white"
              >
                <Edit3 size={16} />
              </button>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{user.name}</h1>
                <p className="text-lg font-medium text-slate-500 mt-1">{user.region}, Kazakhstan</p>
                <p className="text-sm text-slate-400 mt-1">{user.email}</p>
              </div>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-bold uppercase tracking-widest">
                {user.role === 'Participant' ? 'Volunteer' : 'Coordinator'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-600 flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-medium text-green-600 flex items-center gap-2">
                <CheckCircle2 size={16} /> {success}
              </div>
            )}
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Region</label>
                <select 
                  value={editRegion}
                  onChange={(e) => setEditRegion(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                  required
                >
                  {REGIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Date of Birth</label>
                <input 
                  type="date" 
                  value={editBirthDate}
                  onChange={(e) => setEditBirthDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Profile Photo</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-orange-600 text-white py-2 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                >
                  Save Changes
                </button>
                <button 
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Content based on role */}
      {isCoordinator ? (
        // Coordinator View
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-2xl font-extrabold text-slate-900 mb-8 flex items-center gap-2">
            <Briefcase size={24} className="text-orange-600" />
            Events I Created
          </h3>
          
          {myEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-500">No events created yet</p>
              <p className="text-sm text-slate-400 mt-2">Create your first event to get started!</p>
              <Link 
                to="/dashboard/create-event"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
              >
                <PlusCircle size={16} />
                Create Event
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myEvents.map((event) => (
                <div key={event.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">{event.name}</h4>
                      <p className="text-sm text-slate-500">{event.region}</p>
                    </div>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      {event.shifts?.length || 0} shifts
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">{event.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Created {new Date(event.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Volunteer View
        <div className="grid lg:grid-cols-3 gap-8">
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
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{totalHours.toFixed(1)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Completed Shifts</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{completedShifts}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Locations Served</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{uniqueRegions}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm h-full">
              <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
                <h3 className="text-2xl font-extrabold text-slate-900">Volunteering History</h3>
                <div className="flex gap-2">
                  {hasCompletedShifts && (
                    <button
                      onClick={handleOpenCertificateModal}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors"
                    >
                      <Award size={16} />
                      Get Certificate
                    </button>
                  )}
                  {history.length > 0 && (
                    <button
                      onClick={handleExportMyHours}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      <Download size={16} />
                      Download Report
                    </button>
                  )}
                </div>
              </div>
              
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                    <Users size={40} className="text-orange-600" />
                  </div>
                  <p className="text-lg font-medium text-slate-500">No volunteering history yet</p>
                  <p className="text-sm text-slate-400 mt-2">Join events to start building your impact!</p>
                  <Link 
                    to="/dashboard/opportunities"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                  >
                    Find Opportunities
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item) => {
                    const shiftDetails = getShiftDetails(item.eventId, item.shift);
                    const isPast = isPastShift(item.eventId, item.shift);
                    
                    return (
                      <div key={item.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                            {new Date(item.requestedAt).toLocaleDateString()}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                            isPast ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            <CheckCircle2 size={12} />
                            {isPast ? 'Completed' : 'Upcoming'}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1">{item.eventName}</h4>
                        <p className="text-sm font-medium text-slate-500">{item.eventRegion}</p>
                        {shiftDetails && (
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">
                              {item.shift}
                            </span>
                            <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">
                              {shiftDetails.startTime} - {shiftDetails.endTime}
                            </span>
                            <span className="bg-white px-2 py-1 rounded-lg border border-slate-200">
                              {new Date(shiftDetails.date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Name Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCertificateModal(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Generate Certificate</h2>
              <button onClick={() => setShowCertificateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Name on Certificate</label>
                <input
                  type="text"
                  value={certificateName}
                  onChange={(e) => setCertificateName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1">The name will appear in uppercase on the certificate</p>
              </div>
              
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <p className="text-sm font-semibold text-amber-800 mb-2">📜 Certificate includes:</p>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• <strong>{completedShifts}</strong> completed event(s)</li>
                  <li>• <strong>{totalHours.toFixed(1)}</strong> total hours contributed</li>
                  <li>• Professional design with gold accents</li>
                  <li>• Official VoluKZ seal</li>
                </ul>
              </div>
            
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleGenerateCertificate}
                  className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                >
                  Generate Certificate
                </button>
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="flex-1 border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}