import mongoose from 'mongoose';

const testCaseResultSchema = new mongoose.Schema({
  testCase: {
    type: Number,
    required: true,
  },
  passed: {
    type: Boolean,
    required: true,
  },
  stdout: String,
  expected: {
    type: String,
    required: true,
  },
  stderr: String,
  compileOutput: String,
  status: {
    type: String,
    required: true,
  },
  memory: String,
  time: String,
}, {
  _id: true, // Keep _id for individual test case results
  timestamps: { createdAt: true, updatedAt: false },
});

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
  },
  sourceCode: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  stdin: String,
  stdout: String,
  stderr: String,
  compileOutput: String,
  status: {
    type: String,
    required: true,
  },
  memory: String,
  time: String,
  testCases: [testCaseResultSchema], // Embedded test case results
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Indexes
submissionSchema.index({ status: 1 });
submissionSchema.index({ userId: 1 });
submissionSchema.index({ problemId: 1 });
submissionSchema.index({ userId: 1, problemId: 1 });

export const Submission = mongoose.model('Submission', submissionSchema);
