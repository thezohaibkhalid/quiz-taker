"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";

export default function NewQuizPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", subject_id: "",
    duration_minutes: 30, pass_percentage: 50,
    start_time: "", end_time: "",
    allow_single_attempt: true, randomize_questions: false,
    cover_image_url: "",
  });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => r.json())
      .then((d) => setSubjects(d.subjects || []));
  }, []);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function uploadCover(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", "quiz_cover");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "Upload failed");
      update("cover_image_url", d.url);
      toast.success("Cover image uploaded");
    } catch (err) { toast.error(err.message); }
    finally { setUploading(false); }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed");
      toast.success("Quiz created — add some questions next.");
      router.push(`/teacher/quizzes/${data.quiz._id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell role="teacher">
      <PageHeader title="New Quiz" subtitle="Set quiz metadata, schedule and rules. Add questions in the next step." />

      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="card space-y-5 max-w-3xl"
      >
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={(e) => update("title", e.target.value)} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Subject (optional)</label>
            <select className="input" value={form.subject_id} onChange={(e) => update("subject_id", e.target.value)}>
              <option value="">— None —</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Duration (minutes)</label>
            <input type="number" min={1} className="input" value={form.duration_minutes} onChange={(e) => update("duration_minutes", Number(e.target.value))} required />
          </div>
          <div>
            <label className="label">Start time</label>
            <input type="datetime-local" className="input" value={form.start_time} onChange={(e) => update("start_time", e.target.value)} required />
          </div>
          <div>
            <label className="label">End time</label>
            <input type="datetime-local" className="input" value={form.end_time} onChange={(e) => update("end_time", e.target.value)} required />
          </div>
          <div>
            <label className="label">Pass percentage</label>
            <input type="number" min={0} max={100} className="input" value={form.pass_percentage} onChange={(e) => update("pass_percentage", Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label">Cover image (optional)</label>
          <div className="flex items-center gap-3">
            {form.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.cover_image_url} alt="" className="w-24 h-16 rounded-lg object-cover border border-ink-100" />
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadCover} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-sm" disabled={uploading}>
              {uploading ? "Uploading…" : form.cover_image_url ? "Replace cover" : "Upload cover"}
            </button>
            {form.cover_image_url && <button type="button" onClick={() => update("cover_image_url", "")} className="btn-ghost text-red-600 text-sm">Remove</button>}
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-2 border-t border-ink-100">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.allow_single_attempt} onChange={(e) => update("allow_single_attempt", e.target.checked)} />
            Allow only one attempt per student
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.randomize_questions} onChange={(e) => update("randomize_questions", e.target.checked)} />
            Randomize question order per student
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Creating…" : "Create quiz"}</button>
        </div>
      </motion.form>
    </DashboardShell>
  );
}
