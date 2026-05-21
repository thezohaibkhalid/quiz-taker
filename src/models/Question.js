import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: "QtQuiz", required: true, index: true },
    question_text: { type: String, required: true },
    type: {
      type: String,
      enum: ["mcq", "true_false", "short"],
      required: true,
    },
    options: { type: [String], default: [] },
    correct_option: { type: String, default: "" },
    marks: { type: Number, default: 1, min: 0 },
    order: { type: Number, default: 0 },
    image_url: { type: String, default: "" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

questionSchema.methods.toStudentJSON = function () {
  return {
    _id: this._id,
    quiz_id: this.quiz_id,
    question_text: this.question_text,
    type: this.type,
    options: this.options,
    marks: this.marks,
    order: this.order,
    image_url: this.image_url,
  };
};

export default mongoose.models.QtQuestion || mongoose.model("QtQuestion", questionSchema);
