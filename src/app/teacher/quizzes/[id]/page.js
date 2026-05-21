"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import DashboardShell from "@/components/DashboardShell";
import PageHeader from "@/components/PageHeader";

export default function ManageQuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const r = await fetch(`/api/quizzes/${id}`);
    const d = await r.json();
    if (d.ok) {
      setQuiz(d.quiz);
      setQuestions(d.questions);
    } else {
      toast.error(d.error || "Failed to load");
    }
  }

  useEffect(() => { load(); }, [id]);

  const [editing, setEditing] = useState(null); // question id being edited

  async function removeQuestion(qid) {
    if (!confirm("Delete this question?")) return;
    const r = await fetch(`/api/quizzes/${id}/questions?qid=${qid}`, { method: "DELETE" });
    const d = await r.json();
    if (!d.ok) return toast.error(d.error || "Failed");
    toast.success("Question removed");
    load();
  }

  async function saveEdit(q, patch) {
    const r = await fetch(`/api/quizzes/${id}/questions/${q._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const d = await r.json();
    if (!d.ok) return toast.error(d.error || "Failed");
    toast.success("Question updated");
    setEditing(null);
    load();
  }

  async function togglePublish() {
    const r = await fetch(`/api/quizzes/${id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publish: !quiz.is_published }),
    });
    const d = await r.json();
    if (!d.ok) return toast.error(d.error || "Failed");
    toast.success(quiz.is_published ? "Unpublished" : "Published — invitation emails sent");
    load();
  }

  if (!quiz) return <DashboardShell role="teacher"><p className="muted">Loading…</p></DashboardShell>;

  return (
    <DashboardShell role="teacher">
      <PageHeader
        title={quiz.title}
        subtitle={quiz.description || "Manage questions and publishing."}
        right={
          <div className="flex gap-2">
            <Link href={`/teacher/quizzes/${id}/submissions`} className="btn-secondary">Submissions</Link>
            <button className={quiz.is_published ? "btn-secondary" : "btn-primary"} onClick={togglePublish}>
              {quiz.is_published ? "Unpublish" : "Publish"}
            </button>
          </div>
        }
      />

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Meta label="Duration" value={`${quiz.duration_minutes} min`} />
        <Meta label="Total marks" value={quiz.total_marks} />
        <Meta label="Pass %" value={`${quiz.pass_percentage}%`} />
        <Meta label="Status" value={quiz.is_published ? "Published" : "Draft"} tone={quiz.is_published ? "green" : "gray"} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Questions ({questions.length})</h2>
        <button className="btn-accent" onClick={() => setShowForm((s) => !s)}>{showForm ? "Close" : "+ Add Question"}</button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AddQuestionForm quizId={id} onAdded={() => { load(); setShowForm(false); }} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 mt-4">
        {questions.length === 0 ? (
          <div className="card text-center py-10 muted">No questions yet. Add at least one before publishing.</div>
        ) : (
          questions.map((q, i) => (
            <motion.div
              key={q._id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card"
            >
              {editing === q._id ? (
                <EditInline q={q} onCancel={() => setEditing(null)} onSave={(patch) => saveEdit(q, patch)} index={i} />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs muted">Q{i + 1}</span>
                      <span className={`badge ${q.type === "mcq" ? "badge-blue" : q.type === "true_false" ? "badge-orange" : "badge-gray"}`}>
                        {q.type === "mcq" ? "MCQ" : q.type === "true_false" ? "True/False" : "Short Answer"}
                      </span>
                      <span className="badge-gray">{q.marks} mark{q.marks > 1 ? "s" : ""}</span>
                    </div>
                    <p className="font-medium text-ink-900">{q.question_text}</p>
                    {q.options?.length > 0 && (
                      <ul className="mt-2 text-sm space-y-1">
                        {q.options.map((o) => (
                          <li key={o} className={o === q.correct_option ? "text-emerald-700 font-medium" : "text-ink-700"}>
                            {o === q.correct_option ? "✓ " : "• "}{o}
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.type === "short" && q.correct_option && (
                      <p className="mt-2 text-sm muted">Expected: <span className="text-ink-700">{q.correct_option}</span></p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setEditing(q._id)} className="btn-ghost text-brand-700 text-sm">Edit</button>
                    <button onClick={() => removeQuestion(q._id)} className="btn-ghost text-red-600 text-sm">Delete</button>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </DashboardShell>
  );
}

function EditInline({ q, index, onCancel, onSave }) {
  const [text, setText] = useState(q.question_text);
  const [marks, setMarks] = useState(q.marks);
  const [opts, setOpts] = useState(q.options?.length ? [...q.options, "", "", "", ""].slice(0, 4) : ["", "", "", ""]);
  const [correct, setCorrect] = useState(q.correct_option || "");
  function submit(e) {
    e.preventDefault();
    const patch = { question_text: text.trim(), marks: Number(marks) || 1, correct_option: correct };
    if (q.type === "mcq") patch.options = opts.map((o) => o.trim()).filter(Boolean);
    onSave(patch);
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs muted">Editing Q{index + 1}</p>
      <textarea className="input min-h-[80px]" value={text} onChange={(e) => setText(e.target.value)} required />
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="label">Marks</label><input type="number" min={1} className="input" value={marks} onChange={(e) => setMarks(e.target.value)} /></div>
      </div>
      {q.type === "mcq" && (
        <div className="space-y-2">
          <label className="label">Options (select correct)</label>
          {opts.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="c" checked={correct === o && o !== ""} onChange={() => setCorrect(o)} className="h-4 w-4" />
              <input className="input" value={o} onChange={(e) => { const c = [...opts]; c[i] = e.target.value; setOpts(c); }} placeholder={`Option ${i + 1}`} />
            </div>
          ))}
        </div>
      )}
      {q.type === "true_false" && (
        <div className="flex gap-2">
          {["true", "false"].map((v) => (
            <button key={v} type="button" onClick={() => setCorrect(v)} className={`flex-1 py-2 rounded-lg border ${correct === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 bg-white"}`}>{v[0].toUpperCase() + v.slice(1)}</button>
          ))}
        </div>
      )}
      {q.type === "short" && (
        <div><label className="label">Expected answer</label><input className="input" value={correct} onChange={(e) => setCorrect(e.target.value)} /></div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
        <button type="submit" className="btn-primary text-sm">Save</button>
      </div>
    </form>
  );
}

function Meta({ label, value, tone }) {
  return (
    <div className="card">
      <p className="text-xs muted uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === "green" ? "text-emerald-700" : "text-ink-900"}`}>{value}</p>
    </div>
  );
}

function AddQuestionForm({ quizId, onAdded }) {
  const [type, setType] = useState("mcq");
  const [text, setText] = useState("");
  const [marks, setMarks] = useState(1);
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState("");

  function updateOption(i, v) {
    setOptions((o) => { const c = [...o]; c[i] = v; return c; });
  }

  async function submit(e) {
    e.preventDefault();
    let payload = { question_text: text.trim(), type, marks: Number(marks) || 1 };
    if (type === "mcq") {
      payload.options = options.map((o) => o.trim()).filter(Boolean);
      payload.correct_option = correct.trim();
    } else if (type === "true_false") {
      payload.correct_option = correct;
    } else {
      payload.correct_option = correct.trim();
    }
    const r = await fetch(`/api/quizzes/${quizId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!d.ok) return toast.error(d.error || "Failed");
    toast.success("Question added");
    setText(""); setOptions(["", "", "", ""]); setCorrect(""); setMarks(1);
    onAdded?.();
  }

  return (
    <form onSubmit={submit} className="card space-y-4 mb-4 border-brand-100">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Type</label>
          <select className="input" value={type} onChange={(e) => { setType(e.target.value); setCorrect(""); }}>
            <option value="mcq">MCQ (multiple choice)</option>
            <option value="true_false">True / False</option>
            <option value="short">Short Answer</option>
          </select>
        </div>
        <div>
          <label className="label">Marks</label>
          <input type="number" min={1} className="input" value={marks} onChange={(e) => setMarks(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Question text</label>
        <textarea className="input min-h-[80px]" value={text} onChange={(e) => setText(e.target.value)} required />
      </div>

      {type === "mcq" && (
        <div className="space-y-2">
          <label className="label">Options (mark the correct one)</label>
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={correct === o && o !== ""}
                onChange={() => setCorrect(o)}
                className="h-4 w-4"
              />
              <input
                className="input"
                value={o}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
              />
            </div>
          ))}
        </div>
      )}

      {type === "true_false" && (
        <div>
          <label className="label">Correct answer</label>
          <div className="flex gap-2">
            {["true", "false"].map((v) => (
              <button key={v} type="button" onClick={() => setCorrect(v)} className={`flex-1 py-2 rounded-lg border ${correct === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 bg-white text-ink-700"}`}>
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {type === "short" && (
        <div>
          <label className="label">Expected answer (optional — used as a hint for manual grading)</label>
          <input className="input" value={correct} onChange={(e) => setCorrect(e.target.value)} />
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary">Add Question</button>
      </div>
    </form>
  );
}
