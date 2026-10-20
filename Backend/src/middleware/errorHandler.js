// 404 handler — catches unknown routes
function notFound(req, res, next) {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
}

// Global error handler — catches all thrown errors
function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err.message);

  // Known error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // In production, hide internal error details
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'Internal server error' });
  }

  // In development, show the real error + stack
  res.status(500).json({
    error: err.message,
    stack: err.stack
  });
}

module.exports = { notFound, errorHandler };