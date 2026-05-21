import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Attempt from "@/models/Attempt";
import Result from "@/models/Result";
import AuditLog from "@/models/AuditLog";
import { requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { error } = await requireAuth(req, ["admin"]);
    if (error) return error;

    const user = await User.findById(params.id).lean();
    if (!user) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const [attempts, results, recentActions] = await Promise.all([
      Attempt.find({ student_id: user._id, is_completed: true })
        .sort({ submitted_at: -1 })
        .populate({ path: "quiz_id", select: "title total_marks pass_percentage" })
        .lean(),
      Result.find({ student_id: user._id })
        .sort({ created_at: 1 })
        .populate({ path: "quiz_id", select: "title total_marks pass_percentage subject_id", populate: { path: "subject_id", select: "name code" } })
        .lean(),
      AuditLog.find({ user_id: user._id }).sort({ timestamp: -1 }).limit(20).lean(),
    ]);

    const announced = results.filter((r) => r.announced);
    const stats = {
      attempts: attempts.length,
      results: results.length,
      announced: announced.length,
      passed: announced.filter((r) => r.status === "pass").length,
      failed: announced.filter((r) => r.status === "fail").length,
      pending: results.filter((r) => r.status === "pending").length,
      avg_percentage: announced.length ? Number((announced.reduce((s, r) => s + r.percentage, 0) / announced.length).toFixed(2)) : 0,
      highest: announced.length ? Math.max(...announced.map((r) => r.percentage)) : 0,
      lowest: announced.length ? Math.min(...announced.map((r) => r.percentage)) : 0,
    };

    return NextResponse.json({
      ok: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        is_active: user.is_active,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        last_login: user.last_login,
      },
      stats,
      results,
      attempts,
      recent_actions: recentActions,
    });
  } catch (err) {
    return apiError(err);
  }
}
