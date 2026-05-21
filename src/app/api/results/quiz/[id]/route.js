import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Result from "@/models/Result";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req, ["teacher", "admin"]);
    if (error) return error;

    const quiz = await Quiz.findById(params.id);
    if (!quiz) return NextResponse.json({ ok: false, error: "Quiz not found" }, { status: 404 });
    if (user.role !== "admin" && quiz.created_by.toString() !== user._id.toString()) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const results = await Result.find({ quiz_id: quiz._id })
      .populate("student_id", "name email")
      .sort({ percentage: -1 })
      .lean();

    const stats = {
      attempts: results.length,
      avg_percentage: results.length ? results.reduce((s, r) => s + r.percentage, 0) / results.length : 0,
      pass_count: results.filter((r) => r.status === "pass").length,
      fail_count: results.filter((r) => r.status === "fail").length,
      pending_count: results.filter((r) => r.status === "pending").length,
      announced: quiz.results_announced,
    };

    return NextResponse.json({ ok: true, quiz, results, stats });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
