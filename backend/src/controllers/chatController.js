// backend/src/controllers/chatController.js
import * as chatService from "../services/chatService.js";
import { interact } from "../services/llm.js"; // your existing llm function

const MAXIMUM_LENGTH = 1024;

function validateMessage(message) {
  if (typeof message !== "string") return false;
  const formatted = message.trim();
  return formatted.length > 0 && formatted.length <= MAXIMUM_LENGTH;
}

/**
 * POST /api/sessions
 * creates a session and returns { sessionId }
 */
export async function createSessionHandler(req, res) {
  try {
    const sessionId = await chatService.createSession();
    return res.status(201).json({ sessionId });
  } catch (err) {
    console.error("createSession error:", err);
    return res.status(500).json({ error: "Failed to create session" });
  }
}

/**
 * POST /api/sessions/:sessionId/messages
 * body: { role, content }
 * Saves a message to DB and returns saved message
 */
export async function saveMessageHandler(req, res) {
  try {
    const { sessionId } = req.params;
    const { role, content } = req.body;
    if (!["user", "assistant", "system"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (!validateMessage(content)) {
      return res.status(400).json({ error: "Message empty or too long" });
    }
    const saved = await chatService.addMessageToSession(sessionId, role, content, { createIfNotExist: true });
    return res.status(201).json(saved);
  } catch (err) {
    console.error("saveMessageHandler:", err);
    return res.status(500).json({ error: err.message ?? "Failed to save message" });
  }
}

/**
 * GET /api/sessions/:sessionId/messages
 * returns full message history for session
 */
export async function getSessionMessagesHandler(req, res) {
  try {
    const { sessionId } = req.params;
    const messages = await chatService.getSessionMessages(sessionId);
    return res.status(200).json({ sessionId, messages });
  } catch (err) {
    console.error("getSessionMessages:", err);
    return res.status(500).json({ error: "Failed to get session messages" });
  }
}

/**
 * Convenience endpoint that ties into OpenRouter:
 * POST /api/message
 * body: { sessionId, message } // sessionId optional
 *
 * Behavior:
 * - if sessionId missing: create one
 * - store the user's message
 * - call OpenRouter via interact()
 * - store assistant response
 * - return { sessionId, reply }
 */
export async function addMessageAndGetReplyHandler(req, res) {
  try {
    let { sessionId, message } = req.body;
    if (!validateMessage(message)) {
      return res.status(400).json({ error: "Message empty or too long." });
    }

    // create session if not provided
    if (!sessionId) {
      sessionId = await chatService.createSession();
    } else {
      // ensure session exists
      await chatService.addMessageToSession(sessionId, "system", "(session init)", { createIfNotExist: true });
      // we added a system message just to upsert the session (optional)
    }

    // save the user message
    await chatService.addMessageToSession(sessionId, "user", message, { createIfNotExist: true });

    // call LLM
    const reply = await interact(message);

    // store the assistant reply
    await chatService.addMessageToSession(sessionId, "assistant", reply ?? "(no response)");

    return res.status(200).json({ sessionId, reply });
  } catch (err) {
    console.error("addMessageAndGetReplyHandler:", err);
    return res.status(500).json({ error: "Failed to process message" });
  }
}
