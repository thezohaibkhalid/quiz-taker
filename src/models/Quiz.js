import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    subject_id: { type: mongoose.Schema.Types.ObjectId, ref: "QtSubject" },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "QtUser", required: true, index: true },
    duration_minutes: { type: Number, required: true, min: 1 },
    total_marks: { type: Number, default: 0 },
    pass_percentage: { type: Number, default: 50, min: 0, max: 100 },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    is_published: { type: Boolean, default: false, index: true },
    allow_single_attempt: { type: Boolean, default: true },
    randomize_questions: { type: Boolean, default: false },
    attachment_url: { type: String, default: "" },
    cover_image_url: { type: String, default: "" },
    results_announced: { type: Boolean, default: false },
    results_announced_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

quizSchema.virtual("question_count", {
  ref: "QtQuestion",
  localField: "_id",
  foreignField: "quiz_id",
  count: true,
});

quizSchema.set("toJSON", { virtuals: true });
quizSchema.set("toObject", { virtuals: true });

export default mongoose.models.QtQuiz || mongoose.model("QtQuiz", quizSchema);
