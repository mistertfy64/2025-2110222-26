import express from "express";

// import fetch from "node-fetch";

export const addMessage = async (req, res) => {
  try {
    const userMessage = req.body.message;

    // Send conversation request to OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer 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`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",  // you can change model here
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: userMessage },
        ],
      }),
    });

    const data = await response.json();

    const reply = data?.choices?.[0]?.message?.content || "No reply from model.";

    res.status(200).json({
      user: userMessage,
      reply: reply,
    });
  } catch (error) {
    console.error("Error talking to OpenRouter:", error);
    res.status(500).json({ error: "Failed to talk to AI model" });
  }
};
