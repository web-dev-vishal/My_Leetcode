import { Submission, ProblemSolved } from '../models/index.js';
import {
  getLanguageName,
  pollBatchResults,
  submitBatch,
} from '../lib/judge0.js';

// 🌟 Main controller function to handle code execution and submission
// Function to execute user's code against test cases and save the submission
export const executeCode = async (req, res) => {
  // Extract code details and test cases from request body
  const { source_code, language_id, stdin, expected_outputs, problemId } = req.body;
  // Get the logged-in user's ID from the request
  const userId = req.user.id;

  try {
    // ✅ 1. Validate incoming test cases
    // Check if stdin and expected_outputs are valid arrays with matching lengths
    if (
      !Array.isArray(stdin) ||
      stdin.length === 0 ||
      !Array.isArray(expected_outputs) ||
      expected_outputs.length !== stdin.length
    ) {
      return res.status(400).json({ error: 'Invalid or missing test cases' });
    }

    // 📦 2. Prepare submissions for Judge0
    // Create a submission object for each test case input
    const submissions = stdin.map((input) => ({
      source_code,
      language_id,
      stdin: input,
      base64_encoded: false,
      wait: false,
    }));

    // 🚀 3. Submit batch
    // Submit all test cases to Judge0 for execution
    const submitResponse = await submitBatch(submissions);
    // Extract tokens from submission response to track execution
    const tokens = submitResponse.map((res) => res.token);

    // ⏳ 4. Poll for results
    // Wait and get the results of all submitted test cases
    const results = await pollBatchResults(tokens);

    // 📊 5. Analyze test results
    // Flag to track if all test cases passed
    let allPassed = true;
    // Process each result and compare with expected output
    const detailedResults = results.map((result, i) => {
      // Get actual output and trim whitespace
      const stdout = result.stdout?.trim() || null;
      // Get expected output and trim whitespace
      const expected_output = expected_outputs[i]?.trim();
      // Check if actual output matches expected output
      const passed = stdout === expected_output;

      // If any test case fails, set allPassed to false
      if (!passed) allPassed = false;

      // Return detailed result for this test case
      return {
        testCase: i + 1,
        passed,
        stdout,
        expected: expected_output,
        stderr: result.stderr || null,
        compile_output: result.compile_output || null,
        status: result.status.description,
        memory: result.memory ? `${result.memory} KB` : undefined,
        time: result.time ? `${result.time} s` : undefined,
      };
    });

    // 💾 6. Store submission summary with embedded test case results
    // Create a submission record in database with all execution details
    const testCaseResults = detailedResults.map((result) => ({
      testCase: result.testCase,
      passed: result.passed,
      stdout: result.stdout,
      expected: result.expected,
      stderr: result.stderr,
      compileOutput: result.compile_output,
      status: result.status,
      memory: result.memory,
      time: result.time,
    }));

    const submission = await Submission.create({
      userId,
      problemId,
      sourceCode: source_code,
      language: getLanguageName(language_id),
      stdin: stdin.join('\n'),
      stdout: JSON.stringify(detailedResults.map((r) => r.stdout)),
      stderr: detailedResults.some((r) => r.stderr)
        ? JSON.stringify(detailedResults.map((r) => r.stderr))
        : null,
      compileOutput: detailedResults.some((r) => r.compile_output)
        ? JSON.stringify(detailedResults.map((r) => r.compile_output))
        : null,
      status: allPassed ? 'Accepted' : 'Wrong Answer',
      memory: detailedResults.some((r) => r.memory)
        ? JSON.stringify(detailedResults.map((r) => r.memory))
        : null,
      time: detailedResults.some((r) => r.time)
        ? JSON.stringify(detailedResults.map((r) => r.time))
        : null,
      testCases: testCaseResults, // Embed test case results
    });

    // 🏆 7. Mark problem as solved if all test cases passed
    // If all test cases passed, mark this problem as solved by the user
    if (allPassed) {
      await ProblemSolved.findOneAndUpdate(
        { userId, problemId },
        { userId, problemId },
        { upsert: true, new: true }
      );
    }

    // 📤 8. Respond to client
    // Send success response with complete submission details (testCases already embedded)
    res.status(200).json({
      success: true,
      message: 'Code executed successfully',
      submission: {
        ...submission.toObject(),
        id: submission._id.toString(),
      },
    });
  } catch (error) {
    console.error('Error executing code:', error.message);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: Object.values(error.errors).map(e => e.message) 
      });
    }
    
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    res.status(500).json({ error: 'Failed to execute code' });
  }
};