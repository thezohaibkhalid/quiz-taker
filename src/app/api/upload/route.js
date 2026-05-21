import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { uploadBuffer } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req) {
  try {
    const { user, error } = await requireAuth(req);
    if (error) return error;

    const form = await req.formData();
    const file = form.get("file");
    const purpose = (form.get("purpose") || "general").toString();

    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 10) {
      return NextResponse.json({ ok: false, error: "File exceeds 10MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const folder = `${process.env.CLOUDINARY_UPLOAD_FOLDER || "quiz-system"}/${user.role}/${purpose}`;
    const result = await uploadBuffer(buffer, { folder, filename: file.name });

    return NextResponse.json({
      ok: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format: result.format,
      resource_type: result.resource_type,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
