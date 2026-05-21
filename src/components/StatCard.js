"use client";

import { motion } from "framer-motion";

const TONES = {
  brand:  { val: "text-brand-600", icon: "bg-brand-50 text-brand-600" },
  accent: { val: "text-accent-600", icon: "bg-accent-50 text-accent-600" },
  green:  { val: "text-emerald-600", icon: "bg-emerald-50 text-emerald-600" },
  red:    { val: "text-red-600", icon: "bg-red-50 text-red-600" },
  ink:    { val: "text-ink-900", icon: "bg-cream-100 text-ink-700" },
};

export default function StatCard({ label, value, icon = "📊", tone = "brand", hint, delay = 0 }) {
  const t = TONES[tone] || TONES.brand;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="stat-card flex items-start gap-4"
    >
      <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-lg ${t.icon}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs muted uppercase tracking-wider">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${t.val}`}>{value}</p>
        {hint && <p className="text-xs muted mt-1">{hint}</p>}
      </div>
    </motion.div>
  );
}
