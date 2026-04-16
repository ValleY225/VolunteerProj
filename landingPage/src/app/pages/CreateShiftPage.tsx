import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  FileText,
  AlertCircle
} from 'lucide-react';

export default function CreateShiftPage() {
  const [activeStep, setActiveStep] = useState(1);
  const steps = ['Basic Info', 'Location & Time', 'Roles & Requirements'];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard" 
            className="p-2 text-slate-400 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create New Shift</h1>
            <p className="text-slate-500 font-medium mt-1">Publish an opportunity to the VoluKZ network.</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm">
            <Save size={18} className="text-slate-400" />
            Save Draft
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 shadow-md transition-colors focus:ring-4 focus:ring-orange-200">
            <Send size={18} />
            Publish
          </button>
        </div>
      </div>

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
                Shift Title <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g. Weekend Park Cleanup"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                Category <span className="text-rose-500">*</span>
              </label>
              <select className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium text-slate-700 appearance-none">
                <option value="">Select a category...</option>
                <option value="environmental">Environmental Conservation</option>
                <option value="animal">Animal Welfare</option>
                <option value="community">Community Development</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">
                Description
              </label>
              <div className="relative">
                <textarea 
                  rows={5}
                  placeholder="Describe what volunteers will be doing..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium placeholder:text-slate-400 resize-none"
                />
                <FileText size={18} className="absolute left-4 top-4 text-slate-400" />
              </div>
              <p className="text-xs font-medium text-slate-500 ml-1 mt-1">Make it exciting! Good descriptions get 40% more signups.</p>
            </div>
            
            <button 
              onClick={() => setActiveStep(2)}
              className="mt-8 px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 ml-auto"
            >
              Continue to Location
            </button>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-8 max-w-2xl">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Start Date</label>
                <div className="relative">
                  <input type="date" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium text-slate-700" />
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">End Date</label>
                <div className="relative">
                  <input type="date" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium text-slate-700" />
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Start Time</label>
                <div className="relative">
                  <input type="time" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium text-slate-700" />
                  <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">End Time</label>
                <div className="relative">
                  <input type="time" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium text-slate-700" />
                  <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Location / Address</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search location or enter address..."
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium placeholder:text-slate-400"
                />
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <div className="h-48 mt-4 bg-slate-200 rounded-xl flex items-center justify-center border border-slate-200">
                <p className="text-slate-500 font-bold flex items-center gap-2"><MapPin size={20}/> Map Preview (Mock)</p>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button 
                onClick={() => setActiveStep(1)}
                className="px-8 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
              >
                Back
              </button>
              <button 
                onClick={() => setActiveStep(3)}
                className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Continue to Roles
              </button>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-8 max-w-2xl">
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-4">
              <AlertCircle className="text-orange-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-orange-900 mb-1">Define Clear Roles</h4>
                <p className="text-xs font-medium text-orange-800/80 leading-relaxed">Specify exactly what you need. Shifts with well-defined roles are filled 2x faster than general volunteer requests.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm relative group">
                <button className="absolute top-4 right-4 text-xs font-bold text-rose-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Role Title</label>
                    <input type="text" defaultValue="Registration Desk Helper" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-100 outline-none font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Volunteers Needed</label>
                    <div className="relative">
                      <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" defaultValue="4" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-100 outline-none font-medium" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Requirements (Optional)</label>
                  <input type="text" placeholder="e.g. Speaks English, Can lift 10kg..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-100 outline-none font-medium text-sm placeholder:text-slate-400" />
                </div>
              </div>

              <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
                + Add Another Role
              </button>
            </div>

            <div className="flex justify-between mt-8 pt-8 border-t border-slate-100">
              <button 
                onClick={() => setActiveStep(2)}
                className="px-8 py-3.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
              >
                Back
              </button>
              <button className="px-10 py-3.5 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 focus:ring-4 focus:ring-orange-200 transition-all flex items-center gap-2 shadow-md">
                <Send size={18} /> Publish Shift
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}