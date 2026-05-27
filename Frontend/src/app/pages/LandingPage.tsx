"use client"

import { useRef, useState } from "react"
import { motion, AnimatePresence, useScroll, useTransform  } from "motion/react"
import { Menu, X, Star, Download, Link2, User, Users, ArrowUp } from "lucide-react"
import { Button } from "../components/ui/button"

// Feature bullet point component
function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-orange-200" />
      <span className="text-muted-foreground">{children}</span>
    </div>
  )
}

// Section badge component
function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-sm font-semibold tracking-widest text-orange-500 uppercase">
      {children}
    </span>
  )
}

// Event Management Demo Card
function EventCard() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="font-semibold text-card-foreground">City Park Cleanup — Almaty</span>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-600">
            Live
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          June 3 · 2 shifts · 40 volunteers needed
        </p>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Shift 1: 09:00–12:00</span>
              <span className="text-card-foreground">
                <span className="font-bold">18 / 20</span> filled
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-orange-100">
              <div className="h-2 w-[90%] rounded-full bg-orange-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Shift 2: 13:00–16:00</span>
              <span className="text-card-foreground">
                <span className="font-bold">12 / 20</span> filled
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-orange-100">
              <div className="h-2 w-[60%] rounded-full bg-orange-500" />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-card-foreground">Pending Requests</p>
            <p className="text-sm text-muted-foreground">7 new applications waiting</p>
          </div>
          <Button className="rounded-full bg-orange-500 hover:bg-orange-600 text-white">
            Review
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hour Tracking Demo Card
function HourTrackingCard() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground mb-2">Total hours this year</p>
        <p className="text-5xl font-bold text-card-foreground mb-4">
          124 <span className="text-2xl font-normal text-muted-foreground">hrs</span>
        </p>
        <div className="flex gap-3">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-600 flex items-center gap-1">
            <ArrowUp className="h-3 w-3" /> 18 this month
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-600">
            5 events attended
          </span>
        </div>
      </div>
      <div className="rounded-2xl bg-card p-6 shadow-sm">
        <p className="font-semibold text-card-foreground mb-4">Recent Activity</p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌿</span>
              <div>
                <p className="font-medium text-card-foreground">City Park Cleanup</p>
                <p className="text-sm text-muted-foreground">4 hrs · Confirmed</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-600">
              +4h
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <div>
                <p className="font-medium text-card-foreground">Literacy Camp</p>
                <p className="text-sm text-muted-foreground">8 hrs · Confirmed</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-600">
              +8h
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Volunteer Ranking Profile Card
function ProfileCard() {
  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100">
          <User className="h-7 w-7 text-sky-500" />
        </div>
        <div>
          <p className="font-semibold text-card-foreground">Aigerim Bekova</p>
          <p className="text-sm text-muted-foreground">Almaty · Member since 2023</p>
        </div>
      </div>
      <div className="mb-4">
        <span className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-card-foreground">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          Gold Volunteer
        </span>
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progress to Platinum</span>
          <span className="text-card-foreground">780 / 1000 pts</span>
        </div>
        <div className="h-2 w-full rounded-full bg-orange-100">
          <div className="h-2 w-[78%] rounded-full bg-orange-500" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-bold text-card-foreground">124</p>
          <p className="text-xs text-muted-foreground">Hours</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-card-foreground">18</p>
          <p className="text-xs text-muted-foreground">Events</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-card-foreground">4.9</p>
          <p className="text-xs text-muted-foreground">Rating</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-card-foreground">#12</p>
          <p className="text-xs text-muted-foreground">City rank</p>
        </div>
      </div>
    </div>
  )
}

// Certificate Card
function CertificateCard() {
  return (
    <div className="rounded-2xl border-2 border-orange-200 bg-card p-4 shadow-sm">
      <div className="rounded-xl border border-border bg-card p-6 relative">
        <span className="absolute -top-3 right-4 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white uppercase tracking-wide">
          Certificate
        </span>
        <p className="text-sm text-muted-foreground mb-1">This certifies that</p>
        <p className="text-xl font-bold text-card-foreground mb-2">Aigerim Bekova</p>
        <p className="text-sm text-muted-foreground mb-4">has completed volunteer service with</p>
        <div className="flex gap-2 mb-6">
          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600">
            EcoKazakhstan
          </span>
          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600">
            Birgemiz
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-2xl font-bold text-card-foreground">124h</p>
            <p className="text-xs text-muted-foreground">Total Hours</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">18</p>
            <p className="text-xs text-muted-foreground">Events</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-card-foreground">Gold</p>
            <p className="text-xs text-muted-foreground">Final Rank</p>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <Button className="flex-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white">
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
        <Button variant="outline" className="flex-1 rounded-full">
          <Link2 className="mr-2 h-4 w-4" /> Share Link
        </Button>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })

  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15])
  const whiteOverlay = useTransform(scrollYProgress, [0, 0.7, 1], [0, 0, 1])

    return (
    <div className="bg-white min-h-screen">
      <section ref={heroRef} className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Фоновое изображение */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ scale: bgScale }}
        >
          <div
            style={{
              backgroundImage: 'url("/hero-bg2.png")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              width: '100%',
              height: '100%',
            }}
          />
          <div className="absolute inset-0 bg-black/30" />
        </motion.div>

        <motion.div
          className="absolute inset-0 z-[4] pointer-events-none bg-white"
          style={{ opacity: whiteOverlay }}
        />

        {/* Navbar */}
        <nav className="relative z-10 w-full px-6 py-6 md:px-12 lg:px-20">
          <div className="relative mx-auto flex max-w-7xl items-center justify-between">
            {/* Логотип */}
            <a href="/" className="flex items-center gap-2 shrink-0">
              <img src="/logo.png" alt="VoluKz" className="h-8 w-auto" />
              <span className="text-2xl font-bold text-white">VoluKz</span>
            </a>

            {/* Ссылки по центру */}
            <div className="hidden md:flex items-center justify-center gap-8 flex-1">
              <a href="#features" className="text-sm text-white/60 hover:text-white transition-colors">Features</a>
              <a href="#join" className="text-sm text-white/60 hover:text-white transition-colors">For NGOs</a>
              <a href="#join" className="text-sm text-white/60 hover:text-white transition-colors">Volunteers</a>
              <a href="#join" className="text-sm text-white/60 hover:text-white transition-colors">About</a>
            </div>

            {/* Кнопки справа */}
            <div className="hidden md:flex items-center gap-3">
              <a href="/login" className="text-sm text-white/90 hover:text-white transition-colors">Sign in</a>
              <a href="/register" className="rounded-full bg-orange-500 hover:bg-orange-600 px-8 py-3 text-base font-semibold text-white transition-colors">
                Sign Up
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-4 flex flex-col gap-2 md:hidden bg-black/70 backdrop-blur-md rounded-2xl p-4"
              >
                <a href="#features" className="py-2 text-white/70 hover:text-white transition-colors">Features</a>
                <a href="#join" className="py-2 text-white/70 hover:text-white transition-colors">For NGOs</a>
                <a href="#join" className="py-2 text-white/70 hover:text-white transition-colors">Volunteers</a>
                <a href="#join" className="py-2 text-white/70 hover:text-white transition-colors">About</a>
                <hr className="border-white/10 my-1" />
                <a href="/login" className="py-2 text-white/70 hover:text-white transition-colors">Sign in</a>
                <a href="/register" className="mt-1 rounded-full bg-orange-500 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-orange-600 transition-colors">
                  Get started
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl"
          >
            <h1 className="text-5xl md:text-5xl lg:text-5xl font-bold text-white leading-tight">
              Defining the future of
              <br />
              volunteering in Kazakhstan
            </h1>
            
            <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
              Meet the platform that accelerates volunteer onboarding, automates manual work, and grows community impact.
            </p>
            
            <div className="mt-8">
              <a href="/register" className="rounded-full bg-orange-500 hover:bg-orange-600 px-8 py-3 text-base font-semibold text-white transition-colors inline-block">
                Get started
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ОСТАЛЬНЫЕ СЕКЦИИ (Feature 1, 2, 3, 4, Choose Role, CTA, Footer) */}
      
      {/* Feature 1: Event Management */}
      <section id="features" className="px-6 py-24 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-7xl"
        >
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <SectionBadge>01 — Event Management</SectionBadge>
              <h2 className="mt-4 text-4xl font-black leading-tight text-foreground md:text-5xl text-balance">
                Post events. Fill shifts. Done.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                NGO coordinators can create events in minutes, define shifts, set volunteer caps, and receive and approve participant requests — all in one dashboard.
              </p>
              <div className="mt-8 space-y-4">
                <FeatureItem>Create events with custom shifts and capacity limits</FeatureItem>
                <FeatureItem>Review and approve volunteer applications instantly</FeatureItem>
                <FeatureItem>Send automated confirmations and reminders</FeatureItem>
                <FeatureItem>Export participant lists as CSV at any time</FeatureItem>
              </div>
            </div>
            <div className="lg:pl-8">
              <EventCard />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature 2: Hour Tracking */}
      <section className="px-6 py-24 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-7xl"
        >
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 lg:pr-8">
              <HourTrackingCard />
            </div>
            <div className="order-1 lg:order-2">
              <SectionBadge>02 — Hour Tracking</SectionBadge>
              <h2 className="mt-4 text-4xl font-black leading-tight text-foreground md:text-5xl text-balance">
                Every hour counts. We track them all.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Volunteers log their attended shifts and accumulate verified hours automatically. Coordinators confirm attendance with a single click — no spreadsheets needed.
              </p>
              <div className="mt-8 space-y-4">
                <FeatureItem>Automatic hour accumulation per confirmed shift</FeatureItem>
                <FeatureItem>Coordinator check-in confirmation per event</FeatureItem>
                <FeatureItem>Full personal history of all attended events</FeatureItem>
                <FeatureItem>Monthly and total hour summaries at a glance</FeatureItem>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature 3: Volunteer Ranking */}
      <section className="px-6 py-24 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-7xl"
        >
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <SectionBadge>03 — Volunteer Ranking</SectionBadge>
              <h2 className="mt-4 text-4xl font-black leading-tight text-foreground md:text-5xl text-balance">
                Show up. Level up.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                The more reliably you volunteer, the higher your rank. Consistent attendance and feedback from coordinators build your reputation on the platform.
              </p>
              <div className="mt-8 space-y-4">
                <FeatureItem>Rank system from Newcomer to Elite Volunteer</FeatureItem>
                <FeatureItem>Points earned through hours, attendance, and ratings</FeatureItem>
                <FeatureItem>Coordinator feedback visible on your profile</FeatureItem>
                <FeatureItem>Leaderboards per city and per NGO</FeatureItem>
              </div>
            </div>
            <div className="lg:pl-8">
              <ProfileCard />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature 4: CV Certificate */}
      <section className="px-6 py-24 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-7xl"
        >
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 lg:pr-8">
              <CertificateCard />
            </div>
            <div className="order-1 lg:order-2">
              <SectionBadge>04 — CV Certificate</SectionBadge>
              <h2 className="mt-4 text-4xl font-black leading-tight text-foreground md:text-5xl text-balance">
                Your impact, on paper.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Generate a verified certificate of your volunteer activity — hours, events, and NGO endorsements — ready to attach to your CV or university application.
              </p>
              <div className="mt-8 space-y-4">
                <FeatureItem>One-click PDF certificate generation</FeatureItem>
                <FeatureItem>Includes total hours, event list, and NGO signatures</FeatureItem>
                <FeatureItem>Unique verification link for employers or universities</FeatureItem>
                <FeatureItem>Available in Kazakh, Russian, and English</FeatureItem>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Choose Your Role Section */}
      <section id="join" className="px-6 py-24 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl text-center"
        >
          <h2 className="text-4xl font-black text-foreground md:text-5xl">Choose your role</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl bg-card p-8 shadow-sm text-left">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 mb-6">
                <User className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-card-foreground">Participant / Volunteer</h3>
              <p className="mt-3 text-muted-foreground">
                Find events, track hours, earn ranks, and build your impact portfolio
              </p>
              <a href="/register" className="mt-6 block w-full rounded-full bg-orange-500 hover:bg-orange-600 px-5 py-3 text-center font-semibold text-white transition-colors">
                Join as Volunteer
              </a>
            </div>
            <div className="rounded-3xl bg-card p-8 shadow-sm text-left">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 mb-6">
                <Users className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-card-foreground">Coordinator / NGO</h3>
              <p className="mt-3 text-muted-foreground">
                Post events, manage volunteers, track attendance, and certify hours
              </p>
              <a href="/register" className="mt-6 block w-full rounded-full border border-slate-300 hover:bg-slate-50 px-5 py-3 text-center font-semibold text-slate-700 transition-colors">
                Partner with Us
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <a href="/" className="text-2xl font-bold text-foreground">
                VoluKz
              </a>
              <p className="mt-4 text-muted-foreground max-w-sm">
                Kazakhstan's volunteer management platform. Connecting volunteers with NGOs to create lasting impact.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 VoluKz. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Қазақша
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Русский
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                English
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

