"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";
import { fadeUp, stagger } from "@/components/Motion";

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ name: "", code: "", description: "" });

  function load() { fetch("/api/subjects").then((r) => r.json()).then((d) => setSubjects(d.subjects || [])); }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    const r = await fetch("/api/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!d.ok) return toast.error(d.error || "Failed");
    toast.success("Created");
    setForm({ name: "", code: "", description: "" });
    load();
  }

  async function remove(id) {
    if (!confirm("Delete subject?")) return;
    const r = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (!d.ok) return toast.error(d.error || "Failed");
    toast.success("Deleted");
    load();
  }

  return (
    <DashboardShell role="admin">
      <PageHeader title="Subjects" subtitle="Manage academic subjects available to teachers." />

      <form onSubmit={submit} className="card max-w-2xl mb-6 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">Code</label><input className="input uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
        </div>
        <div><label className="label">Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="flex justify-end"><button type="submit" className="btn-primary">Add Subject</button></div>
      </form>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {subjects.map((s) => (
          <motion.div key={s._id} variants={fadeUp} className="card flex justify-between items-start gap-3">
            <div>
              <span className="badge-blue">{s.code}</span>
              <p className="font-semibold text-ink-900 mt-2">{s.name}</p>
              {s.description && <p className="text-sm muted mt-1">{s.description}</p>}
            </div>
            <button onClick={() => remove(s._id)} className="btn-ghost text-red-600 text-xs">Delete</button>
          </motion.div>
        ))}
      </motion.div>
    </DashboardShell>
  );
}
