import { interact } from "../services/llm.js";

const MAXIMUM_LENGTH = 1024;

export const addMessage = async (req, res) => {
  const userMessage = req.body.message;

  if (!validateMessage(userMessage)) {
    console.warn("User tried to send empty or too long message.");
    res.status(400).json({ error: "Message is empty or too long." });
    return;
  }

  try {
    const reply = await interact(userMessage);
    res.status(200).json({
      user: userMessage,
      reply: reply?.message ?? "(no response)",
      emotion: reply?.emotion ?? null
    });
  } catch (error) {
    console.error("Error talking to OpenRouter:", error);
    res.status(500).json({ error: "Failed to talk to AI model" });
  }
};

function validateMessage(message) {
  if (typeof message !== "string") {
    return false;
  }
  const formatted = message.trim();
  return formatted.length > 0 && formatted.length <= MAXIMUM_LENGTH;
}
