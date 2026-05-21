import { v2 as cloudinary } from "cloudinary";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

const FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER || "quiz-system";

export async function uploadBuffer(buffer, { folder = FOLDER, resource_type = "auto", filename } = {}) {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
        public_id: filename ? `${Date.now()}_${filename.replace(/\.[^.]+$/, "")}` : undefined,
        overwrite: false,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function deleteAsset(publicId, resource_type = "image") {
  ensureConfigured();
  return cloudinary.uploader.destroy(publicId, { resource_type });
}

export default cloudinary;
