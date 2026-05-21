import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question_id: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    answer: { type: String, default: "" },
    is_correct: { type: Boolean, default: null },
    awarded_marks: { type: Number, default: 0 },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    answers: { type: [answerSchema], default: [] },
    draft_answers: { type: Map, of: String, default: {} },
    started_at: { type: Date, default: Date.now },
    submitted_at: { type: Date, default: null },
    time_taken_seconds: { type: Number, default: 0 },
    is_completed: { type: Boolean, default: false },
    tab_switches: { type: Number, default: 0 },
    auto_submitted: { type: Boolean, default: false },
    last_saved_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

attemptSchema.index({ student_id: 1, quiz_id: 1 }, { unique: false });

export default mongoose.models.Attempt || mongoose.model("Attempt", attemptSchema);
