import express from "express"; 
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import authRouter from "./routes/auth.routes.js";
import problemRoutes from "./routes/problem.routes.js"
import executecodeRoutes from "./routes/executeCode.routes.js";
import submissionsRoutes from "./routes/submission.routes.js";
import playListroutes from "./routes/playlist.routes.js";
                                                                                                                                                                                                                                                                                                                                                                                       
dotenv.config({ path: {debug: true} });

const app = express();

const PORT = process.env.PORT || 8080;

// Connect to MongoDB
await connectDB();

// Middlewares
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser())

app.get('/', (req, res) => {
    res.json({ 
        success: true ,
        message: "Welcome to leetcode api"
    })
})

app.use("/api/v1/auth" , authRouter);
app.use('/api/v1/problems', problemRoutes);
app.use("/api/v1/execute-code", executecodeRoutes);
app.use("/api/v1/submission", submissionsRoutes);
app.use("/api/v1/playlist",playListroutes);

// Error handler middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () =>{ 
    console.log(`Example app listening at http://localhost:${PORT}`)
})