"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { DoughnutChart } from "@/components/PerformanceChart";
import { fadeUp, stagger } from "@/components/Motion";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => { fetch("/api/analytics").then((r) => r.json()).then(setData); }, []);

  const s = data?.stats || {};
  const recent = data?.recent_results || [];

  return (
    <DashboardShell role="admin">
      <PageHeader title="Admin Overview" subtitle="System-wide metrics, users, quizzes and recent activity." />

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={s.users_total ?? 0} icon="👥" tone="brand" delay={0.05} />
        <StatCard label="Students" value={s.students ?? 0} icon="🎓" tone="brand" delay={0.1} />
        <StatCard label="Teachers" value={s.teachers ?? 0} icon="👨‍🏫" tone="accent" delay={0.15} />
        <StatCard label="Admins" value={s.admins ?? 0} icon="🛠️" tone="ink" delay={0.2} />
      </motion.div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-3 gap-4 mt-4">
        <StatCard label="Total Quizzes" value={s.quizzes_total ?? 0} icon="📝" tone="brand" />
        <StatCard label="Published Quizzes" value={s.quizzes_published ?? 0} icon="📢" tone="accent" />
        <StatCard label="Total Attempts" value={s.attempts_total ?? 0} icon="🎯" tone="green" />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card">
          <h2 className="section-title mb-3">Users by Role</h2>
          <DoughnutChart
            labels={["Students", "Teachers", "Admins"]}
            values={[s.students || 0, s.teachers || 0, s.admins || 0]}
            colors={["#2563eb", "#ea580c", "#5e5b4d"]}
          />
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card lg:col-span-2">
          <h2 className="section-title mb-3">Recent Announced Results</h2>
          {recent.length === 0 ? (
            <p className="muted text-sm">No announced results yet.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {recent.slice(0, 10).map((r) => (
                <li key={r._id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-ink-900">{r.student_id?.name || "—"}</p>
                    <p className="text-xs muted">{r.quiz_id?.title}</p>
                  </div>
                  <span className={r.status === "pass" ? "badge-green" : r.status === "fail" ? "badge-red" : "badge-gray"}>
                    {r.percentage.toFixed(0)}% · {r.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </DashboardShell>
  );
}
