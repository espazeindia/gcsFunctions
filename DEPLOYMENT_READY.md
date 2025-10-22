# 🚀 Ready to Deploy - Upload Asset Function

## ✅ What's Been Created

### New Function: `uploadAsset`
Uploads files to Google Cloud Storage bucket with hierarchical folder structure.

**Bucket:** `espaze-seller-product-assets`  
**Location:** `gcsFunctions/functions/uploadAsset.js`

---

## 📋 Quick Summary

### Removed:
- ❌ helloWorld
- ❌ getUserData  
- ❌ processWebhook
- ❌ sendNotification
- ❌ scheduledTask

### Added:
- ✅ **uploadAsset** - File upload to GCS with path hierarchy

---

## 🎯 Function Behavior

### Input Example:
```javascript
{
  "path": ["grocery", "instant-foods", "maggi1.png"],
  "file": "base64_encoded_file_data"
}
```

### Output:
- File saved to: `/grocery/instant-foods/maggi1.png`
- Public URL: `https://storage.googleapis.com/espaze-seller-product-assets/grocery/instant-foods/maggi1.png`

---

## 🔧 Configuration

### Function Settings:
- **Runtime:** Node.js 18
- **Memory:** 512MB
- **Timeout:** 300 seconds (5 minutes)
- **Max Instances:** 100
- **Trigger:** HTTP POST

### Dependencies Added:
- `@google-cloud/storage` - GCS client library
- `busboy` - Multipart form data parser

### Permissions:
- ✅ Service account has `objectAdmin` role on bucket
- ✅ Files uploaded as public (anyone can access with URL)

---

## 🚀 Deploy Now

```bash
# Commit all changes
git add .
git commit -m "Add uploadAsset function for GCS file uploads"

# Deploy to Google Cloud
git push origin master
```

---

## 📊 After Deployment

### Function URL:
```
https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset
```

### Test Upload (JSON with Base64):
```bash
# Create test file
echo "Hello World" > test.txt
base64_content=$(base64 -i test.txt)

# Upload
curl -X POST https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset \
  -H "Content-Type: application/json" \
  -d "{
    \"path\": [\"test\", \"hello.txt\"],
    \"file\": \"$base64_content\",
    \"mimeType\": \"text/plain\"
  }"
```

### Test Upload (Form Data):
```bash
curl -X POST https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset \
  -F 'path=["test", "upload.txt"]' \
  -F 'file=@test.txt'
```

---

## 📚 Documentation

- **Complete Guide:** `gcsFunctions/UPLOAD_ASSET_GUIDE.md`
- **Function Code:** `gcsFunctions/functions/uploadAsset.js`
- **Configuration:** `gcsFunctions/functions.yaml`

---

## 🔍 Verify Deployment

```bash
# Check function status
gcloud functions describe uploadAsset \
  --project=espaze-assets \
  --region=us-central1

# View logs
gcloud functions logs read uploadAsset \
  --project=espaze-assets \
  --region=us-central1 \
  --limit=50
```

---

## 📦 File Structure

```
gcsFunctions/
├── functions/
│   └── uploadAsset.js          ← New file upload function
├── shared/
│   ├── utils.js                ← Shared utilities
│   └── config.js               ← Configuration
├── functions.yaml              ← Updated (only uploadAsset)
├── package.json                ← Updated (added GCS dependencies)
└── UPLOAD_ASSET_GUIDE.md       ← Complete usage documentation
```

---

## ⚡ Smart Deployment Active

Only `uploadAsset` will deploy since it's the only function that changed!

**Estimated deployment time:** ~30-60 seconds

---

## 🎉 You're All Set!

Run this command to deploy:

```bash
git add . && git commit -m "Add uploadAsset function" && git push origin master
```

Then monitor:
- **GitHub Actions:** https://github.com/espazeindia/gcsFunctions/actions
- **GCP Console:** https://console.cloud.google.com/functions?project=espaze-assets

**Happy uploading! 📤**

