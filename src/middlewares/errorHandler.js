// Centralized error handler middleware for Mongoose errors
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      error: `Duplicate value for ${field}`,
      field,
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error',
  });
};
