"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, stagger, scaleIn } from "@/components/Motion";

const FEATURES = [
  { icon: "📝", title: "Create & schedule quizzes", desc: "Teachers build timed quizzes with MCQ, true/false and short-answer questions." },
  { icon: "⚡", title: "Instant auto-evaluation", desc: "Objective answers are graded the moment students submit." },
  { icon: "📊", title: "Per-student analytics", desc: "Performance charts, pass percentages and quiz history for each student." },
  { icon: "📧", title: "Email notifications", desc: "Invites, resets and result announcements delivered via Gmail SMTP." },
  { icon: "🔐", title: "JWT-based security", desc: "Bcrypt hashing and role-based access for students, teachers and admins." },
  { icon: "☁️", title: "Cloud-native storage", desc: "Files on Cloudinary, structured data on MongoDB Atlas." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-cream-50 overflow-x-hidden">
      <Header />
      <Hero />
      <DashboardPreview />
      <Features />
      <Roles />
      <CloudStack />
      <CTA />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-ink-100 bg-cream-50/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-md" />
          <span className="font-semibold text-ink-900">Quiz System</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">Sign in</Link>
          <Link href="/register" className="btn-primary">Get started</Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-12">
      <motion.div
        className="absolute -z-10 inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4 }}
      >
        <div className="absolute top-32 right-0 w-[28rem] h-[28rem] bg-accent-100 rounded-full blur-3xl opacity-30" />
      </motion.div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-12 items-center">
        <motion.div variants={fadeUp}>
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-50 border border-accent-100 text-accent-700 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse"></span>
            Cloud-native quiz platform
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-serif text-5xl md:text-6xl text-ink-900 leading-[1.05] tracking-tight">
            Run quizzes,<br />
            evaluate instantly,<br />
            <span className="text-accent-600 italic">announce results.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 text-lg text-ink-600 leading-relaxed">
            A complete cloud-based Online Quiz Management System for teachers, students and admins —
            built on Next.js, MongoDB Atlas, Cloudinary and Gmail SMTP.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary px-6 py-3 text-base shadow-card">
              Create your account
              <span aria-hidden>→</span>
            </Link>
            <Link href="/login" className="btn-secondary px-6 py-3 text-base">I already have an account</Link>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-8 flex items-center gap-6 text-sm muted">
            <span>✓ Free for educators</span>
            <span>✓ Email verification</span>
            <span>✓ Role-based access</span>
          </motion.div>
        </motion.div>

        <motion.div variants={scaleIn} className="relative">
          <div className="absolute -inset-6 bg-accent-100/30 rounded-3xl blur-2xl"></div>
          <QuizMockCard />
        </motion.div>
      </motion.div>
    </section>
  );
}

function QuizMockCard() {
  return (
    <div className="relative card shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs muted uppercase tracking-wider">Active Quiz</p>
          <h3 className="font-semibold text-ink-900 mt-1">Cloud Computing — Midterm</h3>
        </div>
        <motion.span
          className="badge-orange timer-pulse"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          ⏱ 12:48 left
        </motion.span>
      </div>
      <motion.div className="space-y-3" variants={stagger} initial="hidden" animate="show">
        {[
          { q: "Q3. Which AWS service hosts container workloads?", options: [
            { t: "A. S3", correct: false },
            { t: "B. EC2", correct: true },
            { t: "C. SES", correct: false },
            { t: "D. Route53", correct: false },
          ]},
        ].map((qi) => (
          <motion.div key={qi.q} variants={fadeUp} className="p-3 rounded-lg border border-ink-100 bg-cream-50">
            <p className="text-sm font-medium text-ink-800">{qi.q}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {qi.options.map((o, i) => (
                <motion.div
                  key={o.t}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className={`px-2.5 py-2 rounded border ${
                    o.correct ? "border-brand-500 bg-brand-50 text-brand-700 font-medium" : "border-ink-200 bg-white"
                  }`}
                >
                  {o.t} {o.correct && "✓"}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
        <motion.div variants={fadeUp} className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2 text-xs muted">
            <div className="flex gap-1">
              {[1, 2, 3].map((n) => (
                <span key={n} className={`w-1.5 h-1.5 rounded-full ${n <= 3 ? "bg-brand-500" : "bg-ink-200"}`}></span>
              ))}
              {Array.from({ length: 17 }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-ink-200"></span>
              ))}
            </div>
            <span>3 / 20</span>
          </div>
          <button className="btn-accent text-xs px-3 py-1.5">Next →</button>
        </motion.div>
      </motion.div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-10"
      >
        <span className="badge-blue mb-3">Dashboard</span>
        <h2 className="font-serif text-4xl text-ink-900">One dashboard, three personas</h2>
        <p className="muted mt-3 max-w-2xl mx-auto">Each role gets a tailored view — students see upcoming quizzes and results, teachers manage their question banks, admins monitor everything.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <div className="absolute -inset-10 bg-cream-100/50 rounded-3xl blur-2xl -z-10"></div>
        <div className="card shadow-card overflow-hidden p-0">
          {/* fake top bar */}
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3 bg-cream-50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
              <span className="ml-3 text-xs muted">quizsystem.app/teacher/dashboard</span>
            </div>
            <span className="badge-blue">Teacher</span>
          </div>
          <div className="grid grid-cols-12 min-h-[420px]">
            {/* sidebar */}
            <div className="col-span-3 border-r border-ink-100 p-4 bg-cream-50">
              <div className="flex items-center gap-2 mb-5">
                <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain rounded-md" />
                <span className="font-semibold text-ink-900 text-sm">Quiz System</span>
              </div>
              {["Dashboard", "My Quizzes", "Submissions", "Analytics", "Subjects"].map((t, i) => (
                <div key={t} className={`nav-link mb-1 ${i === 0 ? "nav-link-active" : ""}`}>{t}</div>
              ))}
            </div>
            {/* content */}
            <div className="col-span-9 p-6 bg-white">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-ink-900 text-lg">Good morning, Ibrar</h3>
                  <p className="text-xs muted">3 quizzes published · 47 attempts this week</p>
                </div>
                <button className="btn-primary text-xs">+ New Quiz</button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Active Quizzes", value: "3", tone: "brand" },
                  { label: "Total Attempts", value: "47", tone: "accent" },
                  { label: "Avg Score", value: "72%", tone: "green" },
                ].map((s) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="stat-card"
                  >
                    <p className="text-xs muted">{s.label}</p>
                    <p className={`mt-1 text-2xl font-semibold ${s.tone === "brand" ? "text-brand-600" : s.tone === "accent" ? "text-accent-600" : "text-emerald-600"}`}>{s.value}</p>
                  </motion.div>
                ))}
              </div>
              <div className="border border-ink-100 rounded-xl divide-y divide-ink-100">
                {[
                  { title: "Cloud Computing — Midterm", attempts: 23, avg: "78%", status: "live" },
                  { title: "DevOps Fundamentals", attempts: 16, avg: "65%", status: "scheduled" },
                  { title: "Containerization Basics", attempts: 8, avg: "82%", status: "draft" },
                ].map((q) => (
                  <div key={q.title} className="flex items-center justify-between p-3 hover:bg-cream-50">
                    <div>
                      <p className="font-medium text-sm text-ink-900">{q.title}</p>
                      <p className="text-xs muted mt-0.5">{q.attempts} attempts · avg {q.avg}</p>
                    </div>
                    <span className={q.status === "live" ? "badge-green" : q.status === "scheduled" ? "badge-blue" : "badge-gray"}>{q.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Features() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 border-t border-ink-100">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <h2 className="font-serif text-3xl text-ink-900 mb-2">Everything you need to run quizzes online</h2>
        <p className="muted">Designed around the modules in the project document — auth, quiz management, attempts, results and analytics.</p>
      </motion.div>
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {FEATURES.map((f) => (
          <motion.div key={f.title} variants={fadeUp} className="card hover:shadow-card transition-all hover:-translate-y-0.5">
            <div className="text-2xl">{f.icon}</div>
            <h3 className="mt-3 font-semibold text-ink-900">{f.title}</h3>
            <p className="mt-2 text-sm text-ink-600 leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function Roles() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 border-t border-ink-100">
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-serif text-3xl text-ink-900">Built for three roles</motion.h2>
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-8 grid md:grid-cols-3 gap-5">
        <RoleCard color="brand" emoji="🎓" title="Student" items={["Attempt quizzes in a timed window", "Instant feedback on objective answers", "View results and performance charts"]} />
        <RoleCard color="accent" emoji="👨‍🏫" title="Teacher" items={["Create quizzes & questions", "Schedule & publish to students", "Announce results and grade subjective answers"]} />
        <RoleCard color="ink" emoji="🛠️" title="Admin" items={["Manage user accounts and roles", "Monitor system usage & audit logs", "Manage subjects and global settings"]} />
      </motion.div>
    </section>
  );
}

function RoleCard({ color, emoji, title, items }) {
  const bg = color === "brand" ? "bg-brand-50 border-brand-100" : color === "accent" ? "bg-accent-50 border-accent-100" : "bg-cream-100 border-ink-100";
  const text = color === "brand" ? "text-brand-700" : color === "accent" ? "text-accent-700" : "text-ink-700";
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -4 }} className={`rounded-xl border p-6 ${bg} transition-all`}>
      <div className="text-3xl">{emoji}</div>
      <h3 className={`mt-3 text-lg font-semibold ${text}`}>{title}</h3>
      <ul className="mt-4 space-y-2 text-sm text-ink-700">{items.map((i) => <li key={i}>• {i}</li>)}</ul>
    </motion.div>
  );
}

function CloudStack() {
  const items = [
    { name: "Next.js", desc: "Frontend & API routes" },
    { name: "MongoDB Atlas", desc: "Cloud database" },
    { name: "Cloudinary", desc: "File & image storage" },
    { name: "Gmail SMTP", desc: "Transactional email" },
    { name: "Docker", desc: "Containerized deploys" },
    { name: "GitHub Actions", desc: "CI/CD pipeline" },
  ];
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 border-t border-ink-100">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
        <h2 className="font-serif text-3xl text-ink-900">Powered by a modern cloud stack</h2>
      </motion.div>
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {items.map((i) => (
          <motion.div key={i.name} variants={fadeUp} className="card text-center">
            <p className="font-semibold text-ink-900 text-sm">{i.name}</p>
            <p className="text-xs muted mt-1">{i.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function CTA() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl bg-brand-800 text-white p-10 md:p-14 text-center overflow-hidden relative"
      >
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 0%, transparent 35%), radial-gradient(circle at 70% 80%, white 0%, transparent 35%)" }}></div>
        <h2 className="relative font-serif text-4xl md:text-5xl">Ready to run your first quiz?</h2>
        <p className="relative mt-3 text-white/85 max-w-2xl mx-auto">Sign up in seconds — you&apos;ll get a verification email, then you can create or attempt a quiz right away.</p>
        <div className="relative mt-7 flex justify-center gap-3">
          <Link href="/register" className="bg-white text-ink-900 hover:bg-cream-100 btn px-6 py-3 text-base font-semibold">Create account →</Link>
          <Link href="/login" className="bg-white/10 hover:bg-white/20 text-white btn px-6 py-3 text-base border border-white/30">Sign in</Link>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-100 py-10 text-center text-sm muted">
      Built with Next.js · MongoDB Atlas · Cloudinary · Nodemailer · Gmail SMTP
    </footer>
  );
}
