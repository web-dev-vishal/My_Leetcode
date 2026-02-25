import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { rateLimiter } from "../lib/rateLimiter.js";
import {
    addProblemToPlayList,
    createPlayList,
    deletePlayList,
    getPlayAllListDetails,
    getPlayListDetails,
    removeProblemFromPlayList
} from "../controllers/playlist.controller.js";

const router = express.Router();

router.post("/create-playlist", authenticate, rateLimiter.middleware('api'), createPlayList);
router.get("/", authenticate, rateLimiter.middleware('api'), getPlayAllListDetails);
router.get("/:playlistId", authenticate, rateLimiter.middleware('api'), getPlayListDetails);
router.post("/:playlistId/add-problem", authenticate, rateLimiter.middleware('api'), addProblemToPlayList);
router.delete("/:playlistId", authenticate, rateLimiter.middleware('api'), deletePlayList);
router.delete("/:playlistId/remove-problem", authenticate, rateLimiter.middleware('api'), removeProblemFromPlayList);

export default router;