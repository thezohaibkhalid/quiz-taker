import { NextResponse } from "next/server";
import { clearAuthCookie, getCurrentUser } from "@/lib/auth";
import { logAction, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const user = await getCurrentUser(req);
  clearAuthCookie();
  if (user) {
    await logAction({
      user_id: user._id,
      action: "user.logout",
      entity_type: "User",
      entity_id: user._id,
      ip_address: getClientIp(req),
    });
  }
  return NextResponse.json({ ok: true });
}
