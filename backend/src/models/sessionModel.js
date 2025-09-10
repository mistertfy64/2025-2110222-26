// backend/src/models/sessionModel.js
import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true }, // UUID string
  // optional fields:
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // flexibility
}, {
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
});

// Add index on sessionId (unique ensures fast lookup)
SessionSchema.index({ sessionId: 1 }, { unique: true });

export default mongoose.model("Session", SessionSchema);
