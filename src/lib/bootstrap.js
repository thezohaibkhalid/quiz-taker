import { connectDB } from "./db";
import User from "@/models/User";
import { hashPassword } from "./auth";

let bootstrapped = false;

export async function bootstrapAdmin() {
  if (bootstrapped) return;
  bootstrapped = true;
  try {
    await connectDB();
    const email = (process.env.ADMIN_EMAIL || "admin@quizsystem.local").toLowerCase();
    const exists = await User.findOne({ email });
    if (exists) return;
    const hash = await hashPassword(
      process.env.ADMIN_PASSWORD || process.env.ADMIN_DEFAULT_PASSWORD || "ChangeMe!2026"
    );
    await User.create({
      name: process.env.ADMIN_NAME || "System Administrator",
      email,
      password_hash: hash,
      role: "admin",
      is_verified: true,
      is_active: true,
    });
    // eslint-disable-next-line no-console
    console.log(`[bootstrap] Admin account created: ${email}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[bootstrap] failed:", err.message);
  }
}
