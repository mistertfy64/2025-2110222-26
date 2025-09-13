import "dotenv/config";

async function interact(userMessage) {
  // Send conversation request to OpenRouter
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite", // you can change model here
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: userMessage }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                emotion: {
                  type: "object",
                  properties: {
                    arousal: {
                      type: "number",
                      description:
                        "The magnitude of arousal-like feelings that the response evokes, that is, the degree of stimulation that the response evokes. Magnitude must be between -1 and +1, inclusive, where -1 indicates no arousal-like feelings, and +1 includes maximal arousal-like feelings."
                    },
                    valence: {
                      type: "number",
                      description:
                        "The magnitude of positive-valence-like feelings that the response evokes, that is, the degree of the positivity that the response evokes. Magnitude must be between -1 and +1, inclusive, where -1 indicates extremely negative feelings, and +1 includes extremely positive feelings."
                    }
                  }
                },
                message: {
                  type: "string",
                  description:
                    "What the model would reply with, without markdown formatting."
                }
              },
              required: ["emotion", "message"],
              additionalProperties: false
            }
          }
        },
        max_tokens: 1234
      })
    }
  );

  if (!response.ok) {
    console.error(`OpenRouter HTTP ${response.status}`);
    return { message: "(error while generating response)" };
  }

  const data = await response.json();

  if (!data?.choices?.[0]?.message?.content) {
    console.error("OpenRouter object not complete");
    return { message: "(error while generating response)" };
  }

  if (data?.choices?.[0]?.finish_reason === "error") {
    console.error("Error talking to OpenRouter: (finish_reason=error)", data);
    return { message: "(error while generating response)" };
  }

  try {
    const reply = JSON.parse(data?.choices?.[0]?.message?.content);
    return reply;
  } catch (error) {
    console.error("Failed to parse model JSON:", error);
    return { message: "(error while generating response)" };
  }
}

export { interact };
