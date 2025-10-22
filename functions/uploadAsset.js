/**
 * Upload Asset Function
 * 
 * Uploads files to Google Cloud Storage bucket: espaze-seller-product-assets
 * Organizes files in hierarchical folder structure based on provided path array
 * 
 * Trigger: HTTP POST
 * URL: https://REGION-PROJECT_ID.cloudfunctions.net/uploadAsset
 * 
 * Request Body (multipart/form-data):
 * - path: JSON string array ["grocery", "instant-foods", "maggi1.png"]
 * - file: File upload
 * 
 * OR JSON with base64:
 * {
 *   "path": ["grocery", "instant-foods", "maggi1.png"],
 *   "file": "base64_encoded_file_data"
 * }
 */

const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const { logger, setCorsHeaders, errorResponse, successResponse } = require('../shared/utils');

// Initialize Google Cloud Storage
const storage = new Storage();
const BUCKET_NAME = 'espaze-seller-product-assets';

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

/**
 * Main upload function
 */
functions.http('uploadAsset', (req, res) => {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'Method not allowed. Use POST.');
  }

  logger('uploadAsset', 'Upload request received');
  logger('uploadAsset', `Content-Type: ${req.get('content-type')}`);

  const contentType = req.get('content-type') || '';

  // Handle multipart/form-data (file upload)
  if (contentType.includes('multipart/form-data')) {
    logger('uploadAsset', 'Processing multipart form data with multer');
    
    // Use multer middleware
    upload.single('file')(req, res, async (err) => {
      if (err) {
        logger('uploadAsset', `Multer error: ${err.message}`);
        return errorResponse(res, 400, 'File upload error', err.message);
      }

      try {
        // Get path from form field
        if (!req.body.path) {
          return errorResponse(res, 400, 'Missing required field: path');
        }

        let path;
        try {
          path = JSON.parse(req.body.path);
        } catch (e) {
          logger('uploadAsset', `Path parse error: ${e.message}`);
          return errorResponse(res, 400, 'Invalid path format. Must be a JSON array like ["folder", "file.png"]');
        }

        // Get file from multer
        if (!req.file) {
          return errorResponse(res, 400, 'Missing required field: file');
        }

        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        const mimeType = req.file.mimetype;

        logger('uploadAsset', `File received: ${fileName}, size: ${fileBuffer.length}, type: ${mimeType}`);

        // Validate path array
        if (!Array.isArray(path) || path.length === 0) {
          return errorResponse(res, 400, 'path must be a non-empty array');
        }

        // Validate path elements
        for (const segment of path) {
          if (typeof segment !== 'string' || segment.trim() === '') {
            return errorResponse(res, 400, 'All path segments must be non-empty strings');
          }
        }

        // Construct the full file path
        const fullPath = path.join('/');
        
        logger('uploadAsset', `Uploading to: ${fullPath}`);

        // Get bucket reference
        const bucket = storage.bucket(BUCKET_NAME);

        // Create file reference
        const file = bucket.file(fullPath);

        // Upload file with metadata
        await file.save(fileBuffer, {
          metadata: {
            contentType: mimeType,
            metadata: {
              originalFileName: fileName,
              uploadedAt: new Date().toISOString(),
              uploadedBy: 'uploadAsset-function'
            }
          },
          resumable: false
        });

        // Make file publicly accessible
        await file.makePublic();

        logger('uploadAsset', `File uploaded successfully: ${fullPath}`);

        // Generate public URL
        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fullPath}`;

        // Return success response
        return successResponse(res, {
          bucket: BUCKET_NAME,
          filePath: fullPath,
          publicUrl: publicUrl,
          size: fileBuffer.length,
          mimeType: mimeType
        }, 'File uploaded successfully');

      } catch (error) {
        logger('uploadAsset', `Upload error: ${error.message}`);
        console.error('Upload error:', error);

        // Handle specific GCS errors
        if (error.code === 404) {
          return errorResponse(res, 404, `Bucket '${BUCKET_NAME}' not found. Please create it first.`);
        }

        if (error.code === 403) {
          return errorResponse(res, 403, 'Permission denied. Check service account permissions.');
        }

        return errorResponse(res, 500, 'Failed to upload file', error.message);
      }
    });
    
  } 
  // Handle JSON (base64 encoded file)
  else if (contentType.includes('application/json')) {
    logger('uploadAsset', 'Processing JSON with base64 data');

    (async () => {
      try {
        const { path: pathArray, file: base64File, fileName: providedFileName, mimeType: providedMimeType } = req.body;

        if (!pathArray || !base64File) {
          return errorResponse(res, 400, 'Missing required fields: path and file');
        }

        const path = pathArray;
        
        // Decode base64 file
        let fileBuffer;
        try {
          fileBuffer = Buffer.from(base64File, 'base64');
        } catch (e) {
          return errorResponse(res, 400, 'Invalid base64 file data');
        }

        const fileName = providedFileName || 'file';
        const mimeType = providedMimeType || 'application/octet-stream';

        // Validate path array
        if (!Array.isArray(path) || path.length === 0) {
          return errorResponse(res, 400, 'path must be a non-empty array');
        }

        // Validate path elements
        for (const segment of path) {
          if (typeof segment !== 'string' || segment.trim() === '') {
            return errorResponse(res, 400, 'All path segments must be non-empty strings');
          }
        }

        // Validate file buffer
        if (!fileBuffer || fileBuffer.length === 0) {
          return errorResponse(res, 400, 'File is empty or invalid');
        }

        // Construct the full file path
        const fullPath = path.join('/');
        
        logger('uploadAsset', `Uploading to: ${fullPath}`);
        logger('uploadAsset', `File size: ${fileBuffer.length} bytes`);

        // Get bucket reference
        const bucket = storage.bucket(BUCKET_NAME);

        // Create file reference
        const file = bucket.file(fullPath);

        // Upload file with metadata
        await file.save(fileBuffer, {
          metadata: {
            contentType: mimeType,
            metadata: {
              originalFileName: fileName,
              uploadedAt: new Date().toISOString(),
              uploadedBy: 'uploadAsset-function'
            }
          },
          resumable: false
        });

        // Make file publicly accessible
        await file.makePublic();

        logger('uploadAsset', `File uploaded successfully: ${fullPath}`);

        // Generate public URL
        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fullPath}`;

        // Return success response
        return successResponse(res, {
          bucket: BUCKET_NAME,
          filePath: fullPath,
          publicUrl: publicUrl,
          size: fileBuffer.length,
          mimeType: mimeType
        }, 'File uploaded successfully');

      } catch (error) {
        logger('uploadAsset', `Error: ${error.message}`);
        console.error('Upload error:', error);

        // Handle specific GCS errors
        if (error.code === 404) {
          return errorResponse(res, 404, `Bucket '${BUCKET_NAME}' not found. Please create it first.`);
        }

        if (error.code === 403) {
          return errorResponse(res, 403, 'Permission denied. Check service account permissions.');
        }

        return errorResponse(res, 500, 'Failed to upload file', error.message);
      }
    })();
    
  } else {
    return errorResponse(res, 400, 'Content-Type must be multipart/form-data or application/json');
  }
});

module.exports = { functionName: 'uploadAsset' };
