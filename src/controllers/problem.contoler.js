import { Problem, ProblemSolved } from "../models/index.js";
import {
  getJudge0LanguageId,
  pollBatchResults,
  submitBatch,
} from "../lib/judge0.js";
import { cacheService } from "../lib/cache.js";
import { logger } from "../lib/logger.js";

// Function to create a new coding problem
export const createProblem = async (req, res) => {
  // Extract all problem details from request body
  const {
    title,
    description,
    difficulty,
    tags,
    examples,
    constraints,
    testCases,
    codeSnippets,
    referenceSolutions,
    hints,
    editorial,
  } = req.body;

  try {
    // Loop through each reference solution (different programming languages)
    for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
      // Get the Judge0 language ID for the current language
      const languageId = getJudge0LanguageId(language);

      // If language is not supported, return error
      if (!languageId) {
        return res
          .status(400)
          .json({ error: `Unsupported language: ${language}` });
      }

      // Prepare judge0 submission for all testcases
      // Create submission objects for each test case
      const submissions = testCases.map(({ input, output }) => ({
        source_code: solutionCode,
        language_id: languageId,
        stdin: input,
        expected_output: output,
      }));

      // Submit all test cases to Judge0 for execution
      const submissionResults = await submitBatch(submissions);

      // Extract tokens from submission results to track execution
      const tokens = submissionResults.map((res) => res.token);

      // Wait and get the results of all submitted test cases
      const results = await pollBatchResults(tokens);

      // Check each test case result
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        // If status is not 3 (Accepted), validation failed
        if (result.status.id !== 3) {
          return res.status(400).json({
            error: `Validation failed for ${language} on input: ${submissions[i].stdin}`,
            details: result,
          });
        }
      }
    }

    // If all validations pass, create the problem in database
    const newProblem = await Problem.create({
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      testCases,
      codeSnippets,
      referenceSolutions,
      hints,
      editorial,
      userId: req.user.id
    });

    // Send success response with the newly created problem
    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      problem: {
        ...newProblem.toObject(),
        id: newProblem._id.toString(),
      },
    });
  } catch (error) {
    // Log error to console for debugging
    console.error('Error creating problem:', error);
    // Send error response to the client
    res.status(500).json({ error: 'Failed to create problem' });
  }
};


export const getAllProblems = async (req, res) => {
  try {
    const cached = await cacheService.getCachedProblems();
    if (cached) {
      const solvedProblems = await ProblemSolved.find({ userId: req.user.id }).lean();
      const solvedProblemIds = new Set(solvedProblems.map(sp => sp.problemId.toString()));
      
      const problemsWithSolvedStatus = cached.map(problem => ({
        ...problem,
        solvedBy: solvedProblemIds.has(problem.id) ? [{ userId: req.user.id }] : [],
      }));
      
      return res.status(200).json({
        success: true,
        message: 'Problems fetched successfully',
        problems: problemsWithSolvedStatus,
        cached: true,
      });
    }

    const problems = await Problem.find().lean();
    
    const solvedProblems = await ProblemSolved.find({ userId: req.user.id }).lean();
    const solvedProblemIds = new Set(solvedProblems.map(sp => sp.problemId.toString()));
    
    const problemsWithSolvedStatus = problems.map(problem => ({
      ...problem,
      id: problem._id.toString(),
      solvedBy: solvedProblemIds.has(problem._id.toString()) ? [{ userId: req.user.id }] : [],
    }));
    
    await cacheService.cacheProblems(problemsWithSolvedStatus, 600);
    
    res.status(200).json({
      success: true,
      message: 'Problems fetched successfully',
      problems: problemsWithSolvedStatus,
    });
  } catch (error) {
    logger.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
};


export const getProblemById = async (req, res) => {
  const { id } = req.params;

  try {
    const cached = await cacheService.getCachedProblem(id);
    if (cached) {
      return res.status(200).json({
        success: true,
        message: 'Problem fetched successfully',
        problem: cached,
        cached: true,
      });
    }

    const problem = await Problem.findById(id).lean();
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }
    
    const problemData = {
      ...problem,
      id: problem._id.toString(),
    };
    
    await cacheService.cacheProblem(id, problemData, 3600);
    
    res.status(200).json({
      success: true,
      message: 'Problem fetched successfully',
      problem: problemData,
    });
  } catch (error) {
    logger.error('Error fetching problem:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid problem ID format' });
    }
    
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
};


// Function to update an existing problem
export const updateProblem = async (req, res) => {
  try {
    // Extract problem ID from URL parameters
    const { id } = req.params;

    // Extract updated problem details from request body
    const {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      testCases,
      codeSnippets,
      referenceSolutions
    } = req.body;

    // Check if problem exists in database
    const problem = await Problem.findById(id);

    // If problem doesn't exist, return error
    if (!problem) {
      return res.status(404).json({ error: "Problem was not found" });
    }

    // Check if user is an admin (only admins can update problems)
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Only Admin can update problems" });
    }

    // Validate reference solutions by running them against test cases
    for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
      // Get Judge0 language ID for the current language
      const languageId = getJudge0LanguageId(language);
      // If language is not supported, return error
      if (!languageId) {
        return res.status(400).json({ error: `Unsupported language: ${language}` });
      }

      // Create submission objects for each test case
      const submissions = testCases.map(({ input, output }) => ({
        source_code: solutionCode,
        language_id: languageId,
        stdin: input,
        expected_output: output,
      }));

      console.log("submissions:", submissions);

      // Submit all test cases to Judge0 for execution
      const submissionResults = await submitBatch(submissions);

      // Extract tokens from submission results
      const tokens = submissionResults.map((res) => res.token);

      // Wait and get the results of all submitted test cases
      const results = await pollBatchResults(tokens);

      // Check each test case result
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        // If status is not 3 (Accepted), validation failed
        if (result.status.id !== 3) {
          return res.status(400).json({
            error: `Validation failed for ${language} on input: ${submissions[i].stdin}`,
            details: result,
          });
        }
      }
    }

    // If all validations pass, update the problem in database
    const updatedProblem = await Problem.findByIdAndUpdate(
      id,
      {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testCases,
        codeSnippets,
        referenceSolutions
      },
      { new: true, runValidators: true }
    );

    // Send success response with updated problem details
    res.status(200).json({
      success: true,
      message: "Problem updated successfully",
      problem: {
        ...updatedProblem.toObject(),
        id: updatedProblem._id.toString(),
      },
    });

  } catch (error) {
    // Log error to console for debugging
    console.log("Error updating problem:", error);
    
    // Handle CastError for invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid problem ID format' });
    }
    
    // Send error response to the client
    res.status(500).json({ error: "Failed to update problem" });
  }
};


// Function to delete a problem from database
export const deleteProblem = async (req, res) => { 
  try {
    // Extract problem ID from URL parameters
    const { id } = req.params;

    // Check if problem exists and delete it
    const problem = await Problem.findByIdAndDelete(id);

    // If problem doesn't exist, return error
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    // Send success response
    res.status(200).json({ 
      success: true, 
      message: "Problem deleted successfully" 
    });
  } catch (error) {
    // Log error to console for debugging
    console.log("Error deleting problem:", error);
    
    // Handle CastError for invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid problem ID format' });
    }
    
    // Send error response to the client
    res.status(500).json({ error: "Failed to delete problem" });
  }
};


// Function to get all problems solved by the current user
export const getAllProblemSolvedByUser = async (req, res) => { 
  try {
    // First find all solved problem records for current user
    const solvedRecords = await ProblemSolved.find({ userId: req.user.id }).lean();
    const problemIds = solvedRecords.map(r => r.problemId);
    
    // Then find all problems with those IDs
    const problems = await Problem.find({ _id: { $in: problemIds } }).lean();
    
    // Add solved status to each problem
    const problemsWithSolvedStatus = problems.map(problem => ({
      ...problem,
      id: problem._id.toString(),
      solvedBy: [{ userId: req.user.id }],
    }));
    
    // Send success response with all solved problems
    res.status(200).json({ 
      success: true, 
      message: "Problems fetched successfully", 
      problems: problemsWithSolvedStatus 
    });
  } catch (error) {
    // Log error to console for debugging
    console.log("Error fetching problems:", error);
    // Send error response to the client
    res.status(500).json({ error: "Failed to fetch problems" });
  }
};
