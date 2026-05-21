import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password_hash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
      index: true,
    },
    is_verified: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    avatar_url: { type: String, default: "" },
    verification_token: { type: String, default: null, select: false },
    verification_token_expires: { type: Date, default: null, select: false },
    reset_token: { type: String, default: null, select: false },
    reset_token_expires: { type: Date, default: null, select: false },
    last_login: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

userSchema.methods.toSafeJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    is_verified: this.is_verified,
    is_active: this.is_active,
    avatar_url: this.avatar_url,
    created_at: this.created_at,
  };
};

export default mongoose.models.User || mongoose.model("User", userSchema);
