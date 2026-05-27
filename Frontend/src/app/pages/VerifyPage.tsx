import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, Clock, Trophy, MapPin, Award } from 'lucide-react'

export default function VerifyPage() {
  const [data, setData] = useState<{
    name: string
    hours: string
    events: string
    date: string
  } | null>(null)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const name = params.get('name')
    const hours = params.get('hours')
    const events = params.get('events')
    const date = params.get('date')

    if (name && hours && events && date) {
      setData({ name: decodeURIComponent(name), hours, events, date })
      setIsValid(true)
    }
  }, [])

  if (!isValid || !data) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Certificate</h1>
          <p className="text-slate-500">This certificate link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        {/* Verified badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-5 py-2 rounded-full font-bold text-sm">
            <CheckCircle2 size={18} />
            Verified Certificate
          </div>
        </div>

        {/* Certificate card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-100">
          {/* Top bar */}
          <div className="bg-orange-500 px-8 py-5 text-center">
            <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">VoluKZ</p>
            <h1 className="text-white text-2xl font-bold">Certificate of Appreciation</h1>
          </div>

          {/* Content */}
          <div className="px-8 py-8 text-center">
            <p className="text-slate-400 text-sm mb-2">This certifies that</p>
            <h2 className="text-4xl font-black text-slate-900 mb-1">{data.name}</h2>
            <div className="w-24 h-1 bg-orange-400 rounded mx-auto mb-4" />
            <p className="text-slate-500 text-sm">
              has completed verified volunteer service through the VoluKZ platform
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 px-8 pb-8">
            <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Trophy size={20} className="text-orange-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{data.events}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Events</p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Clock size={20} className="text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{data.hours}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Hours</p>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Award size={20} className="text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">✓</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Verified</p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-8 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Date of issue</p>
              <p className="text-sm font-bold text-slate-700">
                {new Date(data.date).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Issued by</p>
              <p className="text-sm font-bold text-orange-600">VoluKZ Platform</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          This certificate was issued by VoluKZ · volukz.org
        </p>
      </motion.div>
    </div>
  )
}