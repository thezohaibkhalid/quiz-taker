import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAuth, hashPassword } from "@/lib/auth";
import { isEmail, isStrongPassword } from "@/lib/validate";
import { logAction, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req, ["admin"]);
    if (error) return error;
    const url = new URL(req.url);
    const role = url.searchParams.get("role");
    const q = url.searchParams.get("q");
    const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "20", 10), 1), 100);
    const filter = {};
    if (role) filter.role = role;
    if (q) filter.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];
    const [users, total] = await Promise.all([
      User.find(filter).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return NextResponse.json({ ok: true, users, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const { user: actor, error } = await requireAuth(req, ["admin"]);
    if (error) return error;
    const { name, email, password, role = "student" } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    if (!isEmail(email)) return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    if (!isStrongPassword(password)) return NextResponse.json({ ok: false, error: "Weak password" }, { status: 400 });
    if (!["student", "teacher", "admin"].includes(role)) return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });

    const lower = String(email).toLowerCase().trim();
    if (await User.findOne({ email: lower })) return NextResponse.json({ ok: false, error: "Email already exists" }, { status: 409 });
    const password_hash = await hashPassword(password);
    const newUser = await User.create({ name: name.trim(), email: lower, password_hash, role, is_verified: true });

    await logAction({
      user_id: actor._id,
      action: "admin.user.create",
      entity_type: "User",
      entity_id: newUser._id,
      ip_address: getClientIp(req),
      metadata: { role },
    });

    return NextResponse.json({ ok: true, user: newUser.toSafeJSON() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
