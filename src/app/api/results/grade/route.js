import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Result from "@/models/Result";
import Attempt from "@/models/Attempt";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";
import { requireAuth } from "@/lib/auth";
import { computePercentage } from "@/lib/validate";
import { logAction, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req, ["teacher", "admin"]);
    if (error) return error;
    const { attempt_id, grades, feedback } = await req.json();
    if (!attempt_id || !Array.isArray(grades)) {
      return NextResponse.json({ ok: false, error: "attempt_id and grades[] required" }, { status: 400 });
    }

    const attempt = await Attempt.findById(attempt_id);
    if (!attempt) return NextResponse.json({ ok: false, error: "Attempt not found" }, { status: 404 });
    const quiz = await Quiz.findById(attempt.quiz_id);
    if (!quiz) return NextResponse.json({ ok: false, error: "Quiz not found" }, { status: 404 });
    if (user.role !== "admin" && quiz.created_by.toString() !== user._id.toString()) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const gradeMap = new Map(grades.map((g) => [String(g.question_id), Number(g.awarded_marks) || 0]));
    const questions = await Question.find({ quiz_id: quiz._id }).lean();
    const qMaxMap = new Map(questions.map((q) => [q._id.toString(), q.marks || 0]));

    for (const a of attempt.answers) {
      const qid = a.question_id.toString();
      if (gradeMap.has(qid)) {
        const max = qMaxMap.get(qid) || 0;
        const awarded = Math.max(0, Math.min(max, gradeMap.get(qid)));
        a.awarded_marks = awarded;
        a.is_correct = awarded === max && max > 0;
      }
    }

    const obtained = attempt.answers.reduce((s, a) => s + (a.awarded_marks || 0), 0);
    const total = questions.reduce((s, q) => s + (q.marks || 0), 0);
    const percentage = computePercentage(obtained, total);

    await attempt.save();

    const status = percentage >= (quiz.pass_percentage || 50) ? "pass" : "fail";
    const result = await Result.findOneAndUpdate(
      { attempt_id: attempt._id },
      {
        obtained_marks: obtained,
        total_marks: total,
        percentage,
        status,
        needs_manual_grading: false,
        feedback: feedback || "",
      },
      { upsert: true, new: true }
    );

    await logAction({
      user_id: user._id,
      action: "result.grade",
      entity_type: "Result",
      entity_id: result._id,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
