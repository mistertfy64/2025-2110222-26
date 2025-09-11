import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true
    },
    content: { type: String, required: true, trim: true },
    timings: {
      sent: { type: Date },
      thinkingDuration: { type: Number }
    }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
  }
);

MessageSchema.index({ sessionId: 1, createdAt: 1 });

export default mongoose.model("Message", MessageSchema);
