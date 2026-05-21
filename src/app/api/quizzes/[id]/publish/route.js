import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { requireAuth } from "@/lib/auth";
import { sendEmail, quizInvitationEmail } from "@/lib/email";
import { logAction, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
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

    const body = await req.json().catch(() => ({}));
    const publish = body.publish !== false;

    if (publish) {
      const questionCount = await Question.countDocuments({ quiz_id: quiz._id });
      if (questionCount === 0) {
        return NextResponse.json({ ok: false, error: "Add at least one question before publishing" }, { status: 400 });
      }
      const totalMarks = await Question.aggregate([
        { $match: { quiz_id: quiz._id } },
        { $group: { _id: null, total: { $sum: "$marks" } } },
      ]);
      quiz.total_marks = totalMarks[0]?.total || 0;
    }

    quiz.is_published = publish;
    await quiz.save();

    if (publish) {
      // Notify all active students (per PDF: "enrolled students" — simplified to all students).
      const students = await User.find({ role: "student", is_active: true }).select("name email").lean();
      for (const s of students) {
        const { subject, html } = quizInvitationEmail({
          name: s.name,
          quizTitle: quiz.title,
          startTime: quiz.start_time,
          endTime: quiz.end_time,
          durationMinutes: quiz.duration_minutes,
        });
        sendEmail({ to: s.email, subject, html }).catch(() => {});
        Notification.create({
          user_id: s._id,
          type: "invite",
          title: `New quiz available: ${quiz.title}`,
          message: `Opens ${new Date(quiz.start_time).toLocaleString()} · ${quiz.duration_minutes} min`,
          channel: "in_app",
          status: "sent",
          sent_at: new Date(),
          related_quiz_id: quiz._id,
        }).catch(() => {});
      }
    }

    await logAction({
      user_id: user._id,
      action: publish ? "quiz.publish" : "quiz.unpublish",
      entity_type: "Quiz",
      entity_id: quiz._id,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ ok: true, quiz });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
