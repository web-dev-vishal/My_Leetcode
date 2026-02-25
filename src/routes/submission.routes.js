import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { rateLimiter } from "../lib/rateLimiter.js";
import { getAllSubmissions, getAllSubmissionsFroProblem, getAllTheSubmissionsForProblem } from "../controllers/submission.controller.js";

const router = express.Router();

router.get("/get-all-submission", authenticate, rateLimiter.middleware('api'), getAllSubmissions);
router.get("/get-submissions/:problemid", authenticate, rateLimiter.middleware('api'), getAllSubmissionsFroProblem);
router.get("/get-submissions-count/:problemid", authenticate, rateLimiter.middleware('api'), getAllTheSubmissionsForProblem);

export default router;