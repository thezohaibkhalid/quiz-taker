import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { rateLimit, ipKey } from "@/lib/rate-limit";
import { tooManyRequests, apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const rl = rateLimit({ key: ipKey(req, "forgot"), max: 5, windowMs: 60_000 });
    if (!rl.ok) return tooManyRequests(rl.retryAfterMs);

    await connectDB();
    const { email } = await req.json();
    if (!email) return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    // Always respond OK to avoid revealing account existence.
    if (!user) return NextResponse.json({ ok: true, message: "If that account exists, a reset link was sent." });

    const token = crypto.randomBytes(32).toString("hex");
    user.reset_token = token;
    user.reset_token_expires = new Date(Date.now() + 1000 * 60 * 60);
    await user.save();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    const { subject, html } = passwordResetEmail({ name: user.name, resetUrl });
    sendEmail({ to: user.email, subject, html }).catch(() => {});

    return NextResponse.json({ ok: true, message: "If that account exists, a reset link was sent." });
  } catch (err) {
    return apiError(err);
  }
}
