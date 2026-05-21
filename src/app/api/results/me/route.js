import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Result from "@/models/Result";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req, ["student"]);
    if (error) return error;

    const results = await Result.find({ student_id: user._id, announced: true })
      .sort({ announced_at: -1 })
      .populate({ path: "quiz_id", select: "title total_marks pass_percentage subject_id", populate: { path: "subject_id", select: "name code" } })
      .lean();

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
