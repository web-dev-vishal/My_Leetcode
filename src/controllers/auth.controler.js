// Import JWT library for token generation and verification
import jwt from "jsonwebtoken";
// Import bcrypt library for password hashing and comparison
import bcrypt from "bcryptjs";

// Import Mongoose models
import { User } from "../models/index.js";


// Register Controller
// Function to register a new user in the system
export const register = async (req, res) => {
  // Extract user details from request body
  const { email, password, name } = req.body;

  try {
    // Check if a user with this email already exists in database
    const existingUser = await User.findOne({ email });

    // If user already exists, return error
    if (existingUser) {
      return res.status(400).json({
        error: "User already exists",
      });
    }

    // Hash the password for security (never store plain text passwords)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user in database with hashed password
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'USER',
    });

    // Generate JWT token for authentication (valid for 7 days)
    const token = jwt.sign({ id: newUser._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Store JWT token in HTTP-only cookie for security
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== "development",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send success response with user details (excluding password)
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        image: newUser?.image,
      },
    });
  } catch (error) {
    // Log error to console for debugging
    console.error("Registration Error:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map(e => ({
          field: e.path,
          message: e.message,
        })),
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: `Duplicate value for ${field}`,
        field,
      });
    }
    
    // Send error response to the client
    res.status(500).json({ error: error.message });
  }
};


// Function to log in an existing user
export const login = async (req, res) => {
  // Extract email and password from request body
  const { email, password } = req.body;

  try {
    // Find user in database by email
    const user = await User.findOne({ email });

    // If user doesn't exist, return error
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare provided password with hashed password in database
    const isMatch = await bcrypt.compare(password, user.password);

    // If passwords don't match, return error
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Generate JWT token for authentication (valid for 7 days)
    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Store JWT token in HTTP-only cookie for security
    res.cookie("jwt", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== "development",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Send success response with user details (excluding password)
    res.status(200).json({
      message: "User login successfully",
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        image: user?.image,
      },
    });

  } catch (error) {
    // Log error to console for debugging
    console.error("Login Error:", error);
    // Send error response to the client
    res.status(500).json({ error: "Login failed" });
  }
};


// Function to log out the current user
export const logout = async (req, res) => {
  try {
    // Clear the JWT cookie to log out the user
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== "development",
    });
    // Send success response
    res.status(200).json({ success: true, message: "Logout successful" });

  } catch (error) {
    // Log error to console for debugging
    console.error("Logout Error:", error);
    // Send error response to the client
    res.status(500).json({ error: "Failed to logout" });
  }
};


// Function to check if user is authenticated (used by frontend to verify login status)
export const checkAuth = async (req, res) => {
  try {
    // Send success response with user details from request (set by auth middleware)
    res.status(200).json({
      success: true,
      message: "User authenticated successfully",
      user: req.user,
    });
  } catch (error) {
    // Log error to console for debugging
    console.error("Auth Check Error:", error);
    // Send error response to the client
    res.status(500).json({ error: "Failed to check authentication" });
  }
};
