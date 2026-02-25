import mongoose from 'mongoose';

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// TTL index to automatically delete expired tokens
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
