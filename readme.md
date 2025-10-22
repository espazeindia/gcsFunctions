# Google Cloud Functions - Espaze India

This repository contains Google Cloud Functions with automatic deployment via GitHub Actions.

## 🚀 Quick Start

### Creating a New Function

**Option 1: Use the Generator (Recommended)**
```bash
cd gcsFunctions
npm run create-function
# Follow the interactive prompts
```

**Option 2: Manual Creation**

1. **Create function file** in `functions/` directory:
```javascript
// functions/myFunction.js
const functions = require('@google-cloud/functions-framework');
const { logger } = require('../shared/utils');

functions.http('myFunction', (req, res) => {
  logger('myFunction', 'Function invoked');
  res.json({ message: 'Hello World!' });
});

module.exports = { functionName: 'myFunction' };
```

2. **Add configuration** to `functions.yaml`:
```yaml
name: myFunction
entry_point: myFunction
runtime: nodejs18
trigger: http
region: us-central1
memory: 256MB
timeout: 60s
---
```

3. **Commit and push**:
```bash
git add .
git commit -m "Add myFunction"
git push origin main
```

That's it! GitHub Actions automatically deploys to Google Cloud! 🎉

## 📁 Project Structure

```
gcsFunctions/
├── functions/                    # Individual function files
│   ├── helloWorld.js            # Example: Simple HTTP function
│   ├── getUserData.js           # Example: API endpoint with CORS
│   ├── processWebhook.js        # Example: Webhook handler
│   ├── scheduledTask.js         # Example: Pub/Sub triggered function
│   └── sendNotification.js      # Example: Notification service
│
├── shared/                       # Shared utilities and configuration
│   ├── utils.js                 # Common utility functions
│   ├── config.js                # Configuration management
│   └── README.md                # Shared utilities documentation
│
├── scripts/                      # Helper scripts
│   └── create-function.js       # Function template generator
│
├── index.js                      # Main entry point (auto-loads all functions)
├── package.json                  # Node.js dependencies
├── functions.yaml                # Function deployment configuration
└── .gcloudignore                 # Files to exclude from deployment
```

## 🛠️ Available Functions

| Function | Trigger | Description |
|----------|---------|-------------|
| `helloWorld` | HTTP | Simple greeting function |
| `getUserData` | HTTP | API endpoint with CORS support |
| `processWebhook` | HTTP | Webhook event handler |
| `sendNotification` | HTTP | Send email/SMS/push notifications |
| `scheduledTask` | Pub/Sub | Background task for scheduled jobs |

## 📝 Function Configuration

### Trigger Types

**HTTP Trigger:**
```yaml
trigger: http
```

**Pub/Sub Trigger:**
```yaml
trigger: topic:your-topic-name
```

**Cloud Storage Trigger:**
```yaml
trigger: bucket:your-bucket-name
```

### Configuration Options

- **name** - Function name (required)
- **entry_point** - Entry point function name (defaults to name)
- **runtime** - `nodejs18`, `nodejs20` (default: nodejs18)
- **trigger** - `http`, `topic:name`, `bucket:name` (required)
- **region** - GCP region (default: us-central1)
- **memory** - `128MB`, `256MB`, `512MB`, `1GB`, `2GB`, `4GB`, `8GB`
- **timeout** - Max execution time (default: 60s, max: 540s)
- **max_instances** - Maximum concurrent instances (optional)
- **env_vars** - Environment variables (format: KEY1=value1,KEY2=value2)

### Example Configuration

```yaml
name: myAdvancedFunction
entry_point: myAdvancedFunction
runtime: nodejs18
trigger: http
region: us-central1
memory: 512MB
timeout: 120s
max_instances: 100
env_vars: API_KEY=abc123,DEBUG=true
---
```

## 🧰 Shared Utilities

Import utilities in your functions:

```javascript
const { 
  logger,                    // Consistent logging
  setCorsHeaders,            // CORS configuration
  validateRequiredFields,    // Input validation
  errorResponse,             // Standard error response
  successResponse,           // Standard success response
  retryWithBackoff          // Retry logic
} = require('../shared/utils');

const { getConfig } = require('../shared/config');
```

## 📦 Adding Dependencies

```bash
cd gcsFunctions
npm install --save package-name
```

Or manually edit `package.json`:
```json
{
  "dependencies": {
    "@google-cloud/functions-framework": "^3.3.0",
    "axios": "^1.6.0"
  }
}
```

## 🧪 Testing Locally

**Test a single function:**
```bash
cd gcsFunctions
npm install
npm start
# Opens http://localhost:8080
```

**Test specific function:**
```bash
npx @google-cloud/functions-framework --target=getUserData --port=8080
```

**Make a test request:**
```bash
# GET request
curl http://localhost:8080

# POST request
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User"}'
```

## 🌐 Accessing Deployed Functions

After deployment, functions are available at:
```
https://REGION-PROJECT_ID.cloudfunctions.net/FUNCTION_NAME
```

Find exact URLs:
- **Cloud Console**: https://console.cloud.google.com/functions
- **CLI**: `gcloud functions describe FUNCTION_NAME --region=REGION`

## 📊 Monitoring & Logs

**View logs in Cloud Console:**
https://console.cloud.google.com/functions/list

**View logs via CLI:**
```bash
# Real-time logs
gcloud functions logs read FUNCTION_NAME --region=us-central1 --limit=50

# Follow logs
gcloud functions logs read FUNCTION_NAME --region=us-central1 --follow
```

**View all deployed functions:**
```bash
gcloud functions list --regions=us-central1
```

## 🔧 Common Tasks

### Deploy Specific Function
```bash
cd gcsFunctions
gcloud functions deploy FUNCTION_NAME \
  --source=. \
  --runtime=nodejs18 \
  --trigger-http \
  --region=us-central1
```

### Delete a Function
```bash
gcloud functions delete FUNCTION_NAME --region=us-central1
```

### Update Environment Variables
Edit `functions.yaml`:
```yaml
env_vars: API_KEY=new_value,DEBUG=false
```

Then commit and push.

## 🔒 Security Best Practices

1. ✅ **Never commit secrets** - Use environment variables
2. ✅ **Validate all inputs** - Use `validateRequiredFields()` utility
3. ✅ **Enable CORS properly** - Use `setCorsHeaders()` utility
4. ✅ **Implement rate limiting** for production functions
5. ✅ **Use authentication** for sensitive endpoints
6. ✅ **Keep dependencies updated** - Run `npm audit` regularly

### Securing HTTP Functions

```javascript
// Add authentication
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return errorResponse(res, 401, 'Unauthorized');
}
```

## 🐛 Troubleshooting

### Function Not Deploying
- Check GitHub Actions logs for errors
- Verify `functions.yaml` syntax is correct
- Ensure `GCP_SA_KEY` secret is set in GitHub

### Function Timeout
- Increase `timeout` in `functions.yaml`
- Optimize your code for better performance
- Check for slow external API calls

### Permission Errors
- Verify service account has required permissions
- Check IAM roles in GCP Console

### Import Errors
- Run `npm install` to ensure all dependencies are installed
- Check that file paths in `require()` are correct

## 📚 Documentation

- [Setup Guide](../SETUP_GUIDE.md) - Complete setup instructions
- [Google Cloud Functions Docs](https://cloud.google.com/functions/docs)
- [Functions Framework](https://github.com/GoogleCloudPlatform/functions-framework-nodejs)

## 🆘 Support

**Email**: espazeindia@gmail.com  
**GitHub Issues**: https://github.com/espazeindia/gcsFunctions/issues

## 📄 License

Copyright © 2025 Espaze India. All rights reserved.
