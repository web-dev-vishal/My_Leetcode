import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { executeCode, getSubmissionStatus } from "../controllers/executeCode.controller.js";

const router = express.Router();

router.post("/", authenticate, executeCode);
router.get("/status/:submissionId", authenticate, getSubmissionStatus);

export default router;