import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";
import { requireAuth } from "@/lib/auth";
import { logAction, getClientIp } from "@/lib/audit";
import { apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

async function authorize(req, id) {
  const { user, error } = await requireAuth(req, ["teacher", "admin"]);
  if (error) return { error };
  const quiz = await Quiz.findById(id);
  if (!quiz) return { error: NextResponse.json({ ok: false, error: "Not found" }, { status: 404 }) };
  if (user.role !== "admin" && quiz.created_by.toString() !== user._id.toString()) {
    return { error: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  }
  return { user, quiz };
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { error, user, quiz } = await authorize(req, params.id);
    if (error) return error;
    const q = await Question.findOne({ _id: params.qid, quiz_id: quiz._id });
    if (!q) return NextResponse.json({ ok: false, error: "Question not found" }, { status: 404 });
    const body = await req.json();
    if (body.question_text) q.question_text = body.question_text;
    if (body.type && ["mcq", "true_false", "short"].includes(body.type)) q.type = body.type;
    if (Array.isArray(body.options)) q.options = body.options;
    if (typeof body.correct_option === "string") q.correct_option = body.correct_option;
    if (body.marks !== undefined) q.marks = Number(body.marks) || 1;
    if (typeof body.image_url === "string") q.image_url = body.image_url;
    await q.save();

    const total = await Question.aggregate([
      { $match: { quiz_id: quiz._id } },
      { $group: { _id: null, total: { $sum: "$marks" } } },
    ]);
    quiz.total_marks = total[0]?.total || 0;
    await quiz.save();

    await logAction({
      user_id: user._id,
      action: "question.update",
      entity_type: "Question",
      entity_id: q._id,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ ok: true, question: q });
  } catch (err) {
    return apiError(err);
  }
}
