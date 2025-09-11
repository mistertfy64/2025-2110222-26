import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    name: { type: String, required: true },
    color: { type: String }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

export default mongoose.model("Session", SessionSchema);
