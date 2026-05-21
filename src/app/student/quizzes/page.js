"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";
import { fadeUp, stagger } from "@/components/Motion";

export default function StudentQuizzesPage() {
  const [tab, setTab] = useState("active");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/quizzes?scope=${tab}`)
      .then((r) => r.json())
      .then((d) => setList(d.quizzes || []))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <DashboardShell role="student">
      <PageHeader title="My Quizzes" subtitle="Active and upcoming quizzes published to you." />

      <div className="inline-flex p-1 bg-white border border-ink-100 rounded-lg shadow-soft mb-5">
        {["active", "upcoming", "all"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${
              tab === t ? "bg-brand-600 text-white shadow-sm" : "text-ink-700 hover:bg-cream-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : list.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-2">📭</div>
          <p className="muted">No quizzes in this category right now.</p>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((q) => {
            const now = new Date();
            const start = new Date(q.start_time);
            const end = new Date(q.end_time);
            const isActive = now >= start && now <= end;
            const isUpcoming = now < start;
            return (
              <motion.div key={q._id} variants={fadeUp} whileHover={{ y: -3 }} className="card flex flex-col">
                <div className="flex items-center justify-between">
                  {isActive ? <span className="badge-green">Live</span> : isUpcoming ? <span className="badge-blue">Upcoming</span> : <span className="badge-gray">Closed</span>}
                  <span className="text-xs muted">{q.duration_minutes} min</span>
                </div>
                <h3 className="mt-2 font-semibold text-ink-900">{q.title}</h3>
                {q.description && <p className="mt-1 text-sm text-ink-600 line-clamp-2">{q.description}</p>}
                <div className="mt-4 text-xs muted space-y-1">
                  <p>Opens: {start.toLocaleString()}</p>
                  <p>Closes: {end.toLocaleString()}</p>
                  <p>Total marks: {q.total_marks}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-ink-100 flex items-center justify-end">
                  {isActive ? (
                    <Link href={`/student/quiz/${q._id}`} className="btn-accent text-sm">Start →</Link>
                  ) : (
                    <button disabled className="btn-secondary text-sm opacity-60 cursor-not-allowed">Not available</button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </DashboardShell>
  );
}
