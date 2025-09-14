import app from "./app.js";
import connectDB from "./services/db.js";

const PORT = process.env.PORT || 22222;

app.listen(PORT, "0.0.0.0", () => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw Error("No OpenRouter API key supplied.");
  }
  connectDB();
  console.log(`Backend Server ready at http://localhost:${PORT}`);
});
