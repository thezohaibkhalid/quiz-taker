import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";
import Attempt from "@/models/Attempt";
import { requireAuth } from "@/lib/auth";
import { logAction, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req, ["student"]);
    if (error) return error;
    const { quiz_id } = await req.json();
    if (!quiz_id) return NextResponse.json({ ok: false, error: "quiz_id required" }, { status: 400 });

    const quiz = await Quiz.findById(quiz_id);
    if (!quiz || !quiz.is_published) return NextResponse.json({ ok: false, error: "Quiz not available" }, { status: 404 });

    const now = new Date();
    if (now < quiz.start_time) return NextResponse.json({ ok: false, error: "Quiz has not started yet" }, { status: 400 });
    if (now > quiz.end_time) return NextResponse.json({ ok: false, error: "Quiz window has closed" }, { status: 400 });

    if (quiz.allow_single_attempt) {
      const prior = await Attempt.findOne({ student_id: user._id, quiz_id: quiz._id, is_completed: true });
      if (prior) return NextResponse.json({ ok: false, error: "You have already attempted this quiz" }, { status: 400 });
    }

    let attempt = await Attempt.findOne({ student_id: user._id, quiz_id: quiz._id, is_completed: false });
    if (!attempt) {
      attempt = await Attempt.create({ student_id: user._id, quiz_id: quiz._id, started_at: new Date() });
      await logAction({
        user_id: user._id,
        action: "attempt.start",
        entity_type: "Attempt",
        entity_id: attempt._id,
        ip_address: getClientIp(req),
        metadata: { quiz_id: quiz._id },
      });
    }

    const questions = await Question.find({ quiz_id: quiz._id }).sort({ order: 1, created_at: 1 }).lean();
    const ordered = quiz.randomize_questions ? [...questions].sort(() => Math.random() - 0.5) : questions;
    const safe = ordered.map((q) => ({
      _id: q._id,
      question_text: q.question_text,
      type: q.type,
      options: q.options,
      marks: q.marks,
      image_url: q.image_url,
    }));

    const elapsed = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
    const remaining = Math.max(0, quiz.duration_minutes * 60 - elapsed);

    const draftMap = attempt.draft_answers instanceof Map ? Object.fromEntries(attempt.draft_answers) : (attempt.draft_answers || {});

    return NextResponse.json({
      ok: true,
      attempt: { _id: attempt._id, started_at: attempt.started_at, draft_answers: draftMap, tab_switches: attempt.tab_switches || 0 },
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        duration_minutes: quiz.duration_minutes,
        total_marks: quiz.total_marks,
        end_time: quiz.end_time,
      },
      questions: safe,
      seconds_remaining: remaining,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
