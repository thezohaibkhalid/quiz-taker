"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { BarChart } from "@/components/PerformanceChart";
import { fadeUp, stagger } from "@/components/Motion";

export default function TeacherDashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setData(d));
  }, []);

  const s = data?.stats || {};
  const perQuiz = data?.per_quiz || [];

  return (
    <DashboardShell role="teacher">
      <PageHeader
        title="Teacher Dashboard"
        subtitle="Manage your quizzes, review submissions, announce results."
        right={<Link href="/teacher/quizzes/new" className="btn-primary">+ New Quiz</Link>}
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Total Quizzes" value={s.total_quizzes ?? 0} icon="📝" tone="brand" delay={0.05} />
        <StatCard label="Published" value={s.published_quizzes ?? 0} icon="📢" tone="accent" delay={0.1} />
        <StatCard label="Total Attempts" value={s.total_attempts ?? 0} icon="🎯" tone="green" delay={0.15} />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Per-quiz Average</h2>
          <span className="badge-blue">All published quizzes</span>
        </div>
        {perQuiz.length === 0 ? (
          <p className="muted">No quizzes yet. Create your first quiz to see analytics here.</p>
        ) : (
          <BarChart labels={perQuiz.map((q) => q.title)} values={perQuiz.map((q) => q.avg_percentage)} />
        )}
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="card mt-6">
        <h2 className="section-title mb-4">Your Quizzes</h2>
        {perQuiz.length === 0 ? (
          <p className="muted">No quizzes yet.</p>
        ) : (
          <div className="divide-y divide-ink-100">
            {perQuiz.map((q) => (
              <div key={q.quiz_id} className="py-3 flex items-center justify-between">
                <div>
                  <Link href={`/teacher/quizzes/${q.quiz_id}`} className="font-medium text-ink-900 hover:text-brand-700">{q.title}</Link>
                  <p className="text-xs muted">{q.attempts} attempts · avg {q.avg_percentage}% · {q.pass_count} passed · {q.fail_count} failed</p>
                </div>
                <Link href={`/teacher/quizzes/${q.quiz_id}/submissions`} className="btn-secondary text-sm">Submissions</Link>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardShell>
  );
}
