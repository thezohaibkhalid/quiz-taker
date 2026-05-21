import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { logAction, getClientIp } from "@/lib/audit";
import { isEmail, isStrongPassword } from "@/lib/validate";
import { bootstrapAdmin } from "@/lib/bootstrap";
import { rateLimit, ipKey } from "@/lib/rate-limit";
import { tooManyRequests, apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const rl = rateLimit({ key: ipKey(req, "register"), max: 5, windowMs: 60_000 });
    if (!rl.ok) return tooManyRequests(rl.retryAfterMs);

    await bootstrapAdmin();
    await connectDB();
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ ok: false, error: "Name, email and password are required" }, { status: 400 });
    }
    if (!isEmail(email)) return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    if (!isStrongPassword(password)) return NextResponse.json({ ok: false, error: "Password must be at least 8 characters" }, { status: 400 });

    const safeRole = ["student", "teacher"].includes(role) ? role : "student";
    const lowerEmail = String(email).toLowerCase().trim();

    const exists = await User.findOne({ email: lowerEmail });
    if (exists) return NextResponse.json({ ok: false, error: "Email already registered" }, { status: 409 });

    const password_hash = await hashPassword(password);
    const verification_token = crypto.randomBytes(32).toString("hex");
    const verification_token_expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const user = await User.create({
      name: name.trim(),
      email: lowerEmail,
      password_hash,
      role: safeRole,
      verification_token,
      verification_token_expires,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/verify-email?token=${verification_token}`;
    const { subject, html } = welcomeEmail({ name: user.name, verifyUrl });
    sendEmail({ to: user.email, subject, html }).catch(() => {});

    await logAction({
      user_id: user._id,
      action: "user.register",
      entity_type: "User",
      entity_id: user._id,
      ip_address: getClientIp(req),
      metadata: { role: safeRole },
    });

    return NextResponse.json({ ok: true, user: user.toSafeJSON(), message: "Account created. Please check your email to verify." });
  } catch (err) {
    return apiError(err);
  }
}
