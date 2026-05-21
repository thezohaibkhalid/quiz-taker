import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    attempt_id: { type: mongoose.Schema.Types.ObjectId, ref: "Attempt", required: true, unique: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    total_marks: { type: Number, required: true },
    obtained_marks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "pass", "fail"],
      default: "pending",
      index: true,
    },
    announced: { type: Boolean, default: false, index: true },
    announced_at: { type: Date, default: null },
    feedback: { type: String, default: "" },
    needs_manual_grading: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.models.Result || mongoose.model("Result", resultSchema);
