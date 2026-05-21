import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";
import { logAction, getClientIp } from "@/lib/audit";
import { bootstrapAdmin } from "@/lib/bootstrap";
import { rateLimit, ipKey } from "@/lib/rate-limit";
import { tooManyRequests, apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const rl = rateLimit({ key: ipKey(req, "login"), max: 8, windowMs: 60_000 });
    if (!rl.ok) return tooManyRequests(rl.retryAfterMs);

    await bootstrapAdmin();
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email and password are required" }, { status: 400 });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password_hash");
    if (!user || !user.is_active) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      await logAction({
        user_id: user._id,
        action: "user.login.failed",
        entity_type: "User",
        entity_id: user._id,
        ip_address: getClientIp(req),
      });
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    user.last_login = new Date();
    await user.save();

    const token = signToken({ userId: user._id.toString(), role: user.role });
    setAuthCookie(token);

    await logAction({
      user_id: user._id,
      action: "user.login",
      entity_type: "User",
      entity_id: user._id,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ ok: true, token, user: user.toSafeJSON() });
  } catch (err) {
    return apiError(err);
  }
}
