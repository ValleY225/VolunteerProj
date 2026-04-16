import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserCircle, Shield, Bell, Lock, KeyRound, Smartphone, Mail, Globe, Palette } from 'lucide-react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('Profile');

  const sections = [
    { name: 'Profile Settings', icon: <UserCircle size={18} /> },
    { name: 'Account & Security', icon: <Shield size={18} /> },
    { name: 'Notifications', icon: <Bell size={18} /> },
    { name: 'Privacy', icon: <Lock size={18} /> },
    { name: 'Appearance', icon: <Palette size={18} /> }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 font-medium mt-2 text-lg">Manage your account preferences and personal details.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-2">
            {sections.map(section => (
              <button
                key={section.name}
                onClick={() => setActiveSection(section.name)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 text-left ${
                  activeSection === section.name 
                    ? 'bg-orange-50 text-orange-600 shadow-[inset_0_1px_2px_rgba(255,237,213,0.5)] border border-orange-100/50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`${activeSection === section.name ? 'text-orange-600' : 'text-slate-400'}`}>
                  {section.icon}
                </div>
                {section.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <motion.div 
            key={activeSection}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl p-8 md:p-10 border border-slate-100 shadow-sm"
          >
            {activeSection === 'Profile Settings' && (
              <div className="space-y-8">
                <div className="flex items-center gap-6 pb-8 border-b border-slate-100">
                  <div className="relative group cursor-pointer">
                    <img 
                      src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=faces&fit=crop&w=200&h=200&q=80" 
                      alt="Profile" 
                      className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-sm transition-opacity group-hover:opacity-75"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-bold text-xs bg-slate-900/50 px-2 py-1 rounded-md">Change</span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 mb-1">Profile Photo</h2>
                    <p className="text-sm font-medium text-slate-500 mb-3">JPG, GIF or PNG. Max size of 5MB.</p>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-orange-50 text-orange-600 font-bold rounded-lg hover:bg-orange-100 transition-colors text-sm border border-orange-100/50">Upload New</button>
                      <button className="px-4 py-2 bg-slate-50 text-slate-600 font-bold rounded-lg hover:bg-slate-100 transition-colors text-sm border border-slate-200">Remove</button>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">First Name</label>
                    <input 
                      type="text" 
                      defaultValue="Dias"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium text-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Last Name</label>
                    <input 
                      type="text" 
                      defaultValue="Muratov"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium text-slate-900"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        defaultValue="dias.muratov@example.com"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium text-slate-900"
                      />
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Bio</label>
                    <textarea 
                      rows={4}
                      defaultValue="Passionate about environmental sustainability and youth education. Studying Computer Science at KazNU. Always ready to lend a hand for a good cause!"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-medium text-slate-900 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button className="px-6 py-2.5 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 shadow-sm">Cancel</button>
                  <button className="px-6 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-md transition-colors focus:ring-4 focus:ring-orange-200">Save Changes</button>
                </div>
              </div>
            )}
            
            {activeSection !== 'Profile Settings' && (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <Shield size={48} className="text-slate-200 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">{activeSection}</h3>
                <p className="text-slate-500">Settings for this section will be available soon.</p>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}