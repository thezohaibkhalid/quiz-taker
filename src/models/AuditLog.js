import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "QtUser", default: null, index: true },
    action: { type: String, required: true, index: true },
    entity_type: { type: String, default: "" },
    entity_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    ip_address: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

export default mongoose.models.QtAuditLog || mongoose.model("QtAuditLog", auditLogSchema);
