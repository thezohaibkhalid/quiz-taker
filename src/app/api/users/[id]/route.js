import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { logAction, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { user: actor, error } = await requireAuth(req, ["admin"]);
    if (error) return error;
    const body = await req.json();
    const user = await User.findById(params.id);
    if (!user) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    if (body.role && ["student", "teacher", "admin"].includes(body.role)) user.role = body.role;
    if (typeof body.is_active === "boolean") user.is_active = body.is_active;
    if (typeof body.is_verified === "boolean") user.is_verified = body.is_verified;
    if (body.name) user.name = body.name.trim();
    await user.save();

    await logAction({
      user_id: actor._id,
      action: "admin.user.update",
      entity_type: "User",
      entity_id: user._id,
      ip_address: getClientIp(req),
      metadata: body,
    });

    return NextResponse.json({ ok: true, user: user.toSafeJSON() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { user: actor, error } = await requireAuth(req, ["admin"]);
    if (error) return error;
    if (actor._id.toString() === params.id) {
      return NextResponse.json({ ok: false, error: "Cannot delete your own account" }, { status: 400 });
    }
    await User.findByIdAndDelete(params.id);
    await logAction({
      user_id: actor._id,
      action: "admin.user.delete",
      entity_type: "User",
      entity_id: params.id,
      ip_address: getClientIp(req),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
