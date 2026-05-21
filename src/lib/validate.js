export function isEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function isStrongPassword(v) {
  return typeof v === "string" && v.length >= 8;
}

export function evaluateObjectiveAnswer(question, submittedAnswer) {
  if (!question) return { isCorrect: false, awarded: 0 };
  if (question.type === "short") {
    return { isCorrect: null, awarded: 0, needsManual: true };
  }
  const normalize = (s) => String(s ?? "").trim().toLowerCase();
  const correct = normalize(question.correct_option);
  const given = normalize(submittedAnswer);
  if (!correct) return { isCorrect: false, awarded: 0 };
  const ok = correct === given;
  return { isCorrect: ok, awarded: ok ? question.marks || 1 : 0, needsManual: false };
}

export function computePercentage(obtained, total) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, (obtained / total) * 100));
}

export function badRequest(res, message) {
  return res.json({ ok: false, error: message }, { status: 400 });
}
