import express from "express";
const router = express.Router();

// keep your existing controller import if you still want it
// import * as apiController from "../controllers/apiController.js";
import * as chatController from "../controllers/chatController.js";

// Create a new session
router.post("/sessions", chatController.createSessionHandler);

// Save a message to a session
router.post("/sessions/:sessionId/messages", chatController.saveMessageHandler);

// Change a session's info (e.g. name)
router.put("/sessions/:sessionId", chatController.changeSessionDataHandler);

// Get all messages for a session
router.get(
  "/sessions/:sessionId/messages",
  chatController.getSessionMessagesHandler
);

// List all session
router.get("/sessions", chatController.listSessionsHandler);

// Existing single endpoint that integrates saving + LLM reply
router.post("/message", chatController.addMessageAndGetReplyHandler);

export default router;
