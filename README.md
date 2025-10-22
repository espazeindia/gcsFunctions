# Google Cloud Functions - Espaze India

Serverless functions for file uploads and asset management.

## 📦 Functions

### uploadAsset
Upload files to Google Cloud Storage bucket with hierarchical folder structure.

**Endpoint:** POST /uploadAsset  
**Bucket:** espaze-seller-product-assets

See [UPLOAD_ASSET_GUIDE.md](./UPLOAD_ASSET_GUIDE.md) for complete documentation.

## 🚀 Quick Start

Deploy:
```bash
git push origin master
```

Test Locally:
```bash
npm install
npm start
```

## 📚 Documentation

- UPLOAD_ASSET_GUIDE.md - Complete API reference
- DEPLOYMENT_READY.md - Deployment guide  
- WORKLOAD_IDENTITY_SETUP_COMPLETE.md - GCP setup

## 🌐 Live Function

https://us-central1-espaze-assets.cloudfunctions.net/uploadAsset
