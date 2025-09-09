import express from "express";
const router = express.Router();

import * as apiController from "../controllers/apiController.js";

router.post("/message", apiController.addMessage);

export default router;
