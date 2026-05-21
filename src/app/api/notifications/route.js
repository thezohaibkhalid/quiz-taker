import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    await connectDB();
    const { user, error } = await requireAuth(req);
    if (error) return error;
    const items = await Notification.find({ user_id: user._id }).sort({ created_at: -1 }).limit(30).lean();
    const unread = items.filter((n) => !n.is_read).length;
    return NextResponse.json({ ok: true, items, unread });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req) {
  // Mark all as read
  try {
    await connectDB();
    const { user, error } = await requireAuth(req);
    if (error) return error;
    await Notification.updateMany({ user_id: user._id, is_read: false }, { $set: { is_read: true } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError(err);
  }
}
