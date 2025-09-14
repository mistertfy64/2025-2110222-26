const express = require("express");
const app = express();

app.use(express.static("public"));

const PORT = 2222;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Frontend Server ready at http://localhost:${PORT}`);
});
