import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAuth, hashPassword, verifyPassword } from "@/lib/auth";
import { isStrongPassword } from "@/lib/validate";
import { logAction, getClientIp } from "@/lib/audit";
import { apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function PATCH(req) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req);
    if (error) return error;
    const body = await req.json();
    if (body.name) user.name = String(body.name).trim();
    if (typeof body.avatar_url === "string") user.avatar_url = body.avatar_url;
    await user.save();

    await logAction({
      user_id: user._id,
      action: "profile.update",
      entity_type: "User",
      entity_id: user._id,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ ok: true, user: user.toSafeJSON() });
  } catch (err) {
    return apiError(err);
  }
}

export async function PUT(req) {
  // Change password
  try {
    await connectDB();
    const { user, error } = await requireAuth(req);
    if (error) return error;
    const { current_password, new_password } = await req.json();
    if (!current_password || !new_password) {
      return NextResponse.json({ ok: false, error: "Current and new password are required" }, { status: 400 });
    }
    if (!isStrongPassword(new_password)) {
      return NextResponse.json({ ok: false, error: "New password must be at least 8 characters" }, { status: 400 });
    }
    const fresh = await User.findById(user._id).select("+password_hash");
    const ok = await verifyPassword(current_password, fresh.password_hash);
    if (!ok) return NextResponse.json({ ok: false, error: "Current password is incorrect" }, { status: 400 });
    fresh.password_hash = await hashPassword(new_password);
    await fresh.save();

    await logAction({
      user_id: user._id,
      action: "profile.change_password",
      entity_type: "User",
      entity_id: user._id,
      ip_address: getClientIp(req),
    });

    return NextResponse.json({ ok: true, message: "Password updated" });
  } catch (err) {
    return apiError(err);
  }
}
