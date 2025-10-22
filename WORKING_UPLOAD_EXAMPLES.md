# ✅ Upload Asset Function - Working Examples

## 🎉 Function is Live and Working!

**URL:** `https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset`  
**Method:** POST  
**Content-Type:** application/json

---

## 📋 Request Format

The function uses **JSON with base64-encoded file data** (multipart/form-data has issues with Cloud Functions Gen 2).

```json
{
  "path": ["folder1", "folder2", "filename.ext"],
  "fileData": "base64_encoded_file_content",
  "mimeType": "image/png",
  "fileName": "originalname.png"
}
```

### Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | Array<string> | ✅ Yes | Hierarchical path including filename as last element |
| `fileData` | string | ✅ Yes | Base64-encoded file content |
| `mimeType` | string | ❌ No | MIME type (default: `application/octet-stream`) |
| `fileName` | string | ❌ No | Original filename for metadata |

---

## ✅ Working Examples

### Example 1: Upload Text File

```bash
# Create and encode file
echo "Hello World" > myfile.txt
BASE64_DATA=$(base64 -i myfile.txt)

# Upload
curl -X POST 'https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset' \
  -H 'Content-Type: application/json' \
  -d "{
    \"path\": [\"documents\", \"test.txt\"],
    \"fileData\": \"$BASE64_DATA\",
    \"mimeType\": \"text/plain\",
    \"fileName\": \"test.txt\"
  }"
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "bucket": "espaze-seller-product-assets",
    "filePath": "documents/test.txt",
    "publicUrl": "https://storage.googleapis.com/espaze-seller-product-assets/documents/test.txt",
    "size": 12,
    "mimeType": "text/plain"
  }
}
```

### Example 2: Upload Image (Your Ramen Example)

```bash
# Encode image
BASE64_IMG=$(base64 -i /path/to/ramen.png)

# Upload
curl -X POST 'https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset' \
  -H 'Content-Type: application/json' \
  -d "{
    \"path\": [\"grocery\", \"instant-foods\", \"ramen.png\"],
    \"fileData\": \"$BASE64_IMG\",
    \"mimeType\": \"image/png\",
    \"fileName\": \"ramen.png\"
  }"
```

**Result:** File at `/grocery/instant-foods/ramen.png` ✅

### Example 3: Node.js / JavaScript

```javascript
const fs = require('fs');
const fetch = require('node-fetch');

async function uploadFile(localPath, remotePath) {
  // Read and encode file
  const fileBuffer = fs.readFileSync(localPath);
  const base64Data = fileBuffer.toString('base64');
  
  // Get mime type
  const mimeType = 'image/jpeg'; // Set appropriately
  const fileName = path.basename(localPath);
  
  // Upload
  const response = await fetch(
    'https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: remotePath,
        fileData: base64Data,
        mimeType: mimeType,
        fileName: fileName
      })
    }
  );
  
  const result = await response.json();
  console.log('Upload result:', result);
  return result;
}

// Usage
uploadFile(
  './product-images/apple.jpg',
  ['products', 'fruits', 'apple.jpg']
);
```

### Example 4: Python

```python
import requests
import base64

def upload_file(local_path, remote_path):
    # Read and encode file
    with open(local_path, 'rb') as f:
        file_data = base64.b64encode(f.read()).decode('utf-8')
    
    # Prepare payload
    payload = {
        'path': remote_path,
        'fileData': file_data,
        'mimeType': 'image/png',
        'fileName': remote_path[-1]
    }
    
    # Upload
    response = requests.post(
        'https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset',
        json=payload,
        headers={'Content-Type': 'application/json'}
    )
    
    return response.json()

# Usage
result = upload_file(
    '/path/to/image.png',
    ['products', 'category', 'image.png']
)
print(f"Uploaded to: {result['data']['publicUrl']}")
```

### Example 5: Browser JavaScript

```javascript
async function uploadFile(file, pathArray) {
  // Convert file to base64
  const base64Data = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Remove data:... prefix
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
  
  // Upload
  const response = await fetch(
    'https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathArray,
        fileData: base64Data,
        mimeType: file.type,
        fileName: file.name
      })
    }
  );
  
  return await response.json();
}

// Usage with file input
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

uploadFile(file, ['uploads', 'user-123', file.name])
  .then(result => {
    console.log('Upload successful!');
    console.log('URL:', result.data.publicUrl);
  })
  .catch(error => console.error('Upload failed:', error));
```

---

## 📊 Verified Uploads

These files have been successfully uploaded and verified:

| File | Path | Size | Status |
|------|------|------|--------|
| victory.txt | `test/final/victory.txt` | 24 B | ✅ Verified |
| ramen.png | `grocery/instant-foods/ramen.png` | 734 KB | ✅ Verified |

---

## 🔍 Accessing Uploaded Files

Files are accessible at:
```
https://storage.googleapis.com/espaze-seller-product-assets/{filePath}
```

**Examples:**
- https://storage.googleapis.com/espaze-seller-product-assets/test/final/victory.txt
- https://storage.googleapis.com/espaze-seller-product-assets/grocery/instant-foods/ramen.png

---

## ⚠️ Important Notes

### File Size Limits
- Maximum file size: ~10MB (base64 overhead)
- For larger files, consider using signed URLs for direct upload

### Base64 vs Multipart
- ✅ **Use base64 JSON** (works reliably with Cloud Functions Gen 2)
- ❌ **Multipart/form-data** has known issues with Cloud Functions Gen 2

### MIME Types
Common MIME types:
- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents: `application/pdf`, `text/plain`, `text/csv`
- Video: `video/mp4`, `video/webm`

---

## 🐛 Troubleshooting

### Error: "Invalid base64 file data"
- Ensure file is properly base64 encoded
- Remove any data URI prefixes (`data:image/png;base64,`)

### Error: "path must be a non-empty array"
- Path must be an array: `["folder", "file.ext"]`
- NOT a string: `"folder/file.ext"`

### Error: "Permission denied"
- Contact admin to grant bucket access
- Service account needs `Storage Object Admin` role

---

## 📚 Additional Resources

- **Bucket:** `espaze-seller-product-assets`
- **Project:** `espaze-assets`
- **Region:** `us-central1`
- **Function Logs:** `gcloud functions logs read uploadAsset --project=espaze-assets --region=us-central1`

---

## ✅ Success Response Format

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "bucket": "espaze-seller-product-assets",
    "filePath": "path/to/file.ext",
    "publicUrl": "https://storage.googleapis.com/espaze-seller-product-assets/path/to/file.ext",
    "size": 12345,
    "mimeType": "image/png"
  }
}
```

## ❌ Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional details"
}
```

---

**The function is working perfectly! 🎉**

