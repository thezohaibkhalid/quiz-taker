import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Quiz from "@/models/Quiz";
import Attempt from "@/models/Attempt";
import Result from "@/models/Result";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req);
    if (error) return error;

    if (user.role === "student") {
      const results = await Result.find({ student_id: user._id, announced: true })
        .sort({ announced_at: 1 })
        .populate("quiz_id", "title")
        .lean();
      const attemptsCount = await Attempt.countDocuments({ student_id: user._id, is_completed: true });
      const passed = results.filter((r) => r.status === "pass").length;
      const avg = results.length ? results.reduce((s, r) => s + r.percentage, 0) / results.length : 0;
      return NextResponse.json({
        ok: true,
        scope: "student",
        stats: {
          total_attempts: attemptsCount,
          announced_results: results.length,
          passed,
          failed: results.length - passed,
          avg_percentage: Number(avg.toFixed(2)),
        },
        trend: results.map((r) => ({
          quiz: r.quiz_id?.title || "Quiz",
          percentage: Number(r.percentage.toFixed(2)),
          announced_at: r.announced_at,
        })),
      });
    }

    if (user.role === "teacher") {
      const quizzes = await Quiz.find({ created_by: user._id }).lean();
      const quizIds = quizzes.map((q) => q._id);
      const totalAttempts = await Attempt.countDocuments({ quiz_id: { $in: quizIds }, is_completed: true });
      const results = await Result.find({ quiz_id: { $in: quizIds } }).lean();
      const perQuiz = quizzes.map((q) => {
        const r = results.filter((x) => x.quiz_id.toString() === q._id.toString());
        const avg = r.length ? r.reduce((s, x) => s + x.percentage, 0) / r.length : 0;
        return {
          quiz_id: q._id,
          title: q.title,
          attempts: r.length,
          avg_percentage: Number(avg.toFixed(2)),
          pass_count: r.filter((x) => x.status === "pass").length,
          fail_count: r.filter((x) => x.status === "fail").length,
        };
      });
      return NextResponse.json({
        ok: true,
        scope: "teacher",
        stats: {
          total_quizzes: quizzes.length,
          published_quizzes: quizzes.filter((q) => q.is_published).length,
          total_attempts: totalAttempts,
        },
        per_quiz: perQuiz,
      });
    }

    // admin
    const [usersCount, studentsCount, teachersCount, adminsCount, quizCount, publishedCount, attemptCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "admin" }),
      Quiz.countDocuments(),
      Quiz.countDocuments({ is_published: true }),
      Attempt.countDocuments({ is_completed: true }),
    ]);
    const recentResults = await Result.find({ announced: true })
      .sort({ announced_at: -1 })
      .limit(20)
      .populate("student_id", "name")
      .populate("quiz_id", "title")
      .lean();
    return NextResponse.json({
      ok: true,
      scope: "admin",
      stats: {
        users_total: usersCount,
        students: studentsCount,
        teachers: teachersCount,
        admins: adminsCount,
        quizzes_total: quizCount,
        quizzes_published: publishedCount,
        attempts_total: attemptCount,
      },
      recent_results: recentResults,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
