import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Result from "@/models/Result";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { requireAuth } from "@/lib/auth";
import { sendEmail, resultAnnouncementEmail } from "@/lib/email";
import { logAction, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req, ["teacher", "admin"]);
    if (error) return error;
    const { quiz_id } = await req.json();
    if (!quiz_id) return NextResponse.json({ ok: false, error: "quiz_id required" }, { status: 400 });

    const quiz = await Quiz.findById(quiz_id);
    if (!quiz) return NextResponse.json({ ok: false, error: "Quiz not found" }, { status: 404 });
    if (user.role !== "admin" && quiz.created_by.toString() !== user._id.toString()) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const results = await Result.find({ quiz_id: quiz._id, announced: false }).populate("student_id", "name email");
    let count = 0;
    for (const r of results) {
      r.announced = true;
      r.announced_at = now;
      await r.save();
      count++;
      const student = r.student_id;
      if (student?.email) {
        const { subject, html } = resultAnnouncementEmail({
          name: student.name,
          quizTitle: quiz.title,
          obtained: r.obtained_marks,
          total: r.total_marks,
          percentage: r.percentage,
          status: r.status,
        });
        sendEmail({ to: student.email, subject, html }).catch(() => {});
        Notification.create({
          user_id: student._id,
          type: "result",
          title: `Result published: ${quiz.title}`,
          message: `You scored ${r.obtained_marks}/${r.total_marks} (${r.percentage.toFixed(1)}%) · ${r.status.toUpperCase()}`,
          channel: "in_app",
          status: "sent",
          sent_at: new Date(),
          related_quiz_id: quiz._id,
        }).catch(() => {});
      }
    }

    quiz.results_announced = true;
    quiz.results_announced_at = now;
    await quiz.save();

    await logAction({
      user_id: user._id,
      action: "results.announce",
      entity_type: "Quiz",
      entity_id: quiz._id,
      ip_address: getClientIp(req),
      metadata: { count },
    });

    return NextResponse.json({ ok: true, announced: count });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
