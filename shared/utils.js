/**
 * Shared Utilities
 * 
 * Common functions used across multiple cloud functions
 */

/**
 * Logger utility with consistent formatting
 */
function logger(functionName, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${functionName}] ${message}`);
}

/**
 * Set CORS headers for HTTP functions
 */
function setCorsHeaders(res, allowedOrigins = '*') {
  res.set('Access-Control-Allow-Origin', allowedOrigins);
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Max-Age', '3600');
}

/**
 * Validate required fields in request
 */
function validateRequiredFields(data, requiredFields) {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    };
  }
  
  return { valid: true };
}

/**
 * Validate webhook signature (example implementation)
 */
function validateWebhookSignature(payload, signature, secret = process.env.WEBHOOK_SECRET) {
  if (!secret) {
    logger('utils', 'Warning: WEBHOOK_SECRET not configured');
    return true; // Skip validation if no secret is set
  }
  
  // Implement your signature validation logic here
  // Example: HMAC SHA256
  // const crypto = require('crypto');
  // const expectedSignature = crypto
  //   .createHmac('sha256', secret)
  //   .update(JSON.stringify(payload))
  //   .digest('hex');
  // return signature === expectedSignature;
  
  return true;
}

/**
 * Standard error response
 */
function errorResponse(res, statusCode, message, details = null) {
  const response = {
    success: false,
    error: message
  };
  
  if (details) {
    response.details = details;
  }
  
  res.status(statusCode).json(response);
}

/**
 * Standard success response
 */
function successResponse(res, data, message = null) {
  const response = {
    success: true
  };
  
  if (message) {
    response.message = message;
  }
  
  if (data) {
    response.data = data;
  }
  
  res.status(200).json(response);
}

/**
 * Parse JSON safely
 */
function parseJSON(str) {
  try {
    return { success: true, data: JSON.parse(str) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      logger('utils', `Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = {
  logger,
  setCorsHeaders,
  validateRequiredFields,
  validateWebhookSignature,
  errorResponse,
  successResponse,
  parseJSON,
  retryWithBackoff
};

