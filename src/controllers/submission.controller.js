// Import Mongoose models
import { Submission } from "../models/index.js";

// Function to get all submissions made by the current logged-in user
export const getAllSubmissions = async (req, res) => {
    try {
        // Get the logged-in user's ID from the request
        const userId = req.user.id;
        
        // Fetch all submissions from database that belong to this user
        const submissions = await Submission.find({ userId }).lean();
        
        // Convert _id to id for each submission
        const submissionsWithId = submissions.map(sub => ({
            ...sub,
            id: sub._id.toString(),
        }));

        // Send success response with all user's submissions
        res.status(200).json({ 
            success: true, 
            message: "Submissions fetched successfully", 
            submissions: submissionsWithId 
        });
    } catch (error) {
        // Log error to console for debugging
        console.log("Fetch submissions error:", error);
        // Send error response to the client
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
};


// Function to get all submissions made by current user for a specific problem
export const getAllSubmissionsFroProblem = async (req, res) => {
    try {
        // Get the logged-in user's ID from the request
        const userId = req.user.id;
        // Extract problem ID from URL parameters
        const problemId = req.params.problemId;
        
        // Fetch submissions that match both user ID and problem ID
        const submissions = await Submission.find({ 
            userId, 
            problemId 
        }).lean();
        
        // Convert _id to id for each submission
        const submissionsWithId = submissions.map(sub => ({
            ...sub,
            id: sub._id.toString(),
        }));

        // Send success response with filtered submissions
        res.status(200).json({
            success: true,
            message: "Submissions fetched successfully", 
            submissions: submissionsWithId,
        });
    } catch (error) {
        // Log error to console for debugging
        console.log("Fetch submissions error:", error);
        
        // Handle CastError for invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid problem ID format' });
        }
        
        // Send error response to the client
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
};


// Function to get the total count of all submissions for a specific problem (by all users)
export const getAllTheSubmissionsForProblem = async (req, res) => {
    try {
        // Extract problem ID from URL parameters
        const problemId = req.params.problemId;
        
        // Count total number of submissions for this problem
        const count = await Submission.countDocuments({ problemId });

        // Send success response with submission count
        res.status(200).json({
            success: true,
            message: "Submissions count fetched successfully",
            count,
        });
    } catch (error) {
        // Log error to console for debugging
        console.log("Fetch submissions error:", error);
        
        // Handle CastError for invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid problem ID format' });
        }
        
        // Send error response to the client
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
};
