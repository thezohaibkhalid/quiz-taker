"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { fadeUp, stagger } from "@/components/Motion";

export default function QuizSubmissionsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  function load() {
    fetch(`/api/results/quiz/${id}`).then((r) => r.json()).then(setData);
  }

  useEffect(() => { load(); }, [id]);

  async function announce() {
    if (!confirm("Announce results to all students? They'll receive an email.")) return;
    const r = await fetch("/api/results/announce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quiz_id: id }),
    });
    const d = await r.json();
    if (!d.ok) return toast.error(d.error || "Failed");
    toast.success(`Announced to ${d.announced} student(s)`);
    load();
  }

  if (!data) return <DashboardShell role="teacher"><p className="muted">Loading…</p></DashboardShell>;
  const { quiz, results, stats } = data;

  return (
    <DashboardShell role="teacher">
      <PageHeader
        title={`${quiz.title} — Submissions`}
        subtitle={`${stats.attempts} attempts · avg ${stats.avg_percentage.toFixed(1)}%`}
        right={
          <div className="flex gap-2">
            <a href={`/api/results/quiz/${id}/export`} className="btn-secondary">⬇ Export CSV</a>
            <Link href={`/teacher/quizzes/${id}`} className="btn-secondary">Edit Quiz</Link>
            {!stats.announced && <button onClick={announce} className="btn-accent">Announce Results</button>}
            {stats.announced && <span className="badge-green">Results announced</span>}
          </div>
        }
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Attempts" value={stats.attempts} icon="📝" tone="brand" />
        <StatCard label="Passed" value={stats.pass_count} icon="✅" tone="green" />
        <StatCard label="Failed" value={stats.fail_count} icon="❌" tone="red" />
        <StatCard label="Pending" value={stats.pending_count} icon="⏳" tone="accent" />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="card overflow-hidden p-0">
        <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
          <h2 className="font-semibold text-ink-900">All Submissions</h2>
        </div>
        {results.length === 0 ? (
          <p className="p-6 muted">No submissions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs muted uppercase tracking-wider bg-cream-50">
                <th className="px-5 py-2">Student</th>
                <th className="px-5 py-2">Score</th>
                <th className="px-5 py-2">%</th>
                <th className="px-5 py-2">Status</th>
                <th className="px-5 py-2">Announced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {results.map((r) => (
                <tr key={r._id} className="hover:bg-cream-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink-900">{r.student_id?.name || "—"}</p>
                    <p className="text-xs muted">{r.student_id?.email}</p>
                  </td>
                  <td className="px-5 py-3 font-medium">{r.obtained_marks}/{r.total_marks}</td>
                  <td className="px-5 py-3">{r.percentage.toFixed(1)}%</td>
                  <td className="px-5 py-3">
                    <span className={r.status === "pass" ? "badge-green" : r.status === "fail" ? "badge-red" : "badge-gray"}>
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs muted">{r.announced ? new Date(r.announced_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </DashboardShell>
  );
}
