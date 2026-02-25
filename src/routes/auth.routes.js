import express from "express";
import { checkAuth, login, logout, register } from "../controllers/auth.controler.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { rateLimiter } from "../lib/rateLimiter.js";

const router = express.Router();

router.post("/register", rateLimiter.middleware('auth'), register);
router.post("/login", rateLimiter.middleware('auth'), login);
router.post("/logout", authenticate, logout);
router.get("/check", authenticate, checkAuth);

export default router;