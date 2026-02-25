import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Compound unique index
playlistSchema.index({ name: 1, userId: 1 }, { unique: true });

export const Playlist = mongoose.model('Playlist', playlistSchema);
