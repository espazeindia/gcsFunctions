# Google Cloud Functions - Complete Setup Guide

This guide will walk you through setting up automatic deployment from GitHub to Google Cloud Functions for multiple functions.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Cloud Setup](#google-cloud-setup)
3. [GitHub Configuration](#github-configuration)
4. [First Deployment](#first-deployment)
5. [Adding New Functions](#adding-new-functions)
6. [Advanced Configuration](#advanced-configuration)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:

- ✅ A Google Cloud Platform account
- ✅ A GitHub account
- ✅ [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed
- ✅ [Node.js](https://nodejs.org/) 18+ installed
- ✅ [Git](https://git-scm.com/) installed

## Google Cloud Setup

### Step 1: Login to Google Cloud

```bash
# Login to your Google account
gcloud auth login

# List your projects
gcloud projects list

# Set your project (replace with your actual project ID)
gcloud config set project YOUR_PROJECT_ID
```

If you don't have a project yet:
```bash
# Create a new project
gcloud projects create espaze-functions --name="Espaze Functions"
gcloud config set project espaze-functions
```

### Step 2: Enable Required APIs

```bash
# Enable Cloud Functions API
gcloud services enable cloudfunctions.googleapis.com

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Enable Cloud Resource Manager API
gcloud services enable cloudresourcemanager.googleapis.com

# Enable Artifact Registry API (for newer GCP regions)
gcloud services enable artifactregistry.googleapis.com
```

Wait 1-2 minutes for APIs to be fully enabled.

### Step 3: Create Service Account

```bash
# Create a service account for GitHub Actions
gcloud iam service-accounts create github-actions \
  --description="Service account for GitHub Actions to deploy Cloud Functions" \
  --display-name="GitHub Actions Deployer"

# Verify it was created
gcloud iam service-accounts list
```

### Step 4: Grant Permissions

```bash
# Get your project ID
PROJECT_ID=$(gcloud config get-value project)

# Grant Cloud Functions Admin role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.admin"

# Grant Service Account User role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Grant Cloud Build Service Account role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

# Grant Artifact Registry Writer (if using newer regions)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

### Step 5: Create and Download Service Account Key

```bash
# Create the key and save to home directory
gcloud iam service-accounts keys create ~/gcp-sa-key.json \
  --iam-account=github-actions@${PROJECT_ID}.iam.gserviceaccount.com

# View the key (you'll need this content for GitHub)
cat ~/gcp-sa-key.json
```

**⚠️ Important**: This key provides full access to deploy functions. Keep it secure!

## GitHub Configuration

### Step 1: Add Service Account Key to GitHub

1. Go to your repository: **https://github.com/espazeindia/gcsFunctions**
2. Click **Settings** (top right)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Fill in:
   - **Name**: `GCP_SA_KEY`
   - **Secret**: Paste the entire contents of `~/gcp-sa-key.json`
6. Click **Add secret**

### Step 2: Verify GitHub Actions is Enabled

1. In your repository, go to **Settings** → **Actions** → **General**
2. Under "Actions permissions", ensure actions are enabled
3. Click **Save** if you made changes

### Step 3: Delete Local Key File

```bash
# For security, delete the local key file
rm ~/gcp-sa-key.json

# Verify it's deleted
ls ~/gcp-sa-key.json  # Should show "No such file or directory"
```

## First Deployment

### Step 1: Clone and Setup Repository

```bash
# Clone your repository (if not already done)
git clone https://github.com/espazeindia/gcsFunctions.git
cd gcsFunctions/gcsFunctions

# Install dependencies
npm install
```

### Step 2: Test Locally (Optional)

```bash
# Start the functions framework locally
npm start

# In another terminal, test the function
curl http://localhost:8080
```

Press `Ctrl+C` to stop the local server.

### Step 3: Push to GitHub

```bash
# Go back to root directory
cd ..

# Add all files
git add .

# Commit
git commit -m "Initial setup with multiple functions"

# Push to GitHub
git push origin main
```

### Step 4: Monitor Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see a workflow running
4. Click on it to see deployment progress
5. Wait for all functions to deploy (usually 3-5 minutes)

### Step 5: Verify Deployment

```bash
# List deployed functions
gcloud functions list --regions=us-central1

# Test a function
curl https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/helloWorld
```

🎉 **Success!** Your functions are now live!

## Adding New Functions

### Method 1: Using the Generator (Recommended)

```bash
cd gcsFunctions

# Run the generator
npm run create-function

# Follow the prompts:
# - Function name: myNewFunction
# - Description: My awesome function
# - Trigger: 1 (HTTP)
# - Memory: 256MB
# - Timeout: 60s
```

The generator will:
- Create `functions/myNewFunction.js`
- Update `functions.yaml`
- Provide next steps

### Method 2: Manual Creation

1. **Create function file**: `functions/myFunction.js`

```javascript
const functions = require('@google-cloud/functions-framework');
const { logger } = require('../shared/utils');

functions.http('myFunction', (req, res) => {
  logger('myFunction', 'Invoked');
  res.json({ message: 'Hello!' });
});

module.exports = { functionName: 'myFunction' };
```

2. **Add to `functions.yaml`**:

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

3. **Deploy**:

```bash
git add .
git commit -m "Add myFunction"
git push origin main
```

## Advanced Configuration

### Environment Variables

Add to your function in `functions.yaml`:

```yaml
name: myFunction
# ... other config ...
env_vars: API_KEY=secret123,DEBUG=true
---
```

### Pub/Sub Triggered Function

1. **Create the Pub/Sub topic**:

```bash
gcloud pubsub topics create my-topic
```

2. **Configure in `functions.yaml`**:

```yaml
name: myPubSubFunction
entry_point: myPubSubFunction
runtime: nodejs18
trigger: topic:my-topic
region: us-central1
memory: 256MB
---
```

3. **Create the function**:

```javascript
const functions = require('@google-cloud/functions-framework');

functions.cloudEvent('myPubSubFunction', (cloudEvent) => {
  const data = cloudEvent.data;
  const message = Buffer.from(data.message.data, 'base64').toString();
  console.log('Message:', message);
});

module.exports = { functionName: 'myPubSubFunction' };
```

### Cloud Storage Triggered Function

1. **Create bucket**:

```bash
gsutil mb gs://my-upload-bucket
```

2. **Configure in `functions.yaml`**:

```yaml
name: processUpload
entry_point: processUpload
runtime: nodejs18
trigger: bucket:my-upload-bucket
region: us-central1
memory: 1GB
timeout: 540s
---
```

### Scheduled Functions (Cron Jobs)

1. **Create Pub/Sub topic**:

```bash
gcloud pubsub topics create scheduled-tasks
```

2. **Deploy function with Pub/Sub trigger** (see above)

3. **Create Cloud Scheduler job**:

```bash
gcloud scheduler jobs create pubsub my-scheduled-job \
  --location=us-central1 \
  --schedule="0 9 * * *" \
  --topic=scheduled-tasks \
  --message-body='{"task": "daily-report"}'
```

This runs daily at 9 AM.

## Troubleshooting

### Issue: GitHub Action Fails with Authentication Error

**Solution:**
1. Verify `GCP_SA_KEY` secret is set in GitHub
2. Check the key is valid JSON:
   ```bash
   cat ~/gcp-sa-key.json | jq .
   ```
3. Ensure service account has required roles

### Issue: Function Deploys but Returns 403/401

**Solution:**
- Function might require authentication
- Add `--allow-unauthenticated` in `functions.yaml` (already default for HTTP)
- Or call with authentication header

### Issue: Function Times Out

**Solution:**
- Increase `timeout` in `functions.yaml` (max 540s)
- Optimize your code
- Check for slow external API calls
- Use asynchronous operations

### Issue: Permission Denied Errors

**Solution:**
```bash
# Re-grant permissions
PROJECT_ID=$(gcloud config get-value project)

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.admin"
```

### Issue: "API not enabled" Error

**Solution:**
```bash
# Enable all required APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Wait 2 minutes, then retry
```

### Issue: Cannot Find Module Error

**Solution:**
- Ensure `package.json` includes the dependency
- Run `npm install` locally to verify
- Check import paths are correct (e.g., `../shared/utils`)

### Issue: Function Not in Deployment List

**Solution:**
- Check `functions.yaml` syntax
- Ensure function ends with `---`
- Verify function file exists in `functions/` directory
- Check GitHub Actions logs for parsing errors

## Testing & Development

### Local Testing

```bash
cd gcsFunctions
npm install

# Test specific function
npx @google-cloud/functions-framework --target=helloWorld --port=8080

# In another terminal
curl http://localhost:8080
```

### View Logs

```bash
# Real-time logs
gcloud functions logs read helloWorld --region=us-central1 --follow

# Last 50 entries
gcloud functions logs read helloWorld --region=us-central1 --limit=50
```

### Manual Deployment

```bash
cd gcsFunctions

gcloud functions deploy helloWorld \
  --source=. \
  --runtime=nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region=us-central1
```

## Security Best Practices

1. **Never commit secrets**
   - Use environment variables
   - Store in GCP Secret Manager for production

2. **Rotate service account keys regularly**
   ```bash
   # Delete old key
   gcloud iam service-accounts keys delete KEY_ID \
     --iam-account=github-actions@PROJECT_ID.iam.gserviceaccount.com
   
   # Create new key
   gcloud iam service-accounts keys create ~/new-key.json \
     --iam-account=github-actions@PROJECT_ID.iam.gserviceaccount.com
   ```

3. **Use least privilege**
   - Only grant necessary permissions
   - Avoid using Owner role

4. **Enable authentication for sensitive endpoints**
   ```yaml
   # Remove --allow-unauthenticated in workflow
   # Or modify the deployment command
   ```

5. **Monitor usage**
   - Set up billing alerts
   - Review Cloud Functions dashboard regularly

## Cost Management

- **Free tier**: 2M invocations/month
- **Monitor usage**: https://console.cloud.google.com/billing
- **Set budget alerts**: Billing → Budgets & alerts

## Additional Resources

- **[Cloud Functions Docs](https://cloud.google.com/functions/docs)**
- **[Functions Framework](https://github.com/GoogleCloudPlatform/functions-framework-nodejs)**
- **[GitHub Actions](https://docs.github.com/en/actions)**
- **[gcloud CLI Reference](https://cloud.google.com/sdk/gcloud/reference/functions)**

## Support

**Email**: espazeindia@gmail.com  
**GitHub Issues**: https://github.com/espazeindia/gcsFunctions/issues

---

**Ready to build?** Start by running `npm run create-function`! 🚀
