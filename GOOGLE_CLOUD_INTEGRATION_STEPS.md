# 🚀 Google Cloud Integration - Step by Step Guide

Follow these steps **in order** to integrate your Cloud Functions with Google Cloud.

## ✅ Step 1: Initialize gcloud CLI

First, let's set up your terminal to use gcloud:

```bash
# Add gcloud to your PATH (run this now)
source ~/google-cloud-sdk/path.zsh.inc

# Verify installation
gcloud --version
```

## ✅ Step 2: Login to Google Cloud

```bash
# This will open a browser window to login
gcloud auth login
```

Follow the prompts in your browser to authenticate.

## ✅ Step 3: Create or Select a Project

### Option A: List existing projects
```bash
# See your existing projects
gcloud projects list
```

### Option B: Create a new project
```bash
# Create a new project (replace 'espaze-functions' with your preferred name)
gcloud projects create espaze-functions-2025 --name="Espaze Functions"

# Set it as your active project
gcloud config set project espaze-functions-2025
```

### Option C: Use existing project
```bash
# Set an existing project as active
gcloud config set project YOUR_PROJECT_ID
```

## ✅ Step 4: Enable Required APIs

```bash
# Get your current project ID
PROJECT_ID=$(gcloud config get-value project)
echo "Your project ID: $PROJECT_ID"

# Enable Cloud Functions API
gcloud services enable cloudfunctions.googleapis.com

# Enable Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Enable Cloud Resource Manager API  
gcloud services enable cloudresourcemanager.googleapis.com

# Enable Artifact Registry API
gcloud services enable artifactregistry.googleapis.com

# This takes about 1-2 minutes
echo "✅ APIs enabled successfully!"
```

## ✅ Step 5: Create Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --description="Service account for GitHub Actions CI/CD" \
  --display-name="GitHub Actions Deployer"

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

echo "✅ Service account created with permissions!"
```

## ✅ Step 6: Create and Download Service Account Key

```bash
# Create key file
gcloud iam service-accounts keys create ~/gcp-sa-key.json \
  --iam-account=github-actions@${PROJECT_ID}.iam.gserviceaccount.com

echo "✅ Key created at: ~/gcp-sa-key.json"
echo ""
echo "⚠️  IMPORTANT: You'll need this file in the next step!"
```

## ✅ Step 7: Add Secret to GitHub

### 7a. Copy the Key Content

```bash
# Display the key (copy the ENTIRE output including { and })
cat ~/gcp-sa-key.json
```

**Copy the entire JSON output from above!**

### 7b. Add to GitHub Repository

1. Go to: **https://github.com/espazeindia/gcsFunctions/settings/secrets/actions**

2. Click **"New repository secret"**

3. Fill in:
   - **Name:** `GCP_SA_KEY`
   - **Secret:** Paste the entire JSON you copied above

4. Click **"Add secret"**

### 7c. Secure the Key File

```bash
# Delete the local key file for security
rm ~/gcp-sa-key.json

# Verify it's deleted
ls ~/gcp-sa-key.json  # Should show "No such file or directory"
```

## ✅ Step 8: Test Local Deployment (Optional)

Before pushing to GitHub, test locally:

```bash
cd /Users/rohitgupta/Downloads/Espaze/gcsFunctions

# Install dependencies
npm install

# Test a function locally
npm start

# In another terminal, test it:
curl http://localhost:8080
```

## ✅ Step 9: Deploy to GitHub (Automatic Deployment)

```bash
cd /Users/rohitgupta/Downloads/Espaze

# Add all files
git add .

# Commit  
git commit -m "Setup Google Cloud Functions with CI/CD"

# Push to GitHub (this triggers automatic deployment!)
git push origin main
```

## ✅ Step 10: Monitor Deployment

### Check GitHub Actions

1. Go to: **https://github.com/espazeindia/gcsFunctions/actions**
2. You should see a workflow running
3. Click on it to see deployment progress
4. Wait for all functions to deploy (3-5 minutes)

### Check Google Cloud Console

1. Go to: **https://console.cloud.google.com/functions**
2. Select your project from the dropdown
3. You should see your deployed functions!

## ✅ Step 11: Test Your Deployed Functions

```bash
# List deployed functions
gcloud functions list --regions=us-central1

# Get function URL
gcloud functions describe helloWorld --region=us-central1 --format="value(httpsTrigger.url)"

# Test it!
curl "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/helloWorld?name=Espaze"
```

---

## 🎉 Success! You're Done!

Your functions are now:
- ✅ Deployed to Google Cloud
- ✅ Automatically redeployed on every push
- ✅ Accessible via HTTPS URLs
- ✅ Monitored in Cloud Console

## 📝 What's Next?

### Create a New Function

```bash
cd gcsFunctions
npm run create-function
# Follow prompts, then:
git add . && git commit -m "Add new function" && git push
```

### View Logs

```bash
# Real-time logs
gcloud functions logs read helloWorld --region=us-central1 --follow

# Last 50 entries
gcloud functions logs read helloWorld --region=us-central1 --limit=50
```

### Update an Existing Function

1. Edit the file in `gcsFunctions/functions/`
2. Commit and push - it auto-deploys!

```bash
git add .
git commit -m "Update function"
git push
```

---

## 🆘 Troubleshooting

### Issue: "Project not found"
**Solution:** Make sure you set the project:
```bash
gcloud config set project YOUR_PROJECT_ID
```

### Issue: "Permission denied"
**Solution:** Re-grant permissions:
```bash
PROJECT_ID=$(gcloud config get-value project)
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.admin"
```

### Issue: "API not enabled"
**Solution:** Enable the APIs:
```bash
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Issue: GitHub Action fails
**Solution:** 
1. Check that `GCP_SA_KEY` secret is set in GitHub
2. Verify the JSON is valid (should start with `{` and end with `}`)
3. Check GitHub Actions logs for detailed error

---

## 📚 Documentation

- [Complete Setup Guide](./SETUP_GUIDE.md)
- [Functions Documentation](./gcsFunctions/readme.md)
- [Google Cloud Functions Docs](https://cloud.google.com/functions/docs)

## 👥 Support

**Email:** espazeindia@gmail.com  
**GitHub:** [@espazeindia](https://github.com/espazeindia)

---

**Ready to deploy?** Start with Step 1! 🚀

