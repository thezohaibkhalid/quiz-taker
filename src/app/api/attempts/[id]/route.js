import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attempt from "@/models/Attempt";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req);
    if (error) return error;

    const attempt = await Attempt.findById(params.id).lean();
    if (!attempt) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const quiz = await Quiz.findById(attempt.quiz_id).lean();
    const isOwner = attempt.student_id.toString() === user._id.toString();
    const isTeacher = user.role === "teacher" && quiz?.created_by?.toString() === user._id.toString();
    const isAdmin = user.role === "admin";
    if (!isOwner && !isTeacher && !isAdmin) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const questions = await Question.find({ quiz_id: attempt.quiz_id }).sort({ order: 1, created_at: 1 }).lean();
    return NextResponse.json({ ok: true, attempt, quiz, questions });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
