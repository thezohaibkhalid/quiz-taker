import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";
import { requireAuth } from "@/lib/auth";
import { logAction, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req);
    if (error) return error;

    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || "all";
    const filter = {};

    if (user.role === "teacher") {
      filter.created_by = user._id;
    } else if (user.role === "student") {
      filter.is_published = true;
      if (scope === "active") {
        const now = new Date();
        filter.start_time = { $lte: now };
        filter.end_time = { $gte: now };
      } else if (scope === "upcoming") {
        filter.start_time = { $gt: new Date() };
      }
    }

    const quizzes = await Quiz.find(filter)
      .sort({ created_at: -1 })
      .populate("subject_id", "name code")
      .populate("created_by", "name email")
      .lean();

    const ids = quizzes.map((q) => q._id);
    const counts = await Question.aggregate([
      { $match: { quiz_id: { $in: ids } } },
      { $group: { _id: "$quiz_id", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
    const enriched = quizzes.map((q) => ({ ...q, question_count: countMap[q._id.toString()] || 0 }));

    return NextResponse.json({ ok: true, quizzes: enriched });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req, ["teacher", "admin"]);
    if (error) return error;

    const body = await req.json();
    const {
      title,
      description,
      subject_id,
      duration_minutes,
      pass_percentage,
      start_time,
      end_time,
      allow_single_attempt,
      randomize_questions,
      cover_image_url,
    } = body;

    if (!title || !duration_minutes || !start_time || !end_time) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }
    if (new Date(end_time) <= new Date(start_time)) {
      return NextResponse.json({ ok: false, error: "End time must be after start time" }, { status: 400 });
    }

    const quiz = await Quiz.create({
      title: title.trim(),
      description: description || "",
      subject_id: subject_id || undefined,
      created_by: user._id,
      duration_minutes: Number(duration_minutes),
      pass_percentage: pass_percentage ?? 50,
      start_time: new Date(start_time),
      end_time: new Date(end_time),
      allow_single_attempt: allow_single_attempt !== false,
      randomize_questions: !!randomize_questions,
      cover_image_url: cover_image_url || "",
    });

    await logAction({
      user_id: user._id,
      action: "quiz.create",
      entity_type: "Quiz",
      entity_id: quiz._id,
      ip_address: getClientIp(req),
      metadata: { title: quiz.title },
    });

    return NextResponse.json({ ok: true, quiz });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
