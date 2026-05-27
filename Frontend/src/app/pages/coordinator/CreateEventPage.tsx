import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router'; // ← исправлено: убрал "react" между скобками и from
import { 
  ArrowLeft, 
  Save, 
  Send, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  FileText,
  AlertCircle,
  Camera,
  X,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2
} from 'lucide-react';

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

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  
  // Shifts state
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  
  // New shift form
  const [shiftName, setShiftName] = useState('');
  const [shiftDate, setShiftDate] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftEndTime, setShiftEndTime] = useState('');
  const [shiftVolunteersNeeded, setShiftVolunteersNeeded] = useState(5);

  useEffect(() => {
    const storedUser = localStorage.getItem('ngo_current_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role !== 'Coordinator') {
        navigate('/dashboard');
        return;
      }
      setUserId(user.id);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handleAddShift = () => {
    if (!shiftName || !shiftDate || !shiftStartTime || !shiftEndTime) {
      setError('Please fill in all shift fields');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (editingShift) {
      // Update existing shift
      setShifts(shifts.map(s => 
        s.id === editingShift.id 
          ? { ...s, name: shiftName, date: shiftDate, startTime: shiftStartTime, endTime: shiftEndTime, volunteersNeeded: shiftVolunteersNeeded }
          : s
      ));
    } else {
      // Add new shift
      const newShift: Shift = {
        id: Date.now().toString(),
        name: shiftName,
        date: shiftDate,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        volunteersNeeded: shiftVolunteersNeeded,
      };
      setShifts([...shifts, newShift]);
    }
    
    // Reset form
    setShiftName('');
    setShiftDate('');
    setShiftStartTime('');
    setShiftEndTime('');
    setShiftVolunteersNeeded(5);
    setEditingShift(null);
    setShowShiftModal(false);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setShiftName(shift.name);
    setShiftDate(shift.date);
    setShiftStartTime(shift.startTime);
    setShiftEndTime(shift.endTime);
    setShiftVolunteersNeeded(shift.volunteersNeeded);
    setShowShiftModal(true);
  };

  const handleRemoveShift = (shiftId: string) => {
    setShifts(shifts.filter(s => s.id !== shiftId));
  };

  const handlePublish = async () => {
    // Validation
    if (!name.trim()) {
      setError('Event name is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (!region) {
      setError('Region is required');
      return;
    }
    if (!photo) {
      setError('Event photo is required');
      return;
    }
    if (shifts.length === 0) {
      setError('At least one shift is required');
      return;
    }
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    console.log('Shifts to send:', shifts);
    console.log('Shifts JSON string:', JSON.stringify(shifts));

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('region', region);
      formData.append('coordinatorId', userId);
      formData.append('photo', photo);
      formData.append('shifts', JSON.stringify(shifts));

      // Проверка FormData содержимого
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      
      // ПРАВИЛЬНЫЙ URL - /api/items, НЕ /api/login!
      const response = await fetch(`${API_BASE}/api/items`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create event');
      }

      // После успешного создания, обновляем событие с shifts отдельным запросом
      // if (result.event && result.event.id && shifts.length > 0) {
      //   const updateFormData = new FormData();
      //   updateFormData.append('shifts', JSON.stringify(shifts));
      //   updateFormData.append('coordinatorId', userId);
        
      //   await fetch(`${API_BASE}/api/items/${result.event.id}`, {
      //     method: 'PATCH',
      //     body: updateFormData,
      //   });
      // }
      
      setSuccess('Event created successfully!');
      setTimeout(() => navigate('/dashboard/events'), 2000);
      
    } catch (err: any) {
      console.error('Create event error:', err);
      setError(err.message || 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = () => {
    const combinedDescription = JSON.stringify({
      main: description,
      shifts: shifts
    });
    
    const draft = {
      name,
      description: combinedDescription,
      region,
      shifts,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('event_draft', JSON.stringify(draft));
    setSuccess('Draft saved locally!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const loadDraft = () => {
    const saved = localStorage.getItem('event_draft');
    if (saved) {
      const draft = JSON.parse(saved);
      setName(draft.name || '');
      setDescription(draft.description?.main || draft.description || '');
      setRegion(draft.region || '');
      setShifts(draft.shifts || []);
      setSuccess('Draft loaded');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const isStepValid = () => {
    if (activeStep === 1) {
      return name.trim() && description.trim() && region && photo;
    }
    if (activeStep === 2) {
      return shifts.length > 0;
    }
    return true;
  };

  const steps = ['Basic Info', 'Shifts & Schedule', 'Review & Publish'];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard" 
            className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create New Event</h1>
            <p className="text-slate-500 font-medium mt-1">Publish an opportunity to the VoluKZ network.</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save size={18} className="text-slate-400" />
            Save Draft
          </button>
          <button 
            onClick={loadDraft}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            Load Draft
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-medium flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Stepper */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between relative">
        <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
        {steps.map((step, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center gap-2">
            <button 
              onClick={() => setActiveStep(i + 1)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${
                activeStep === i + 1 
                  ? 'bg-orange-600 text-white border-orange-600 shadow-md scale-110' 
                  : activeStep > i + 1
                    ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
              }`}
            >
              {i + 1}
            </button>
            <span className={`text-xs font-bold tracking-wide uppercase ${
              activeStep === i + 1 ? 'text-slate-900' : 'text-slate-400'
            }`}>
              {step}
            </span>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <motion.div 
        key={activeStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-[2rem] p-8 md:p-12 border border-slate-100 shadow-sm"
      >
        {activeStep === 1 && (
          <div className="space-y-8 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                Event Title <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Weekend Park Cleanup"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                Region <span className="text-rose-500">*</span>
              </label>
              <select 
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium text-slate-700 appearance-none"
              >
                <option value="">Select region...</option>
                {REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">
                Description <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <textarea 
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what volunteers will be doing..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium placeholder:text-slate-400 resize-none"
                />
                <FileText size={18} className="absolute left-4 top-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                Event Photo <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                />
                <Camera size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {photoPreview && (
                <div className="mt-3">
                  <img src={photoPreview} alt="Preview" className="h-32 w-32 rounded-xl object-cover border-2 border-orange-200" />
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setActiveStep(2)}
              disabled={!isStepValid()}
              className="mt-8 px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Shifts
            </button>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-8 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Event Shifts</h3>
                <p className="text-slate-500 text-sm mt-1">Create one or more shifts for volunteers to choose from</p>
              </div>
              <button
                onClick={() => {
                  setEditingShift(null);
                  setShiftName('');
                  setShiftDate('');
                  setShiftStartTime('');
                  setShiftEndTime('');
                  setShiftVolunteersNeeded(5);
                  setShowShiftModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
              >
                <Plus size={18} />
                Add Shift
              </button>
            </div>

            {shifts.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <Clock size={48} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No shifts added yet</p>
                <p className="text-sm text-slate-400 mt-1">Click "Add Shift" to create shifts for your event</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shifts.map((shift) => (
                  <div key={shift.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-orange-200 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-slate-900">{shift.name}</h4>
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            {shift.volunteersNeeded} volunteers needed
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} /> {new Date(shift.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {shift.startTime} - {shift.endTime}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditShift(shift)}
                          className="p-2 rounded-lg bg-white text-slate-600 hover:bg-orange-100 hover:text-orange-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoveShift(shift.id)}
                          className="p-2 rounded-lg bg-white text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button 
                onClick={() => setActiveStep(1)}
                className="px-8 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
              >
                Back
              </button>
              <button 
                onClick={() => setActiveStep(3)}
                disabled={!isStepValid()}
                className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review & Publish
              </button>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-8 max-w-3xl">
            <div className="bg-green-50 border border-green-100 rounded-xl p-6">
              <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                <CheckCircle2 size={20} />
                Review Your Event
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-green-100">
                  <span className="font-medium text-green-700">Event Name:</span>
                  <span className="text-green-900 font-bold">{name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-green-100">
                  <span className="font-medium text-green-700">Region:</span>
                  <span className="text-green-900">{region}</span>
                </div>
                <div className="py-2 border-b border-green-100">
                  <span className="font-medium text-green-700 block mb-1">Description:</span>
                  <p className="text-green-800 text-sm">{description}</p>
                </div>
                <div className="py-2">
                  <span className="font-medium text-green-700 block mb-2">Shifts ({shifts.length}):</span>
                  {shifts.map((shift, i) => (
                    <div key={shift.id} className="text-sm text-green-800 mb-2 pl-4">
                      • {shift.name} - {new Date(shift.date).toLocaleDateString()} ({shift.startTime}-{shift.endTime}) - Need {shift.volunteersNeeded} volunteers
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8 pt-8 border-t border-slate-100">
              <button 
                onClick={() => setActiveStep(2)}
                className="px-8 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
              >
                Back
              </button>
              <button 
                onClick={handlePublish}
                disabled={isLoading || !isStepValid()}
                className="px-10 py-3.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 focus:ring-4 focus:ring-orange-200 transition-all flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                Publish Event
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Add/Edit Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShiftModal(false)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingShift ? 'Edit Shift' : 'Add New Shift'}
              </h2>
              <button onClick={() => setShowShiftModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Shift Name *</label>
                <input 
                  type="text" 
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  placeholder="e.g. Morning Shift, Registration Desk"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Date *</label>
                <input 
                  type="date" 
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Start Time *</label>
                  <input 
                    type="time" 
                    value={shiftStartTime}
                    onChange={(e) => setShiftStartTime(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">End Time *</label>
                  <input 
                    type="time" 
                    value={shiftEndTime}
                    onChange={(e) => setShiftEndTime(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Volunteers Needed *</label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  value={shiftVolunteersNeeded}
                  onChange={(e) => setShiftVolunteersNeeded(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleAddShift}
                  className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                >
                  {editingShift ? 'Update Shift' : 'Add Shift'}
                </button>
                <button 
                  onClick={() => setShowShiftModal(false)}
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