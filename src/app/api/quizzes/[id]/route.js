import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";
import Attempt from "@/models/Attempt";
import Result from "@/models/Result";
import { requireAuth } from "@/lib/auth";
import { logAction, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req);
    if (error) return error;
    const { id } = params;

    const quiz = await Quiz.findById(id)
      .populate("subject_id", "name code")
      .populate("created_by", "name email")
      .lean();
    if (!quiz) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const isOwner = quiz.created_by?._id?.toString() === user._id.toString();
    const isAdmin = user.role === "admin";
    const includeAnswers = isOwner || isAdmin;

    const questions = await Question.find({ quiz_id: id }).sort({ order: 1, created_at: 1 }).lean();
    const sanitized = includeAnswers
      ? questions
      : questions.map((q) => ({ ...q, correct_option: undefined }));

    return NextResponse.json({ ok: true, quiz, questions: sanitized });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req, ["teacher", "admin"]);
    if (error) return error;
    const { id } = params;

    const quiz = await Quiz.findById(id);
    if (!quiz) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (user.role !== "admin" && quiz.created_by.toString() !== user._id.toString()) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const allowed = [
      "title",
      "description",
      "subject_id",
      "duration_minutes",
      "pass_percentage",
      "start_time",
      "end_time",
      "allow_single_attempt",
      "randomize_questions",
      "cover_image_url",
      "is_published",
    ];
    for (const k of allowed) {
      if (body[k] !== undefined) quiz[k] = body[k];
    }
    await quiz.save();

    await logAction({
      user_id: user._id,
      action: "quiz.update",
      entity_type: "Quiz",
      entity_id: quiz._id,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ ok: true, quiz });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req, ["teacher", "admin"]);
    if (error) return error;
    const { id } = params;

    const quiz = await Quiz.findById(id);
    if (!quiz) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (user.role !== "admin" && quiz.created_by.toString() !== user._id.toString()) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    await Promise.all([
      Question.deleteMany({ quiz_id: id }),
      Attempt.deleteMany({ quiz_id: id }),
      Result.deleteMany({ quiz_id: id }),
      quiz.deleteOne(),
    ]);

    await logAction({
      user_id: user._id,
      action: "quiz.delete",
      entity_type: "Quiz",
      entity_id: id,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
