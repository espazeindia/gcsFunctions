/**
 * Upload Asset Function
 * 
 * Uploads files to Google Cloud Storage bucket: espaze-seller-product-assets
 * 
 * Due to Cloud Functions Gen 2 limitations with multipart/form-data,
 * this function works with JSON + base64 encoding.
 * 
 * Trigger: HTTP POST
 * URL: https://REGION-PROJECT_ID.cloudfunctions.net/uploadAsset
 * 
 * Request Body (JSON with base64):
 * {
 *   "path": ["grocery", "instant-foods", "maggi1.png"],
 *   "fileData": "base64_encoded_file_data",
 *   "mimeType": "image/png",
 *   "fileName": "maggi1.png"
 * }
 */

const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const { logger, setCorsHeaders, errorResponse, successResponse } = require('../shared/utils');

// Initialize Google Cloud Storage
const storage = new Storage();
const BUCKET_NAME = 'espaze-seller-product-assets';

/**
 * Main upload function
 */
functions.http('uploadAsset', async (req, res) => {
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

  try {
    const { path: pathArray, fileData, mimeType, fileName } = req.body;

    // Validate required fields
    if (!pathArray) {
      return errorResponse(res, 400, 'Missing required field: path');
    }

    if (!fileData) {
      return errorResponse(res, 400, 'Missing required field: fileData (base64 encoded file)');
    }

    // Validate path array
    if (!Array.isArray(pathArray) || pathArray.length === 0) {
      return errorResponse(res, 400, 'path must be a non-empty array');
    }

    // Validate path elements
    for (const segment of pathArray) {
      if (typeof segment !== 'string' || segment.trim() === '') {
        return errorResponse(res, 400, 'All path segments must be non-empty strings');
      }
    }

    // Decode base64 file
    let fileBuffer;
    try {
      fileBuffer = Buffer.from(fileData, 'base64');
    } catch (e) {
      logger('uploadAsset', `Base64 decode error: ${e.message}`);
      return errorResponse(res, 400, 'Invalid base64 file data');
    }

    // Validate file buffer
    if (!fileBuffer || fileBuffer.length === 0) {
      return errorResponse(res, 400, 'File is empty or invalid');
    }

    const fileMimeType = mimeType || 'application/octet-stream';
    const originalFileName = fileName || pathArray[pathArray.length - 1];

    // Construct the full file path
    const fullPath = pathArray.join('/');
    
    logger('uploadAsset', `Uploading to: ${fullPath}`);
    logger('uploadAsset', `File size: ${fileBuffer.length} bytes`);
    logger('uploadAsset', `MIME type: ${fileMimeType}`);

    // Get bucket reference
    const bucket = storage.bucket(BUCKET_NAME);

    // Create file reference
    const file = bucket.file(fullPath);

    // Upload file with metadata
    await file.save(fileBuffer, {
      metadata: {
        contentType: fileMimeType,
        metadata: {
          originalFileName: originalFileName,
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
      mimeType: fileMimeType
    }, 'File uploaded successfully');

  } catch (error) {
    logger('uploadAsset', `Error: ${error.message}`);
    logger('uploadAsset', `Stack: ${error.stack}`);
    console.error('Upload error:', error);

    // Handle specific GCS errors
    if (error.code === 404) {
      return errorResponse(res, 404, `Bucket '${BUCKET_NAME}' not found.`);
    }

    if (error.code === 403) {
      return errorResponse(res, 403, 'Permission denied. Check service account permissions.');
    }

    return errorResponse(res, 500, 'Failed to upload file', error.message);
  }
});

module.exports = { functionName: 'uploadAsset' };
