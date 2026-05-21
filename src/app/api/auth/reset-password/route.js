import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { isStrongPassword } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await connectDB();
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ ok: false, error: "Token and password are required" }, { status: 400 });
    if (!isStrongPassword(password)) return NextResponse.json({ ok: false, error: "Password must be at least 8 characters" }, { status: 400 });

    const user = await User.findOne({
      reset_token: token,
      reset_token_expires: { $gt: new Date() },
    }).select("+reset_token +reset_token_expires");

    if (!user) return NextResponse.json({ ok: false, error: "Invalid or expired token" }, { status: 400 });

    user.password_hash = await hashPassword(password);
    user.reset_token = null;
    user.reset_token_expires = null;
    await user.save();

    return NextResponse.json({ ok: true, message: "Password reset successful. You can log in now." });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
