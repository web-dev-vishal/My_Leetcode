// Import Mongoose models
import { Playlist, ProblemInPlaylist, Problem } from "../models/index.js";

// Function to create a new playlist for a user
export const createPlayList = async (req, res) => {
  try {
    // Extract playlist name and description from request body
    const { name, description } = req.body;
    // Get the logged-in user's ID from the request
    const userId = req.user.id;

    // Create a new playlist in the database with the provided details
    const playList = await Playlist.create({
      name,
      description,
      userId,
    });
    
    // Send success response with the created playlist data
    res.status(200).json({ 
      success: true, 
      message: 'Playlist created successfully', 
      playList: {
        ...playList.toObject(),
        id: playList._id.toString(),
      },
    });
  } catch (error) {
    // Log error to console for debugging
    console.error('Error creating playlist:', error);
    
    // Handle duplicate key error (playlist name already exists for this user)
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'Playlist with this name already exists' 
      });
    }
    
    // Send error response to the client
    res.status(500).json({ error: 'Failed to create playlist' });
  }
};


// Function to get all playlists belonging to the logged-in user
export const getPlayAllListDetails = async (req, res) => {
  try {
    // Fetch all playlists for the current user from database
    const playLists = await Playlist.find({ userId: req.user.id }).lean();
    
    // For each playlist, get the problems
    const playListsWithProblems = await Promise.all(
      playLists.map(async (playlist) => {
        // Get all problem IDs in this playlist
        const problemsInPlaylist = await ProblemInPlaylist.find({ 
          playlistId: playlist._id 
        }).lean();
        
        // Get full problem details
        const problemIds = problemsInPlaylist.map(pip => pip.problemId);
        const problems = await Problem.find({ _id: { $in: problemIds } }).lean();
        
        // Format problems with their relationship data
        const formattedProblems = problemsInPlaylist.map(pip => {
          const problem = problems.find(p => p._id.toString() === pip.problemId.toString());
          return {
            id: pip._id.toString(),
            playlistId: pip.playlistId.toString(),
            problemId: pip.problemId.toString(),
            createdAt: pip.createdAt,
            problem: problem ? {
              ...problem,
              id: problem._id.toString(),
            } : null,
          };
        });
        
        return {
          ...playlist,
          id: playlist._id.toString(),
          problems: formattedProblems,
        };
      })
    );

    // Send success response with all playlists and their problems
    res.status(200).json({ 
      success: true, 
      message: 'Playlists fetched successfully', 
      playLists: playListsWithProblems 
    });
  } catch (error) {
    // Log error to console for debugging
    console.log("Error fetching playlists:", error);
    // Send error response to the client
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
};


// Function to get details of a single specific playlist
export const getPlayListDetails = async (req, res) => {
  // Extract playlist ID from URL parameters
  const { playlistId } = req.params;

  try {
    // Find the specific playlist by ID and ensure it belongs to the logged-in user
    const playList = await Playlist.findOne({ 
      _id: playlistId, 
      userId: req.user.id 
    }).lean();

    // If playlist doesn't exist or doesn't belong to user, return error
    if (!playList) {
      return res.status(404).json({ error: "Playlist not found" });
    }
    
    // Get all problems in this playlist
    const problemsInPlaylist = await ProblemInPlaylist.find({ 
      playlistId 
    }).lean();
    
    // Get full problem details
    const problemIds = problemsInPlaylist.map(pip => pip.problemId);
    const problems = await Problem.find({ _id: { $in: problemIds } }).lean();
    
    // Format problems with their relationship data
    const formattedProblems = problemsInPlaylist.map(pip => {
      const problem = problems.find(p => p._id.toString() === pip.problemId.toString());
      return {
        id: pip._id.toString(),
        playlistId: pip.playlistId.toString(),
        problemId: pip.problemId.toString(),
        createdAt: pip.createdAt,
        problem: problem ? {
          ...problem,
          id: problem._id.toString(),
        } : null,
      };
    });

    // Send success response with the playlist details
    res.status(200).json({ 
      success: true, 
      message: "Playlist fetched successfully", 
      playList: {
        ...playList,
        id: playList._id.toString(),
        problems: formattedProblems,
      }
    });
  } catch (error) {
    // Log error to console for debugging
    console.error('Error fetching playlist:', error);
    
    // Handle CastError for invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid playlist ID format' });
    }
    
    // Send error response to the client
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
};


// Function to add one or more problems to a playlist
export const addProblemToPlayList = async (req, res) => {
  // Extract playlist ID from URL parameters
  const { playlistId } = req.params;
  // Extract array of problem IDs from request body
  const { problemIds } = req.body;

  console.log(problemIds);
  try {
    // Check if problemIds is a valid array and not empty
    if (!Array.isArray(problemIds) || problemIds.length === 0) {
      return res.status(400).json({ error: 'Invalid or missing problemIds' });
    }

    // Add multiple problems to the playlist
    const problemsInPlaylist = await ProblemInPlaylist.insertMany(
      problemIds.map((problemId) => ({
        playlistId,
        problemId,
      })),
      { ordered: false } // Continue inserting even if some fail due to duplicates
    );

    // Send success response with information about added problems
    res.status(201).json({
      success: true,
      message: 'Problems added to playlist successfully',
      problemsInPlaylist,
    });
  } catch (error) {
    // Log error to console for debugging
    console.error('Error adding problems to playlist:', error.message);
    
    // Handle duplicate key error (problem already in playlist)
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'One or more problems already exist in this playlist' 
      });
    }
    
    // Handle CastError for invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid playlist or problem ID format' });
    }
    
    // Send error response to the client
    res.status(500).json({ error: 'Failed to add problems to playlist' });
  }
};


// Function to delete an entire playlist
export const deletePlayList = async (req, res) => {
  // Extract playlist ID from URL parameters
  const { playlistId } = req.params;

  try {
    // Delete the playlist from database by its ID
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    
    // If playlist doesn't exist, return error
    if (!deletedPlaylist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Send success response with information about deleted playlist
    res.status(200).json({
      success: true,
      message: 'Playlist deleted successfully',
      deletedPlaylist: {
        ...deletedPlaylist.toObject(),
        id: deletedPlaylist._id.toString(),
      },
    });
  } catch (error) {
    // Log error to console for debugging
    console.error('Error deleting playlist:', error.message);
    
    // Handle CastError for invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid playlist ID format' });
    }
    
    // Send error response to the client
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
};


// Function to remove one or more problems from a playlist
export const removeProblemFromPlayList = async (req, res) => {
  // Extract playlist ID from URL parameters
  const { playlistId } = req.params;
  // Extract array of problem IDs to remove from request body
  const { problemIds } = req.body;

  try {
    // Check if problemIds is a valid array and not empty
    if (!Array.isArray(problemIds) || problemIds.length === 0) {
      return res.status(400).json({ error: 'Invalid or missing problemIds' });
    }

    // Remove multiple problems from the playlist in one operation
    const result = await ProblemInPlaylist.deleteMany({
      playlistId,
      problemId: { $in: problemIds },
    });

    // Send success response with information about removed problems
    res.status(200).json({
      success: true,
      message: 'Problems removed from playlist successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    // Log error to console for debugging
    console.error('Error removing problems from playlist:', error.message);
    
    // Handle CastError for invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid playlist or problem ID format' });
    }
    
    // Send error response to the client
    res.status(500).json({ error: 'Failed to remove problems from playlist' });
  }
};
