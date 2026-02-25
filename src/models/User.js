import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  image: {
    type: String,
  },
  role: {
    type: String,
    enum: ['ADMIN', 'USER'],
    default: 'USER',
  },
  password: {
    type: String,
    required: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ email: 1 }); // Unique index already created

export const User = mongoose.model('User', userSchema);
