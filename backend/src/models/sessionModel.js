import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 48,
      default: function () {
        return `New chat on ${new Date().toISOString()}`;
      }
    },
    color: { type: String, default: "#1a1a1a" }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

export default mongoose.model("Session", SessionSchema);
