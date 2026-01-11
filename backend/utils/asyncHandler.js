/**
 * Async Handler Utility
 * Wraps async functions to catch errors and pass them to error middleware
 * This eliminates the need for try-catch blocks in every async controller
 */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;