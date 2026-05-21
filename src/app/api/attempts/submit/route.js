import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";
import Attempt from "@/models/Attempt";
import Result from "@/models/Result";
import { requireAuth } from "@/lib/auth";
import { evaluateObjectiveAnswer, computePercentage } from "@/lib/validate";
import { logAction, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req, ["student"]);
    if (error) return error;
    const { attempt_id, answers, auto_submitted, tab_switches } = await req.json();
    if (!attempt_id || !Array.isArray(answers)) {
      return NextResponse.json({ ok: false, error: "attempt_id and answers[] required" }, { status: 400 });
    }

    const attempt = await Attempt.findById(attempt_id);
    if (!attempt) return NextResponse.json({ ok: false, error: "Attempt not found" }, { status: 404 });
    if (attempt.student_id.toString() !== user._id.toString()) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    if (attempt.is_completed) return NextResponse.json({ ok: false, error: "Already submitted" }, { status: 400 });

    const quiz = await Quiz.findById(attempt.quiz_id);
    if (!quiz) return NextResponse.json({ ok: false, error: "Quiz not found" }, { status: 404 });

    const now = new Date();
    const deadlineTs = Math.min(
      new Date(attempt.started_at).getTime() + quiz.duration_minutes * 60 * 1000,
      new Date(quiz.end_time).getTime()
    );
    const isLate = now.getTime() > deadlineTs + 5_000; // 5s clock-skew grace
    if (isLate && !auto_submitted) {
      // Hard refuse late submissions unless the client says it's the auto-submit on timeout.
      // (Auto-submit always lands within ~1s of deadline server-side.)
      // Fall through anyway because we still want to record whatever answers were saved.
    }

    const questions = await Question.find({ quiz_id: quiz._id }).lean();
    const qMap = Object.fromEntries(questions.map((q) => [q._id.toString(), q]));

    let obtained = 0;
    let needsManual = false;
    const evaluatedAnswers = answers.map(({ question_id, answer }) => {
      const q = qMap[question_id];
      if (!q) return { question_id, answer, is_correct: false, awarded_marks: 0 };
      const { isCorrect, awarded, needsManual: nm } = evaluateObjectiveAnswer(q, answer);
      if (nm) needsManual = true;
      obtained += awarded || 0;
      return { question_id, answer, is_correct: isCorrect, awarded_marks: awarded || 0 };
    });

    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const percentage = computePercentage(obtained, totalMarks);
    const submittedAt = new Date();
    const timeTaken = Math.floor((submittedAt - new Date(attempt.started_at)) / 1000);

    attempt.answers = evaluatedAnswers;
    attempt.submitted_at = submittedAt;
    attempt.time_taken_seconds = timeTaken;
    attempt.is_completed = true;
    attempt.auto_submitted = !!auto_submitted;
    if (typeof tab_switches === "number") attempt.tab_switches = tab_switches;
    attempt.draft_answers = new Map();
    await attempt.save();

    const status = needsManual
      ? "pending"
      : percentage >= (quiz.pass_percentage || 50)
      ? "pass"
      : "fail";

    const result = await Result.findOneAndUpdate(
      { attempt_id: attempt._id },
      {
        attempt_id: attempt._id,
        student_id: user._id,
        quiz_id: quiz._id,
        total_marks: totalMarks,
        obtained_marks: obtained,
        percentage,
        status,
        announced: quiz.results_announced && !needsManual,
        announced_at: quiz.results_announced && !needsManual ? new Date() : null,
        needs_manual_grading: needsManual,
      },
      { upsert: true, new: true }
    );

    await logAction({
      user_id: user._id,
      action: "attempt.submit",
      entity_type: "Attempt",
      entity_id: attempt._id,
      ip_address: getClientIp(req),
      metadata: { quiz_id: quiz._id, percentage },
    });

    return NextResponse.json({
      ok: true,
      message: needsManual
        ? "Submitted. Some answers require manual grading and your result will be announced soon."
        : result.announced
        ? "Submitted and evaluated."
        : "Submitted. Your result will be announced by the teacher.",
      result: {
        announced: result.announced,
        status: result.status,
        percentage: result.announced ? result.percentage : null,
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
