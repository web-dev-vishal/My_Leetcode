import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['EASY', 'MEDIUM', 'HARD'],
    required: true,
  },
  tags: [{
    type: String,
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  examples: {
    type: mongoose.Schema.Types.Mixed, // JSON equivalent
    required: true,
  },
  constraints: {
    type: String,
    required: true,
  },
  hints: {
    type: String,
  },
  editorial: {
    type: String,
  },
  testCases: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  codeSnippets: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  referenceSolutions: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
problemSchema.index({ difficulty: 1 });
problemSchema.index({ userId: 1 });
problemSchema.index({ tags: 1 });

// Virtual populate for solvedBy relationship
problemSchema.virtual('solvedBy', {
  ref: 'ProblemSolved',
  localField: '_id',
  foreignField: 'problemId',
});

// Virtual populate for submissions relationship
problemSchema.virtual('submissions', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'problemId',
});

// Enable virtuals in JSON output
problemSchema.set('toJSON', { virtuals: true });
problemSchema.set('toObject', { virtuals: true });

export const Problem = mongoose.model('Problem', problemSchema);
