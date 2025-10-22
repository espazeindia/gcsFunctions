# Functions Directory

This directory contains all your Google Cloud Functions. Each function is in its own file for better organization and maintainability.

## 📁 Structure

```
functions/
├── helloWorld.js           # Simple HTTP greeting function
├── getUserData.js          # API endpoint with CORS
├── processWebhook.js       # Webhook event handler
├── scheduledTask.js        # Pub/Sub triggered background task
├── sendNotification.js     # Notification service
└── README.md              # This file
```

## ✨ Creating a New Function

### Quick Way (Recommended)

```bash
cd gcsFunctions
npm run create-function
```

### Manual Way

1. **Create a new file** (e.g., `myFunction.js`)
2. **Use this template**:

```javascript
const functions = require('@google-cloud/functions-framework');
const { logger, setCorsHeaders } = require('../shared/utils');

functions.http('myFunction', (req, res) => {
  logger('myFunction', 'Function invoked');
  
  // Your logic here
  
  res.json({ 
    success: true, 
    message: 'Hello World!' 
  });
});

module.exports = { functionName: 'myFunction' };
```

3. **Add to `../functions.yaml`**:

```yaml
name: myFunction
entry_point: myFunction
runtime: nodejs18
trigger: http
region: us-central1
memory: 256MB
---
```

4. **Commit and push** - GitHub Actions will deploy automatically!

## 📝 Function Templates

### HTTP Function (GET/POST)

```javascript
const functions = require('@google-cloud/functions-framework');
const { logger, setCorsHeaders, errorResponse, successResponse } = require('../shared/utils');

functions.http('apiEndpoint', (req, res) => {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  logger('apiEndpoint', 'Processing request');
  
  try {
    const data = { result: 'Success' };
    successResponse(res, data);
  } catch (error) {
    logger('apiEndpoint', `Error: ${error.message}`);
    errorResponse(res, 500, 'Internal server error');
  }
});

module.exports = { functionName: 'apiEndpoint' };
```

### Pub/Sub Function (Background Task)

```javascript
const functions = require('@google-cloud/functions-framework');
const { logger } = require('../shared/utils');

functions.cloudEvent('backgroundTask', async (cloudEvent) => {
  logger('backgroundTask', 'Task started');
  
  const data = cloudEvent.data;
  const message = Buffer.from(data.message.data, 'base64').toString();
  
  // Process the message
  logger('backgroundTask', `Processing: ${message}`);
  
  // Your logic here
  
  logger('backgroundTask', 'Task completed');
});

module.exports = { functionName: 'backgroundTask' };
```

### Storage Function (File Upload Handler)

```javascript
const functions = require('@google-cloud/functions-framework');
const { logger } = require('../shared/utils');

functions.cloudEvent('processFile', async (cloudEvent) => {
  const file = cloudEvent.data;
  
  logger('processFile', `New file: ${file.name}`);
  logger('processFile', `Bucket: ${file.bucket}`);
  logger('processFile', `Size: ${file.size} bytes`);
  
  // Process the file
  
  logger('processFile', 'File processing completed');
});

module.exports = { functionName: 'processFile' };
```

## 🧰 Available Utilities

Import from `../shared/utils.js`:

```javascript
const {
  logger,                    // logger(functionName, message)
  setCorsHeaders,            // setCorsHeaders(res)
  validateRequiredFields,    // validateRequiredFields(data, ['field1', 'field2'])
  errorResponse,             // errorResponse(res, statusCode, message)
  successResponse,           // successResponse(res, data, message)
  retryWithBackoff          // retryWithBackoff(asyncFn, maxRetries, baseDelay)
} = require('../shared/utils');
```

Import from `../shared/config.js`:

```javascript
const { getConfig, isProduction } = require('../shared/config');

const apiKey = getConfig('emailService.apiKey');
const isProd = isProduction();
```

## 🎯 Best Practices

1. **Always use `logger()`** for consistent log formatting
2. **Handle errors gracefully** with try-catch blocks
3. **Validate inputs** before processing
4. **Use shared utilities** to avoid code duplication
5. **Set CORS headers** for HTTP functions accessed from browsers
6. **Export function name** at the end: `module.exports = { functionName: 'yourFunction' }`

## 🧪 Testing

Test locally before deploying:

```bash
cd gcsFunctions
npm install
npx @google-cloud/functions-framework --target=yourFunction --port=8080

# In another terminal
curl http://localhost:8080
```

## 📊 Examples in This Directory

### `helloWorld.js`
Simple HTTP function demonstrating basic request/response.

### `getUserData.js`
API endpoint with CORS support and input validation.

### `processWebhook.js`
Webhook handler showing POST request processing.

### `sendNotification.js`
Multi-purpose notification function (email/SMS/push).

### `scheduledTask.js`
Pub/Sub triggered function for background tasks.

## 🚀 Deployment

Functions are automatically deployed when you:
1. Push to `main` or `master` branch
2. Modify files in the `gcsFunctions/` directory

Monitor deployment in GitHub Actions tab.

## 📚 Learn More

- [Main README](../readme.md)
- [Setup Guide](../../SETUP_GUIDE.md)
- [Shared Utilities](../shared/README.md)
- [Google Cloud Functions Docs](https://cloud.google.com/functions/docs)

---

**Happy coding!** 🎉

