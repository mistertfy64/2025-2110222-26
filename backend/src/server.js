import app from "./app.js";
import connectDB from "./services/db.js";
import fs from "fs";
import path from "path";

const PORT = process.env.PORT || 22222;
const SYSTEM_PROMPT = {
  content: ""
};

app.listen(PORT, "0.0.0.0", () => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw Error("No OpenRouter API key supplied.");
  }
  connectDB();
  try {
    const buffer = fs.readFileSync(
      path.join(import.meta.dirname, "system-prompt.txt")
    );
    const prompt = buffer.toString();
    SYSTEM_PROMPT.content = prompt;
    console.log(`Loaded system prompt.`);
  } catch (error) {
    console.error("Failed to load system prompt: ", error);
  }
  console.log(`Backend Server ready at http://localhost:${PORT}`);
});

export { SYSTEM_PROMPT };
