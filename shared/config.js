/**
 * Shared Configuration
 * 
 * Configuration values used across multiple functions
 */

const config = {
  // Project settings
  projectId: process.env.GCP_PROJECT_ID || 'your-project-id',
  region: process.env.GCP_REGION || 'us-central1',
  
  // API endpoints
  apiBaseUrl: process.env.API_BASE_URL || 'https://api.example.com',
  
  // Database (if using)
  databaseUrl: process.env.DATABASE_URL,
  
  // External services
  emailService: {
    apiKey: process.env.EMAIL_API_KEY,
    fromEmail: process.env.EMAIL_FROM || 'noreply@espazeindia.com'
  },
  
  smsService: {
    apiKey: process.env.SMS_API_KEY,
    fromNumber: process.env.SMS_FROM_NUMBER
  },
  
  // Security
  webhookSecret: process.env.WEBHOOK_SECRET,
  jwtSecret: process.env.JWT_SECRET,
  
  // Feature flags
  features: {
    enableCors: process.env.ENABLE_CORS !== 'false',
    enableLogging: process.env.ENABLE_LOGGING !== 'false',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT === 'true'
  },
  
  // Rate limiting
  rateLimit: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000
  }
};

/**
 * Get configuration value by path
 */
function getConfig(path, defaultValue = null) {
  const keys = path.split('.');
  let value = config;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value !== undefined ? value : defaultValue;
}

/**
 * Check if running in production
 */
function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
function isDevelopment() {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}

module.exports = {
  config,
  getConfig,
  isProduction,
  isDevelopment
};

