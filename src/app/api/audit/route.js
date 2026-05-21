import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const { error } = await requireAuth(req, ["admin"]);
    if (error) return error;
    const url = new URL(req.url);
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10), 1), 200);
    const action = url.searchParams.get("action");
    const filter = {};
    if (action) filter.action = action;
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).populate("user_id", "name email role").lean(),
      AuditLog.countDocuments(filter),
    ]);
    return NextResponse.json({ ok: true, logs, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
