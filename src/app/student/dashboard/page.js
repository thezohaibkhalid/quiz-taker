"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { LineChart, DoughnutChart } from "@/components/PerformanceChart";
import { fadeUp, stagger } from "@/components/Motion";

export default function StudentDashboardPage() {
  const [data, setData] = useState(null);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics").then((r) => r.json()),
      fetch("/api/quizzes?scope=active").then((r) => r.json()),
    ]).then(([a, q]) => {
      if (a.ok) setData(a);
      if (q.ok) setQuizzes(q.quizzes || []);
    });
  }, []);

  const s = data?.stats || {};
  const trend = data?.trend || [];

  return (
    <DashboardShell role="student">
      <PageHeader
        title="Student Dashboard"
        subtitle="Track upcoming quizzes, attempts and announced results."
        right={<Link href="/student/quizzes" className="btn-primary">Browse quizzes</Link>}
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Attempts" value={s.total_attempts ?? 0} icon="📝" tone="brand" delay={0.05} />
        <StatCard label="Announced Results" value={s.announced_results ?? 0} icon="📢" tone="accent" delay={0.1} />
        <StatCard label="Passed" value={s.passed ?? 0} icon="✅" tone="green" delay={0.15} />
        <StatCard label="Average %" value={`${s.avg_percentage ?? 0}%`} icon="📊" tone="brand" delay={0.2} />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Performance Trend</h2>
            <span className="badge-blue">Across announced quizzes</span>
          </div>
          {trend.length === 0 ? (
            <p className="muted text-sm">No announced results yet. Attempt a quiz to start building your trend.</p>
          ) : (
            <LineChart labels={trend.map((t) => t.quiz)} values={trend.map((t) => t.percentage)} />
          )}
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card">
          <h2 className="section-title mb-4">Pass / Fail Split</h2>
          {(s.passed || s.failed) ? (
            <DoughnutChart labels={["Passed", "Failed"]} values={[s.passed || 0, s.failed || 0]} colors={["#2563eb", "#ea580c"]} />
          ) : (
            <p className="muted text-sm">No data yet.</p>
          )}
        </motion.div>
      </div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Active Quizzes</h2>
          <Link href="/student/quizzes" className="link-brand text-sm">View all →</Link>
        </div>
        {quizzes.length === 0 ? (
          <p className="muted text-sm">No active quizzes at the moment. Check back later.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {quizzes.slice(0, 5).map((q) => (
              <li key={q._id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">{q.title}</p>
                  <p className="text-xs muted">
                    {q.duration_minutes} min · ends {new Date(q.end_time).toLocaleString()}
                  </p>
                </div>
                <Link href={`/student/quiz/${q._id}`} className="btn-accent text-sm">Start →</Link>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </DashboardShell>
  );
}
