"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

export default function QuizAttemptPage() {
  const { id } = useParams();
  const router = useRouter();

  const [status, setStatus] = useState("loading"); // loading | running | submitting | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [savedAt, setSavedAt] = useState(null);
  const [result, setResult] = useState(null);
  const submittedRef = useRef(false);
  const lowWarnedRef = useRef({ five: false, one: false });

  // ---- Start / resume attempt ----
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/attempts/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quiz_id: id }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || "Could not start quiz");
        setQuiz(data.quiz);
        setQuestions(data.questions);
        setAttempt(data.attempt);
        setAnswers(data.attempt?.draft_answers || {});
        setTabSwitches(data.attempt?.tab_switches || 0);
        setRemaining(data.seconds_remaining || 0);
        setStatus("running");
        if (data.attempt?.draft_answers && Object.keys(data.attempt.draft_answers).length > 0) {
          toast("Resumed your in-progress attempt.", { icon: "↩" });
        }
      } catch (err) {
        setErrorMsg(err.message);
        setStatus("error");
      }
    })();
  }, [id]);

  // ---- Countdown ----
  useEffect(() => {
    if (status !== "running") return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          if (!submittedRef.current) handleSubmit(true);
          return 0;
        }
        if (r === 300 && !lowWarnedRef.current.five) {
          lowWarnedRef.current.five = true;
          toast("5 minutes left.", { icon: "⏱" });
        }
        if (r === 60 && !lowWarnedRef.current.one) {
          lowWarnedRef.current.one = true;
          toast.error("1 minute left!");
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [status]);

  // ---- beforeunload guard ----
  useEffect(() => {
    if (status !== "running") return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [status]);

  // ---- Tab visibility tracking ----
  useEffect(() => {
    if (status !== "running") return;
    function onVis() {
      if (document.visibilityState === "hidden") {
        setTabSwitches((n) => {
          const next = n + 1;
          toast.error("You switched tabs — this is logged.", { id: "tab-switch" });
          return next;
        });
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [status]);

  // ---- Autosave (debounced 1s after change + periodic 15s heartbeat) ----
  const save = useCallback(async (next, switches) => {
    if (!attempt?._id) return;
    try {
      const r = await fetch("/api/attempts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attempt_id: attempt._id, draft_answers: next, tab_switches: switches }),
      });
      const d = await r.json();
      if (d.ok) setSavedAt(d.saved_at);
      else if (r.status === 410) {
        toast.error("Time expired.");
        if (!submittedRef.current) handleSubmit(true);
      }
    } catch {}
    // eslint-disable-next-line
  }, [attempt?._id]);

  useEffect(() => {
    if (status !== "running") return;
    const id = setTimeout(() => save(answers, tabSwitches), 1000);
    return () => clearTimeout(id);
  }, [answers, tabSwitches, status, save]);

  useEffect(() => {
    if (status !== "running") return;
    const t = setInterval(() => save(answers, tabSwitches), 15_000);
    return () => clearInterval(t);
  }, [answers, tabSwitches, status, save]);

  const total = questions.length;
  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q._id] || "").toString().trim() !== "").length,
    [answers, questions]
  );

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const lowTime = remaining > 0 && remaining <= 60;
  const midTime = remaining > 60 && remaining <= 300;

  function setAnswer(qid, value) {
    setAnswers((a) => ({ ...a, [qid]: value }));
  }

  async function handleSubmit(auto = false) {
    if (submittedRef.current) return;
    if (!auto && !confirm(`Submit your quiz now? You've answered ${answeredCount} of ${total} questions.`)) return;
    submittedRef.current = true;
    setStatus("submitting");
    try {
      const payload = {
        attempt_id: attempt._id,
        answers: questions.map((q) => ({ question_id: q._id, answer: answers[q._id] || "" })),
        auto_submitted: auto,
        tab_switches: tabSwitches,
      };
      const res = await fetch("/api/attempts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Submission failed");
      setResult(data);
      setStatus("done");
      if (auto) toast("Time's up — submitted automatically.", { icon: "⏱" });
      else toast.success("Submitted successfully.");
    } catch (err) {
      submittedRef.current = false;
      setStatus("running");
      toast.error(err.message);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="mt-4 muted">Loading quiz…</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 p-6">
        <div className="card max-w-md text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <h2 className="font-serif text-2xl text-ink-900">Cannot start quiz</h2>
          <p className="mt-2 text-ink-600">{errorMsg}</p>
          <Link href="/student/quizzes" className="btn-secondary mt-6 inline-flex">Back to quizzes</Link>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return <ResultScreen result={result} quiz={quiz} />;
  }

  const q = questions[current];

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-ink-100">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs muted uppercase tracking-wider">Quiz in progress</p>
            <h1 className="font-semibold text-ink-900 truncate">{quiz.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex text-xs muted">
              {savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : "Saving…"}
            </span>
            <motion.div
              animate={lowTime ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={lowTime ? { duration: 1, repeat: Infinity } : {}}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
                lowTime ? "bg-red-50 text-red-700 border border-red-200" : midTime ? "bg-accent-50 text-accent-700 border border-accent-200" : "bg-brand-50 text-brand-700 border border-brand-100"
              }`}
            >
              <span>⏱</span>
              <span>{mm}:{ss}</span>
            </motion.div>
          </div>
        </div>
        <div className="h-1 bg-ink-100">
          <motion.div
            className="h-full bg-accent-500"
            initial={{ width: 0 }}
            animate={{ width: `${total ? ((current + 1) / total) * 100 : 0}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6 grid md:grid-cols-[1fr_220px] gap-6">
        {/* Question pane */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={q?._id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="card"
            >
              <div className="flex items-center justify-between text-xs muted mb-2">
                <span>Question {current + 1} of {total}</span>
                <span className="badge-blue">{q.marks} mark{q.marks > 1 ? "s" : ""}</span>
              </div>
              <h2 className="text-lg font-semibold text-ink-900 leading-relaxed">{q.question_text}</h2>
              {q.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={q.image_url} alt="" className="mt-4 rounded-lg max-h-64 object-contain border border-ink-100" />
              )}

              <div className="mt-6 space-y-2">
                {q.type === "mcq" && q.options.map((opt) => (
                  <Option key={opt} label={opt} selected={answers[q._id] === opt} onClick={() => setAnswer(q._id, opt)} />
                ))}
                {q.type === "true_false" && ["true", "false"].map((opt) => (
                  <Option key={opt} label={opt[0].toUpperCase() + opt.slice(1)} selected={answers[q._id] === opt} onClick={() => setAnswer(q._id, opt)} />
                ))}
                {q.type === "short" && (
                  <textarea
                    className="input min-h-[140px]"
                    placeholder="Type your answer…"
                    value={answers[q._id] || ""}
                    onChange={(e) => setAnswer(q._id, e.target.value)}
                  />
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button className="btn-secondary" disabled={current === 0} onClick={() => setCurrent((c) => Math.max(0, c - 1))}>
              ← Previous
            </button>
            <p className="text-xs muted">{answeredCount} of {total} answered</p>
            {current < total - 1 ? (
              <button className="btn-primary" onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}>Next →</button>
            ) : (
              <button className="btn-accent" onClick={() => handleSubmit(false)} disabled={status === "submitting"}>
                {status === "submitting" ? "Submitting…" : "Submit quiz"}
              </button>
            )}
          </div>
        </div>

        {/* Question palette */}
        <aside className="md:sticky md:top-24 self-start card">
          <p className="text-xs muted uppercase tracking-wider mb-3">Questions</p>
          <div className="grid grid-cols-6 md:grid-cols-5 gap-2">
            {questions.map((qi, i) => {
              const answered = (answers[qi._id] || "").toString().trim() !== "";
              const active = i === current;
              return (
                <button
                  key={qi._id}
                  onClick={() => setCurrent(i)}
                  className={`h-9 w-9 rounded-md text-xs font-semibold border transition ${
                    active
                      ? "bg-brand-600 text-white border-brand-600"
                      : answered
                      ? "bg-accent-50 text-accent-700 border-accent-200"
                      : "bg-white text-ink-700 border-ink-200 hover:bg-cream-100"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 text-xs space-y-1 muted">
            <p><span className="inline-block w-2 h-2 rounded-sm bg-brand-600 mr-2"></span>Current</p>
            <p><span className="inline-block w-2 h-2 rounded-sm bg-accent-200 mr-2"></span>Answered</p>
            <p><span className="inline-block w-2 h-2 rounded-sm bg-ink-200 mr-2"></span>Unanswered</p>
          </div>
          {tabSwitches > 0 && (
            <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1">
              Tab switches: <b>{tabSwitches}</b>
            </p>
          )}
          <button
            onClick={() => handleSubmit(false)}
            disabled={status === "submitting"}
            className="btn-accent w-full mt-5"
          >
            {status === "submitting" ? "Submitting…" : "Submit quiz"}
          </button>
        </aside>
      </div>
    </div>
  );
}

function Option({ label, selected, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      className={`w-full text-left px-4 py-3 rounded-lg border text-sm flex items-center gap-3 transition ${
        selected
          ? "border-brand-500 bg-brand-50 text-brand-800"
          : "border-ink-200 bg-white text-ink-800 hover:bg-cream-100"
      }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 shrink-0 ${selected ? "border-brand-600 bg-brand-600" : "border-ink-300"}`}></span>
      <span>{label}</span>
    </motion.button>
  );
}

function ResultScreen({ result, quiz }) {
  const announced = result?.result?.announced;
  const status = result?.result?.status;
  const pct = result?.result?.percentage;
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="card max-w-lg w-full text-center"
      >
        <div className="text-5xl mb-2">{announced ? (status === "pass" ? "🎉" : status === "fail" ? "💪" : "✅") : "✅"}</div>
        <h2 className="font-serif text-3xl text-ink-900">Submitted</h2>
        <p className="mt-2 text-ink-600">{result?.message}</p>

        {announced && pct != null && (
          <div className="mt-6 p-5 rounded-xl bg-cream-100 border border-accent-200">
            <p className="text-xs muted uppercase tracking-wider">Score</p>
            <p className="mt-1 text-4xl font-bold text-accent-600">{pct.toFixed(1)}%</p>
            <p className={`mt-1 text-sm font-semibold uppercase ${status === "pass" ? "text-emerald-600" : "text-red-600"}`}>{status}</p>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Link href="/student/results" className="btn-primary">View results</Link>
          <Link href="/student/quizzes" className="btn-secondary">Back to quizzes</Link>
        </div>
      </motion.div>
    </div>
  );
}
