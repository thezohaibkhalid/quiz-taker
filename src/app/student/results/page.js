"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";
import { fadeUp, stagger } from "@/components/Motion";

export default function StudentResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/results/me")
      .then((r) => r.json())
      .then((d) => setResults(d.results || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell role="student">
      <PageHeader title="Results" subtitle="Announced quiz results with score and status." />

      {loading ? (
        <p className="muted">Loading…</p>
      ) : results.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-2">📊</div>
          <p className="muted">No announced results yet.</p>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid md:grid-cols-2 gap-4">
          {results.map((r) => (
            <motion.div key={r._id} variants={fadeUp} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-900">{r.quiz_id?.title || "Quiz"}</p>
                  {r.quiz_id?.subject_id && <p className="text-xs muted">{r.quiz_id.subject_id.name} · {r.quiz_id.subject_id.code}</p>}
                </div>
                <span className={r.status === "pass" ? "badge-green" : r.status === "fail" ? "badge-red" : "badge-gray"}>
                  {r.status.toUpperCase()}
                </span>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <p className="text-3xl font-bold text-brand-700">{r.percentage.toFixed(1)}%</p>
                <p className="text-sm muted mb-1">{r.obtained_marks} / {r.total_marks}</p>
              </div>
              <div className="mt-3 h-2 bg-ink-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${r.status === "pass" ? "bg-emerald-500" : r.status === "fail" ? "bg-red-500" : "bg-brand-500"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${r.percentage}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              {r.feedback && <p className="mt-3 text-sm text-ink-600 italic">&ldquo;{r.feedback}&rdquo;</p>}
              <p className="mt-3 text-xs muted">Announced {new Date(r.announced_at).toLocaleString()}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardShell>
  );
}
