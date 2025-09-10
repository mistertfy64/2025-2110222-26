import app from "./app.js";

const PORT = 39399;
app.listen(PORT, "0.0.0.0", () => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw Error("No OpenRouter API key supplied.");
  }
  console.log(`Backend Server ready at http://localhost:${PORT}`);
});
