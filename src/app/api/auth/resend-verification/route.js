import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { rateLimit, ipKey } from "@/lib/rate-limit";
import { tooManyRequests, apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const rl = rateLimit({ key: ipKey(req, "resend-verify"), max: 3, windowMs: 5 * 60_000 });
    if (!rl.ok) return tooManyRequests(rl.retryAfterMs);

    await connectDB();
    const me = await getCurrentUser(req);
    if (!me) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });
    if (me.is_verified) return NextResponse.json({ ok: true, message: "Email already verified" });

    const token = crypto.randomBytes(32).toString("hex");
    const fresh = await User.findById(me._id);
    fresh.verification_token = token;
    fresh.verification_token_expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await fresh.save();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;
    const { subject, html } = welcomeEmail({ name: fresh.name, verifyUrl });
    sendEmail({ to: fresh.email, subject, html }).catch(() => {});

    return NextResponse.json({ ok: true, message: "Verification email sent" });
  } catch (err) {
    return apiError(err);
  }
}
