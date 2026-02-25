import express from "express";
import { authenticate, checkAdmin } from "../middlewares/auth.middleware.js";
import { rateLimiter } from "../lib/rateLimiter.js";
import {
    createProblem,
    deleteProblem,
    getAllProblems,
    getAllProblemSolvedByUser,
    getProblemById,
    updateProblem
} from "../controllers/problem.contoler.js";

const router = express.Router();

router.post("/create-problem", authenticate, checkAdmin, rateLimiter.middleware('api'), createProblem);
router.get("/get-all-problems", authenticate, rateLimiter.middleware('api'), getAllProblems);
router.get("/get-problem/:id", rateLimiter.middleware('api'), getProblemById);
router.put("/update-problem/:id", authenticate, checkAdmin, rateLimiter.middleware('api'), updateProblem);
router.delete("/delete-problem/:id", authenticate, checkAdmin, rateLimiter.middleware('api'), deleteProblem);
router.get("/get-solved-problem", authenticate, rateLimiter.middleware('api'), getAllProblemSolvedByUser);

export default router;