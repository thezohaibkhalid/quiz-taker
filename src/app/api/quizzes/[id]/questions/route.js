import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";
import { requireAuth } from "@/lib/auth";
import { logAction, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function ownerOnly(req, id) {
  const { user, error } = await requireAuth(req, ["teacher", "admin"]);
  if (error) return { error };
  const quiz = await Quiz.findById(id);
  if (!quiz) return { error: NextResponse.json({ ok: false, error: "Not found" }, { status: 404 }) };
  if (user.role !== "admin" && quiz.created_by.toString() !== user._id.toString()) {
    return { error: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  }
  return { user, quiz };
}

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { error, quiz } = await ownerOnly(req, params.id);
    if (error) return error;
    const list = await Question.find({ quiz_id: quiz._id }).sort({ order: 1, created_at: 1 }).lean();
    return NextResponse.json({ ok: true, questions: list });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { error, user, quiz } = await ownerOnly(req, params.id);
    if (error) return error;
    const body = await req.json();
    const { question_text, type, options = [], correct_option = "", marks = 1, image_url = "" } = body;

    if (!question_text || !type) {
      return NextResponse.json({ ok: false, error: "question_text and type are required" }, { status: 400 });
    }
    if (!["mcq", "true_false", "short"].includes(type)) {
      return NextResponse.json({ ok: false, error: "Invalid question type" }, { status: 400 });
    }
    if (type === "mcq" && (!Array.isArray(options) || options.length < 2)) {
      return NextResponse.json({ ok: false, error: "MCQ requires at least 2 options" }, { status: 400 });
    }
    if (type === "mcq" && !options.includes(correct_option)) {
      return NextResponse.json({ ok: false, error: "correct_option must match one of the options" }, { status: 400 });
    }
    if (type === "true_false" && !["true", "false"].includes(String(correct_option).toLowerCase())) {
      return NextResponse.json({ ok: false, error: "correct_option must be 'true' or 'false'" }, { status: 400 });
    }

    const count = await Question.countDocuments({ quiz_id: quiz._id });
    const q = await Question.create({
      quiz_id: quiz._id,
      question_text,
      type,
      options: type === "true_false" ? ["true", "false"] : options,
      correct_option,
      marks: Number(marks) || 1,
      order: count + 1,
      image_url,
    });

    const totalAgg = await Question.aggregate([
      { $match: { quiz_id: quiz._id } },
      { $group: { _id: null, total: { $sum: "$marks" } } },
    ]);
    quiz.total_marks = totalAgg[0]?.total || 0;
    await quiz.save();

    await logAction({
      user_id: user._id,
      action: "question.create",
      entity_type: "Question",
      entity_id: q._id,
      ip_address: getClientIp(req),
      metadata: { quiz_id: quiz._id },
    });

    return NextResponse.json({ ok: true, question: q });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { error, user, quiz } = await ownerOnly(req, params.id);
    if (error) return error;
    const url = new URL(req.url);
    const qid = url.searchParams.get("qid");
    if (!qid) return NextResponse.json({ ok: false, error: "qid required" }, { status: 400 });

    await Question.deleteOne({ _id: qid, quiz_id: quiz._id });

    const totalAgg = await Question.aggregate([
      { $match: { quiz_id: quiz._id } },
      { $group: { _id: null, total: { $sum: "$marks" } } },
    ]);
    quiz.total_marks = totalAgg[0]?.total || 0;
    await quiz.save();

    await logAction({
      user_id: user._id,
      action: "question.delete",
      entity_type: "Question",
      entity_id: qid,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
