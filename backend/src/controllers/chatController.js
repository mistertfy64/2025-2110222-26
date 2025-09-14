import * as chatService from "../services/chatService.js";
import Session from "../models/sessionModel.js";
import Message from "../models/messageModel.js";
import { interact } from "../services/llm.js";

const MAXIMUM_LENGTH = 1024;

function validateMessage(message) {
  if (typeof message !== "string") return false;
  const formatted = message.trim();
  return formatted.length > 0 && formatted.length <= MAXIMUM_LENGTH;
}

export async function createSessionHandler(req, res) {
  try {
    const sessionId = await chatService.createSession();
    return res.status(201).json({ sessionId });
  } catch (err) {
    console.error("createSession error:", err);
    return res.status(500).json({ error: "Failed to create session" });
  }
}

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
    const saved = await chatService.addMessageToSession(
      sessionId,
      role,
      content,
      { createIfNotExist: true }
    );
    return res.status(201).json(saved);
  } catch (err) {
    console.error("saveMessageHandler:", err);
    return res
      .status(500)
      .json({ error: err.message ?? "Failed to save message" });
  }
}

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

export async function saveUserMessageHandler(req, res) {
  try {
    let { sessionId, message } = req.body;

    // Trim whitespace
    message = (message || "").trim();

    if (!validateMessage(message)) {
      return res.status(400).json({ error: "Message empty or too long." });
    }

    // Ensure a session exists
    if (!sessionId) {
      sessionId = await chatService.createSession();
    } else {
      await chatService.ensureSession(sessionId);
    }

    const sentTimestamp = Date.now();

    // Save the message
    await chatService.addMessageToSession(sessionId, "user", message, {
      createIfNotExist: true,
      sent: sentTimestamp
    });

    // Respond with useful info
    return res.status(200).json({
      status: "OK",
      sessionId,
      message: {
        role: "user",
        content: message,
        createdAt: sentTimestamp
      }
    });
  } catch (err) {
    console.error("saveUserMessageHandler:", err);
    return res
      .status(500)
      .json({ error: "Failed to process message", details: err.message });
  }
}

export async function addMessageAndGetReplyHandler(req, res) {
  try {
    let { sessionId, message } = req.body;

    if (!validateMessage(message)) {
      return res.status(400).json({ error: "Message empty or too long." });
    }

    if (!sessionId) {
      sessionId = await chatService.createSession();
    } else {
      await chatService.ensureSession(sessionId);
    }
    const sentTimestamp = Date.now();

    const reply = await interact(message,sessionId);
    const replyTimestamp = Date.now();
    await chatService.addMessageToSession(
      sessionId,
      "assistant",
      reply.message ?? "(no response)",
      {
        sent: replyTimestamp,
        thinkingDuration: replyTimestamp - sentTimestamp
      }
    );

    return res.status(200).json({ sessionId, reply });
  } catch (err) {
    console.error("addMessageAndGetReplyHandler:", err);
    return res.status(500).json({ error: "Failed to process message" });
  }
}

export async function changeSessionDataHandler(req, res) {
  try {
    const target = req.params.sessionId;
    const session = await Session.findOne({ sessionId: target });
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (req.body.newName.length < 0 || req.body.newName.length > 48) {
      return res.status(400).json({ error: "Invalid chat name." });
    }

    const COLOR_REGEX = /^\#[0-9a-f]{6}$/;
    if (!COLOR_REGEX.test(req.body.newColor)) {
      return res.status(400).json({ error: "Invalid chat color." });
    }

    session.name = req.body.newName ?? "Unnamed chat";
    session.color = req.body.newColor ?? "#1a1a1a";

    await session.save();
    res.status(200).json({ message: "OK" });
  } catch (error) {
    console.error("Failed to delete session: ", error);
    return res.status(500).json({ error: "Failed to update session." });
  }
}

export async function getSessionDataHandler(req, res) {
  const target = req.params.sessionId;
  const session = await Session.findOne({ sessionId: target }).lean();
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }
  res.status(200).json(session);
}

export async function listSessionsHandler(req, res) {
  const sessions = await Session.find({}).sort({ updatedAt: -1 }).lean();
  return res.json(
    sessions.map((s) => ({
      sessionId: s.sessionId,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      name: s.name ?? "Unnamed chat",
      color: s.color ?? "#1a1a1a",
      meta: s.meta
    }))
  );
}

export async function deleteSessionHandler(req, res) {
  try {
    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    const target = req.params.sessionId;
    if (!UUID_REGEX.test(target)) {
      return res.status(400).json({ error: "Bad Request." });
    }
    const session = await Session.findOne({ sessionId: target });
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }
    await Message.deleteMany({ sessionId: target });
    await Session.deleteOne({ sessionId: target });
    res.status(204).end();
  } catch (error) {
    console.error("Failed to delete session: ", error);
    return res.status(500).json({ error: "Failed to delete session." });
  }
}
