// backend/src/models/messageModel.js
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true }, // match Session.sessionId
  role: { type: String, enum: ["user", "assistant", "system"], required: true },
  content: { type: String, required: true, trim: true },
  // timestamp: use createdAt provided by timestamps below
}, {
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" }
});

// Indexes help retrieving history fast
MessageSchema.index({ sessionId: 1, createdAt: 1 });

export default mongoose.model("Message", MessageSchema);
