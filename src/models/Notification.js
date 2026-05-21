import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "QtUser", required: true, index: true },
    type: {
      type: String,
      enum: ["invite", "result", "system", "password_reset", "welcome"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    channel: {
      type: String,
      enum: ["email", "in_app"],
      default: "in_app",
    },
    is_read: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["sent", "failed", "pending"],
      default: "pending",
    },
    sent_at: { type: Date, default: null },
    related_quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: "QtQuiz", default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.models.QtNotification || mongoose.model("QtNotification", notificationSchema);
