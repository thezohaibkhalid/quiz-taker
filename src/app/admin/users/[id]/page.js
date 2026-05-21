"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { LineChart, BarChart, DoughnutChart } from "@/components/PerformanceChart";
import { fadeUp, stagger } from "@/components/Motion";

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${id}/profile`).then((r) => r.json()).then(setData);
  }, [id]);

  if (!data) return <DashboardShell role="admin"><p className="muted">Loading…</p></DashboardShell>;
  if (!data.ok) return <DashboardShell role="admin"><p className="text-red-600">{data.error}</p></DashboardShell>;

  const { user, stats, results, recent_actions } = data;
  const announced = results.filter((r) => r.announced);
  const trendLabels = announced.map((r) => r.quiz_id?.title || "—");
  const trendValues = announced.map((r) => Number(r.percentage.toFixed(1)));

  return (
    <DashboardShell role="admin">
      <PageHeader
        title={user.name}
        subtitle={`${user.email} · ${user.role}`}
        right={<Link href="/admin/users" className="btn-secondary">← Back to users</Link>}
      />

      {/* Identity card */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="card flex items-center gap-5 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center text-white font-bold text-2xl overflow-hidden shrink-0">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : user.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-ink-900">{user.name}</p>
            <span className="badge-blue capitalize">{user.role}</span>
            {user.is_verified ? <span className="badge-green">Verified</span> : <span className="badge-gray">Unverified</span>}
            {user.is_active ? <span className="badge-green">Active</span> : <span className="badge-red">Disabled</span>}
          </div>
          <p className="text-sm muted truncate">{user.email}</p>
          <p className="text-xs muted mt-1">Joined {new Date(user.created_at).toLocaleDateString()}{user.last_login ? ` · Last login ${new Date(user.last_login).toLocaleString()}` : ""}</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Attempts" value={stats.attempts} icon="📝" tone="brand" delay={0.05} />
        <StatCard label="Passed" value={stats.passed} icon="✅" tone="green" delay={0.1} />
        <StatCard label="Failed" value={stats.failed} icon="❌" tone="red" delay={0.15} />
        <StatCard label="Average %" value={`${stats.avg_percentage}%`} icon="📊" tone="accent" delay={0.2} hint={`High ${stats.highest.toFixed(0)}% · Low ${stats.lowest.toFixed(0)}%`} />
      </motion.div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title">Performance over time</h2>
            <span className="badge-blue">{announced.length} announced</span>
          </div>
          {announced.length === 0 ? (
            <p className="muted text-sm">No announced results yet.</p>
          ) : (
            <LineChart labels={trendLabels} values={trendValues} label="Score %" />
          )}
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="card">
          <h2 className="section-title mb-3">Pass / Fail</h2>
          {(stats.passed || stats.failed) ? (
            <DoughnutChart labels={["Passed", "Failed"]} values={[stats.passed, stats.failed]} colors={["#2563eb", "#ea580c"]} />
          ) : (
            <p className="muted text-sm">No data.</p>
          )}
        </motion.div>
      </div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="card mb-6">
        <h2 className="section-title mb-3">Marks per quiz</h2>
        {announced.length === 0 ? (
          <p className="muted text-sm">No data yet.</p>
        ) : (
          <BarChart labels={trendLabels} values={trendValues} />
        )}
      </motion.div>

      {/* Detailed quiz history */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="card p-0 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-ink-100"><h2 className="font-semibold">Quiz history</h2></div>
        {results.length === 0 ? (
          <p className="p-6 muted">No attempts yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-xs muted uppercase tracking-wider text-left">
              <tr>
                <th className="px-5 py-2">Quiz</th>
                <th className="px-5 py-2">Subject</th>
                <th className="px-5 py-2">Marks</th>
                <th className="px-5 py-2">%</th>
                <th className="px-5 py-2">Status</th>
                <th className="px-5 py-2">Announced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {results.map((r) => (
                <tr key={r._id} className="hover:bg-cream-50">
                  <td className="px-5 py-3 font-medium">{r.quiz_id?.title || "—"}</td>
                  <td className="px-5 py-3 text-xs muted">{r.quiz_id?.subject_id?.code || "—"}</td>
                  <td className="px-5 py-3">{r.obtained_marks}/{r.total_marks}</td>
                  <td className="px-5 py-3">{r.percentage.toFixed(1)}%</td>
                  <td className="px-5 py-3"><span className={r.status === "pass" ? "badge-green" : r.status === "fail" ? "badge-red" : "badge-gray"}>{r.status.toUpperCase()}</span></td>
                  <td className="px-5 py-3 text-xs muted">{r.announced ? new Date(r.announced_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="card">
        <h2 className="section-title mb-3">Recent actions</h2>
        {recent_actions.length === 0 ? (
          <p className="muted text-sm">No recent actions.</p>
        ) : (
          <ul className="divide-y divide-ink-100 text-sm">
            {recent_actions.map((a) => (
              <li key={a._id} className="py-2 flex items-center justify-between">
                <span className="font-mono text-xs text-ink-700">{a.action}</span>
                <span className="text-xs muted">{new Date(a.timestamp).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </DashboardShell>
  );
}
