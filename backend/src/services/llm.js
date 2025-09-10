import "dotenv/config";

async function interact(userMessage) {
  // Send conversation request to OpenRouter
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite", // you can change model here
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: userMessage }
        ]
      })
    }
  );

  const data = await response.json();

  if (data?.choices?.[0]?.finish_reason === "error") {
    console.error("Error talking to OpenRouter:", error);
    return "(error while generating response)";
  }

  const reply = data?.choices?.[0]?.message?.content;
  return reply;
}

export { interact };
