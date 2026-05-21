"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  function load() {
    const q = new URLSearchParams();
    if (action) q.set("action", action);
    q.set("page", String(page));
    q.set("limit", "50");
    fetch(`/api/audit?${q.toString()}`)
      .then((r) => r.json())
      .then((d) => { setLogs(d.logs || []); setPages(d.pages || 1); });
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [action, page]);
  useEffect(() => { setPage(1); }, [action]);

  return (
    <DashboardShell role="admin">
      <PageHeader title="Audit Logs" subtitle="Every important action performed in the system." />

      <div className="mb-4 flex gap-3">
        <select className="input max-w-xs" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All actions</option>
          <option value="user.login">user.login</option>
          <option value="user.register">user.register</option>
          <option value="user.logout">user.logout</option>
          <option value="quiz.create">quiz.create</option>
          <option value="quiz.publish">quiz.publish</option>
          <option value="quiz.delete">quiz.delete</option>
          <option value="attempt.start">attempt.start</option>
          <option value="attempt.submit">attempt.submit</option>
          <option value="results.announce">results.announce</option>
          <option value="admin.user.create">admin.user.create</option>
          <option value="admin.user.update">admin.user.update</option>
        </select>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-xs muted uppercase tracking-wider text-left">
            <tr>
              <th className="px-5 py-2">When</th>
              <th className="px-5 py-2">Action</th>
              <th className="px-5 py-2">User</th>
              <th className="px-5 py-2">Entity</th>
              <th className="px-5 py-2">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {logs.map((l) => (
              <tr key={l._id} className="hover:bg-cream-50">
                <td className="px-5 py-3 text-xs muted">{new Date(l.timestamp).toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-xs">{l.action}</td>
                <td className="px-5 py-3">
                  {l.user_id ? <><p className="font-medium">{l.user_id.name}</p><p className="text-xs muted">{l.user_id.email}</p></> : <span className="muted">—</span>}
                </td>
                <td className="px-5 py-3 text-xs">{l.entity_type}{l.entity_id ? ` · ${l.entity_id.toString().slice(-6)}` : ""}</td>
                <td className="px-5 py-3 text-xs muted">{l.ip_address || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="p-6 muted">No logs.</p>}
      </motion.div>

      <Pagination page={page} pages={pages} onChange={setPage} />
    </DashboardShell>
  );
}
