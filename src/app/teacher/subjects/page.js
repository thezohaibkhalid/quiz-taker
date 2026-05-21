"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";
import { fadeUp, stagger } from "@/components/Motion";

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ name: "", code: "", description: "" });

  function load() { fetch("/api/subjects").then((r) => r.json()).then((d) => setSubjects(d.subjects || [])); }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    const r = await fetch("/api/subjects", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (!d.ok) return toast.error(d.error || "Failed");
    toast.success("Subject created");
    setForm({ name: "", code: "", description: "" });
    load();
  }

  return (
    <DashboardShell role="teacher">
      <PageHeader title="Subjects" subtitle="Group your quizzes under subjects." />

      <form onSubmit={submit} className="card max-w-2xl mb-6 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">Code</label><input className="input uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
        </div>
        <div><label className="label">Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="flex justify-end"><button className="btn-primary" type="submit">Add Subject</button></div>
      </form>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {subjects.map((s) => (
          <motion.div key={s._id} variants={fadeUp} className="card">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-blue">{s.code}</span>
            </div>
            <p className="font-semibold text-ink-900">{s.name}</p>
            {s.description && <p className="text-sm muted mt-1">{s.description}</p>}
          </motion.div>
        ))}
      </motion.div>
    </DashboardShell>
  );
}
