"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";
import { fadeUp, stagger } from "@/components/Motion";

export default function TeacherQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/quizzes")
      .then((r) => r.json())
      .then((d) => setQuizzes(d.quizzes || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function togglePublish(q) {
    try {
      const res = await fetch(`/api/quizzes/${q._id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: !q.is_published }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed");
      toast.success(q.is_published ? "Unpublished" : "Published — invitations sent");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function announceResults(q) {
    if (!confirm(`Announce results for "${q.title}"? Students will receive an email.`)) return;
    try {
      const res = await fetch("/api/results/announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_id: q._id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed");
      toast.success(`Results announced to ${data.announced} student(s)`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function remove(q) {
    if (!confirm(`Delete "${q.title}"? This removes all questions, attempts and results.`)) return;
    try {
      const res = await fetch(`/api/quizzes/${q._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed");
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <DashboardShell role="teacher">
      <PageHeader
        title="My Quizzes"
        subtitle="Create, publish and manage your quizzes."
        right={<Link href="/teacher/quizzes/new" className="btn-primary">+ New Quiz</Link>}
      />

      {loading ? (
        <p className="muted">Loading…</p>
      ) : quizzes.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-2">✨</div>
          <p className="muted">No quizzes yet.</p>
          <Link href="/teacher/quizzes/new" className="btn-primary mt-4 inline-flex">Create your first quiz</Link>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {quizzes.map((q) => (
            <motion.div key={q._id} variants={fadeUp} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/teacher/quizzes/${q._id}`} className="font-semibold text-ink-900 hover:text-brand-700">{q.title}</Link>
                    {q.is_published ? <span className="badge-green">Published</span> : <span className="badge-gray">Draft</span>}
                    {q.results_announced && <span className="badge-orange">Results announced</span>}
                  </div>
                  {q.description && <p className="mt-1 text-sm text-ink-600 line-clamp-1">{q.description}</p>}
                  <div className="mt-2 text-xs muted flex flex-wrap gap-3">
                    <span>{q.duration_minutes} min</span>
                    <span>{q.total_marks} marks</span>
                    <span>{q.question_count || 0} questions</span>
                    <span>Opens {new Date(q.start_time).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/teacher/quizzes/${q._id}`} className="btn-secondary text-sm">Manage</Link>
                  <Link href={`/teacher/quizzes/${q._id}/submissions`} className="btn-secondary text-sm">Submissions</Link>
                  <button onClick={() => togglePublish(q)} className={q.is_published ? "btn-secondary text-sm" : "btn-primary text-sm"}>
                    {q.is_published ? "Unpublish" : "Publish"}
                  </button>
                  {q.is_published && !q.results_announced && (
                    <button onClick={() => announceResults(q)} className="btn-accent text-sm">Announce results</button>
                  )}
                  <button onClick={() => remove(q)} className="btn-danger text-sm">Delete</button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardShell>
  );
}
