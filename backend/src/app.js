import express from "express";
import cors from "cors";

const app = express();

import apiRoutes from "./routes/apiRoutes.js";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// FIXME: temporary
app.use(cors());

app.use("/api", apiRoutes);

export default app;
