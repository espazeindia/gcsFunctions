# Shared Utilities

This folder contains shared code used across multiple cloud functions.

## Files

### `utils.js`
Common utility functions:
- `logger()` - Consistent logging
- `setCorsHeaders()` - CORS configuration
- `validateRequiredFields()` - Input validation
- `errorResponse()` / `successResponse()` - Standard responses
- `retryWithBackoff()` - Retry logic with exponential backoff

### `config.js`
Centralized configuration:
- Project settings
- API endpoints
- Database connections
- External service credentials
- Feature flags

## Usage

Import utilities in your functions:

```javascript
const { logger, setCorsHeaders } = require('../shared/utils');
const { getConfig } = require('../shared/config');
```

## Adding New Utilities

1. Add your utility function to the appropriate file
2. Export it in the `module.exports` section
3. Document it with JSDoc comments
4. Update this README

