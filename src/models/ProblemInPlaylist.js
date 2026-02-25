import mongoose from 'mongoose';

const problemInPlaylistSchema = new mongoose.Schema({
  playlistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist',
    required: true,
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Compound unique index
problemInPlaylistSchema.index({ playlistId: 1, problemId: 1 }, { unique: true });

export const ProblemInPlaylist = mongoose.model('ProblemInPlaylist', problemInPlaylistSchema);
