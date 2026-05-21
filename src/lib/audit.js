import { connectDB } from "./db";
import AuditLog from "@/models/AuditLog";

export async function logAction({ user_id = null, action, entity_type = "", entity_id = null, ip_address = "", metadata = {} } = {}) {
  try {
    await connectDB();
    await AuditLog.create({ user_id, action, entity_type, entity_id, ip_address, metadata });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[audit] failed:", err.message);
  }
}

export function getClientIp(req) {
  if (!req?.headers) return "";
  const fwd = req.headers.get?.("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get?.("x-real-ip") || "";
}
