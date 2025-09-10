import app from "./app.js";
import connectDB from "./services/db.js";

const PORT = process.env.PORT || 39399;

connectDB()
  .then(() => {
    if (!process.env.OPENROUTER_API_KEY) {
      throw Error("No OpenRouter API key supplied.");
    }
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Backend Server ready at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server due to DB error:", err);
    process.exit(1);
  });
