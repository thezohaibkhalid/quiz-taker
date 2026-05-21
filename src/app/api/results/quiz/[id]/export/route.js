import { connectDB } from "@/lib/db";
import Quiz from "@/models/Quiz";
import Result from "@/models/Result";
import Attempt from "@/models/Attempt";
import { requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

function csvEscape(v) {
  if (v == null) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req, ["teacher", "admin"]);
    if (error) return error;
    const quiz = await Quiz.findById(params.id);
    if (!quiz) return new Response("Quiz not found", { status: 404 });
    if (user.role !== "admin" && quiz.created_by.toString() !== user._id.toString()) {
      return new Response("Forbidden", { status: 403 });
    }

    const results = await Result.find({ quiz_id: quiz._id })
      .populate("student_id", "name email")
      .lean();
    const attemptIds = results.map((r) => r.attempt_id);
    const attempts = await Attempt.find({ _id: { $in: attemptIds } }).lean();
    const aMap = new Map(attempts.map((a) => [a._id.toString(), a]));

    const headers = [
      "student_name", "student_email", "obtained_marks", "total_marks", "percentage",
      "status", "announced", "announced_at", "time_taken_seconds", "submitted_at",
    ];
    const lines = [headers.join(",")];
    for (const r of results) {
      const a = aMap.get(r.attempt_id.toString());
      lines.push([
        csvEscape(r.student_id?.name),
        csvEscape(r.student_id?.email),
        r.obtained_marks,
        r.total_marks,
        r.percentage.toFixed(2),
        r.status,
        r.announced ? "yes" : "no",
        r.announced_at ? new Date(r.announced_at).toISOString() : "",
        a?.time_taken_seconds || "",
        a?.submitted_at ? new Date(a.submitted_at).toISOString() : "",
      ].join(","));
    }

    const filename = `quiz_${params.id}_results_${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return apiError(err);
  }
}
