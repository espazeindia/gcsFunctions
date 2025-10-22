# 📤 Upload Asset Function - Usage Guide

## Overview

The `uploadAsset` function uploads files to the Google Cloud Storage bucket `espaze-seller-product-assets` with a hierarchical folder structure.

**Bucket:** `espaze-seller-product-assets`  
**Function URL:** `https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset`

---

## 🎯 How It Works

### Input Format

**Path Array:** Represents folder hierarchy + filename
```javascript
["grocery", "instant-foods", "maggi1.png"]
//  folder1    folder2        filename
```

**Result:** File uploaded to `/grocery/instant-foods/maggi1.png`

---

## 📋 API Reference

### Endpoint
```
POST https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset
```

### Method 1: JSON with Base64 (Simple)

**Request:**
```bash
curl -X POST https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset \
  -H "Content-Type: application/json" \
  -d '{
    "path": ["grocery", "instant-foods", "maggi1.png"],
    "file": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "mimeType": "image/png",
    "fileName": "maggi1.png"
  }'
```

**Request Body:**
```typescript
{
  path: string[],        // Array of folders + filename (required)
  file: string,          // Base64 encoded file data (required)
  mimeType?: string,     // MIME type (optional, default: 'application/octet-stream')
  fileName?: string      // Original filename (optional, for metadata)
}
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "bucket": "espaze-seller-product-assets",
    "filePath": "grocery/instant-foods/maggi1.png",
    "publicUrl": "https://storage.googleapis.com/espaze-seller-product-assets/grocery/instant-foods/maggi1.png",
    "size": 1234,
    "mimeType": "image/png"
  }
}
```

---

### Method 2: Multipart Form Data (File Upload)

**HTML Form:**
```html
<form action="https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset" 
      method="POST" 
      enctype="multipart/form-data">
  
  <input type="text" 
         name="path" 
         value='["grocery", "instant-foods", "maggi1.png"]' 
         required>
  
  <input type="file" 
         name="file" 
         required>
  
  <button type="submit">Upload</button>
</form>
```

**JavaScript/Fetch:**
```javascript
const formData = new FormData();
formData.append('path', JSON.stringify(["grocery", "instant-foods", "maggi1.png"]));
formData.append('file', fileInput.files[0]);

const response = await fetch('https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

**cURL:**
```bash
curl -X POST https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset \
  -F 'path=["grocery", "instant-foods", "maggi1.png"]' \
  -F 'file=@/path/to/maggi1.png'
```

---

## 💡 Usage Examples

### Example 1: Upload Product Image
```javascript
// Convert image to base64
const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

const response = await fetch('https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: ["grocery", "instant-foods", "maggi1.png"],
    file: imageBase64,
    mimeType: "image/png",
    fileName: "maggi1.png"
  })
});

const result = await response.json();
console.log('Uploaded to:', result.data.publicUrl);
// Output: https://storage.googleapis.com/espaze-seller-product-assets/grocery/instant-foods/maggi1.png
```

### Example 2: Upload with Form Data
```javascript
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('path', JSON.stringify([
  "electronics",
  "smartphones", 
  "iphone15.jpg"
]));
formData.append('file', file);

const response = await fetch('https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset', {
  method: 'POST',
  body: formData
});

const result = await response.json();
if (result.success) {
  console.log('File URL:', result.data.publicUrl);
}
```

### Example 3: Upload PDF Document
```bash
# Convert PDF to base64
base64_pdf=$(base64 -i invoice.pdf)

# Upload
curl -X POST https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset \
  -H "Content-Type: application/json" \
  -d "{
    \"path\": [\"documents\", \"invoices\", \"invoice-2025-001.pdf\"],
    \"file\": \"$base64_pdf\",
    \"mimeType\": \"application/pdf\",
    \"fileName\": \"invoice.pdf\"
  }"
```

### Example 4: Deep Folder Structure
```javascript
// Upload to nested folders
const path = [
  "sellers",
  "seller-123",
  "products",
  "electronics",
  "smartphones",
  "product-456.jpg"
];

// Result: /sellers/seller-123/products/electronics/smartphones/product-456.jpg
```

---

## 📂 Path Examples

| Input Path | Resulting File Location |
|------------|------------------------|
| `["image.png"]` | `/image.png` |
| `["grocery", "image.png"]` | `/grocery/image.png` |
| `["grocery", "snacks", "chips.jpg"]` | `/grocery/snacks/chips.jpg` |
| `["seller-123", "products", "item.jpg"]` | `/seller-123/products/item.jpg` |
| `["a", "b", "c", "d", "file.pdf"]` | `/a/b/c/d/file.pdf` |

---

## 🔒 Security & Permissions

### File Access
- ✅ Files are **publicly accessible** by default
- 🔗 Anyone with the URL can access the file
- 🌐 Perfect for product images, public assets

### Bucket Permissions
- Service account has **objectAdmin** role
- Can upload, delete, and manage files
- Bucket: `espaze-seller-product-assets`

### Change to Private Files
If you want files to be private, edit the function and remove this line:
```javascript
// Remove or comment out this line:
await file.makePublic();
```

---

## ⚠️ Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error message here",
  "details": "Additional error details"
}
```

### Common Errors

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Missing required fields: path and file"
}
```

**400 Invalid Path:**
```json
{
  "success": false,
  "error": "path must be a non-empty array"
}
```

**400 Invalid Base64:**
```json
{
  "success": false,
  "error": "Invalid base64 file data"
}
```

**404 Bucket Not Found:**
```json
{
  "success": false,
  "error": "Bucket 'espaze-seller-product-assets' not found. Please create it first."
}
```

**403 Permission Denied:**
```json
{
  "success": false,
  "error": "Permission denied. Check service account permissions."
}
```

**405 Method Not Allowed:**
```json
{
  "success": false,
  "error": "Method not allowed. Use POST."
}
```

---

## 🧪 Testing

### Test Locally

1. **Start the function:**
```bash
cd gcsFunctions
npm install
npm start
```

2. **Test with cURL:**
```bash
# Create a test file
echo "Hello World" > test.txt

# Convert to base64
base64_content=$(base64 -i test.txt)

# Upload
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d "{
    \"path\": [\"test\", \"test.txt\"],
    \"file\": \"$base64_content\",
    \"mimeType\": \"text/plain\"
  }"
```

3. **Test with file upload:**
```bash
curl -X POST http://localhost:8080 \
  -F 'path=["test", "upload.txt"]' \
  -F 'file=@test.txt'
```

---

## 📊 File Size Limits

- **Maximum file size:** ~10MB for base64 (Cloud Functions request limit)
- **Maximum file size:** ~32MB for multipart upload
- **Timeout:** 300 seconds (5 minutes)
- **Memory:** 512MB allocated

### For Larger Files
For files > 32MB, consider:
1. Direct upload to Cloud Storage with signed URLs
2. Chunked upload mechanism
3. Cloud Storage Transfer Service

---

## 🚀 Deployment

Deploy the function:
```bash
git add .
git commit -m "Add uploadAsset function"
git push origin master
```

Monitor deployment:
- **GitHub Actions:** https://github.com/espazeindia/gcsFunctions/actions
- **GCP Console:** https://console.cloud.google.com/functions?project=espaze-assets

---

## 📋 Complete Node.js Example

```javascript
const fs = require('fs');
const fetch = require('node-fetch');

async function uploadFile(localFilePath, remotePath) {
  // Read file
  const fileBuffer = fs.readFileSync(localFilePath);
  
  // Convert to base64
  const base64File = fileBuffer.toString('base64');
  
  // Get mime type
  const mimeType = 'image/png'; // Set appropriate type
  
  // Upload
  const response = await fetch(
    'https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: remotePath,
        file: base64File,
        mimeType: mimeType,
        fileName: path.basename(localFilePath)
      })
    }
  );
  
  const result = await response.json();
  
  if (result.success) {
    console.log('✅ Upload successful!');
    console.log('📁 File path:', result.data.filePath);
    console.log('🔗 Public URL:', result.data.publicUrl);
    return result.data.publicUrl;
  } else {
    console.error('❌ Upload failed:', result.error);
    throw new Error(result.error);
  }
}

// Usage
uploadFile('./maggi1.png', ['grocery', 'instant-foods', 'maggi1.png'])
  .then(url => console.log('Done:', url))
  .catch(err => console.error('Error:', err));
```

---

## 🔍 Verify Uploaded Files

```bash
# List all files in bucket
gsutil ls -r gs://espaze-seller-product-assets/

# List files in specific folder
gsutil ls gs://espaze-seller-product-assets/grocery/instant-foods/

# View file metadata
gsutil stat gs://espaze-seller-product-assets/grocery/instant-foods/maggi1.png

# Download file
gsutil cp gs://espaze-seller-product-assets/grocery/instant-foods/maggi1.png ./
```

---

## 📚 Additional Resources

- **Function Code:** `gcsFunctions/functions/uploadAsset.js`
- **Configuration:** `gcsFunctions/functions.yaml`
- **Bucket:** `gs://espaze-seller-product-assets`
- **GCS Console:** https://console.cloud.google.com/storage/browser/espaze-seller-product-assets?project=espaze-assets

---

## 🎉 Ready to Use!

Your upload function is configured and ready to deploy!

```bash
git add .
git commit -m "Add uploadAsset function for file uploads"
git push origin master
```

After deployment, test it:
```bash
curl -X POST https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset \
  -F 'path=["test", "hello.txt"]' \
  -F 'file=@README.md'
```

**Happy uploading! 📤**

