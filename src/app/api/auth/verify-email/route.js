import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });

    const user = await User.findOne({
      verification_token: token,
      verification_token_expires: { $gt: new Date() },
    }).select("+verification_token +verification_token_expires");

    if (!user) return NextResponse.json({ ok: false, error: "Invalid or expired token" }, { status: 400 });

    user.is_verified = true;
    user.verification_token = null;
    user.verification_token_expires = null;
    await user.save();

    return NextResponse.json({ ok: true, message: "Email verified successfully" });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
