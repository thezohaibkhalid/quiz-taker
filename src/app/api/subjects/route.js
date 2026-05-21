import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subject from "@/models/Subject";
import { requireAuth } from "@/lib/auth";
import { logAction, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const { error } = await requireAuth(req);
    if (error) return error;
    const subjects = await Subject.find().sort({ name: 1 }).lean();
    return NextResponse.json({ ok: true, subjects });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req, ["admin", "teacher"]);
    if (error) return error;
    const { name, code, description } = await req.json();
    if (!name || !code) return NextResponse.json({ ok: false, error: "name and code are required" }, { status: 400 });
    const exists = await Subject.findOne({ code: code.toUpperCase() });
    if (exists) return NextResponse.json({ ok: false, error: "Code already exists" }, { status: 409 });
    const subject = await Subject.create({ name, code: code.toUpperCase(), description: description || "", created_by: user._id });
    await logAction({
      user_id: user._id,
      action: "subject.create",
      entity_type: "Subject",
      entity_id: subject._id,
      ip_address: getClientIp(req),
    });
    return NextResponse.json({ ok: true, subject });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
