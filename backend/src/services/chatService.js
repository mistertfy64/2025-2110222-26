// backend/src/services/chatService.js
import { v4 as uuidv4 } from "uuid";
import Session from "../models/sessionModel.js";
import Message from "../models/messageModel.js";

/**
 * Create a new session and return its sessionId
 */
export async function createSession(initialMeta = {}) {
  const sessionId = uuidv4();
  const session = new Session({ sessionId, meta: initialMeta });
  await session.save();
  return sessionId;
}

/**
 * Add a message to a session. If session doesn't exist, optionally create it (false by default).
 * Returns the saved message document.
 */
export async function addMessageToSession(sessionId, role, content, { createIfNotExist = false } = {}) {
  if (!sessionId) throw new Error("sessionId required");
  if (createIfNotExist) {
    await Session.findOneAndUpdate(
      { sessionId },
      { $setOnInsert: { sessionId } },
      { upsert: true, new: true }
    );
  } else {
    const sessionExists = await Session.exists({ sessionId });
    if (!sessionExists) {
      throw new Error("Session not found");
    }
  }

  const msg = new Message({ sessionId, role, content });
  await msg.save();
  return msg.toObject();
}

/**
 * Get all messages for a session, sorted by creation time ascending.
 * You can add pagination with skip/limit if histories get large.
 */
export async function getSessionMessages(sessionId) {
  return Message.find({ sessionId }).sort({ createdAt: 1 }).lean();
}

/**
 * Optional helper: delete a session and its messages
 */
export async function deleteSession(sessionId) {
  await Message.deleteMany({ sessionId });
  await Session.deleteOne({ sessionId });
  return true;
}
