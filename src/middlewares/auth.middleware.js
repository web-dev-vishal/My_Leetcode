import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.jwt; // Assuming the cookie name is 'jwt'

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No Token Provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.id).select('_id image name email role');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Convert _id to id for consistency with frontend
    req.user = {
      id: user._id.toString(),
      image: user.image,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    console.error("Error in authenticate middleware:", error.message);
    
    // Handle CastError for invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('role');

    if (!user || user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Access denied. User is not an admin." });
    }

    next()
  } catch (error) {
    console.error("Error in checkAdmin middleware:", error.message);
    
    // Handle CastError for invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    
    res.status(500).json({ message: "Internal Server Error" });
  }
};