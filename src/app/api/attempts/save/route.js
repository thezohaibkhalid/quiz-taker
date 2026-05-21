import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attempt from "@/models/Attempt";
import Quiz from "@/models/Quiz";
import { requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req, ["student"]);
    if (error) return error;
    const { attempt_id, draft_answers = {}, tab_switches } = await req.json();
    if (!attempt_id) return NextResponse.json({ ok: false, error: "attempt_id required" }, { status: 400 });

    const attempt = await Attempt.findById(attempt_id);
    if (!attempt) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (attempt.student_id.toString() !== user._id.toString()) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    if (attempt.is_completed) return NextResponse.json({ ok: false, error: "Already submitted" }, { status: 400 });

    // Hard server deadline check
    const quiz = await Quiz.findById(attempt.quiz_id).lean();
    if (quiz) {
      const deadline = Math.min(
        new Date(attempt.started_at).getTime() + quiz.duration_minutes * 60_000,
        new Date(quiz.end_time).getTime()
      );
      if (Date.now() > deadline) {
        return NextResponse.json({ ok: false, error: "Time has expired. Submit the quiz." }, { status: 410 });
      }
    }

    attempt.draft_answers = new Map(Object.entries(draft_answers).map(([k, v]) => [String(k), String(v ?? "")]));
    if (typeof tab_switches === "number") attempt.tab_switches = tab_switches;
    attempt.last_saved_at = new Date();
    await attempt.save();

    return NextResponse.json({ ok: true, saved_at: attempt.last_saved_at });
  } catch (err) {
    return apiError(err);
  }
}
