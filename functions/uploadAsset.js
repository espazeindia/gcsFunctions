/**
 * Upload Asset Function
 * 
 * Uploads files to Google Cloud Storage bucket: espaze-seller-product-assets
 * Organizes files in hierarchical folder structure based on provided path array
 * 
 * Trigger: HTTP POST
 * URL: https://REGION-PROJECT_ID.cloudfunctions.net/uploadAsset
 * 
 * Request Body:
 * {
 *   "path": ["grocery", "instant-foods", "maggi1.png"],  // Array representing folder hierarchy + filename
 *   "file": "base64_encoded_file_data"  // Base64 encoded file content
 * }
 * 
 * OR using multipart/form-data:
 * - path: JSON string array ["grocery", "instant-foods", "maggi1.png"]
 * - file: File upload
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "File uploaded successfully",
 *   "data": {
 *     "bucket": "espaze-seller-product-assets",
 *     "filePath": "grocery/instant-foods/maggi1.png",
 *     "publicUrl": "https://storage.googleapis.com/espaze-seller-product-assets/grocery/instant-foods/maggi1.png"
 *   }
 * }
 */

const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const Busboy = require('busboy');
const { logger, setCorsHeaders, errorResponse, successResponse } = require('../shared/utils');

// Initialize Google Cloud Storage
const storage = new Storage();
const BUCKET_NAME = 'espaze-seller-product-assets';

/**
 * Parse multipart form data
 */
function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    const files = {};

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on('file', (fieldname, file, info) => {
      const { filename, encoding, mimeType } = info;
      const chunks = [];

      file.on('data', (data) => {
        chunks.push(data);
      });

      file.on('end', () => {
        files[fieldname] = {
          filename,
          mimeType,
          encoding,
          buffer: Buffer.concat(chunks)
        };
      });
    });

    busboy.on('finish', () => {
      resolve({ fields, files });
    });

    busboy.on('error', reject);

    req.pipe(busboy);
  });
}

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

  try {
    let path;
    let fileBuffer;
    let fileName;
    let mimeType;

    const contentType = req.get('content-type') || '';

    // Handle multipart/form-data (file upload)
    if (contentType.includes('multipart/form-data')) {
      logger('uploadAsset', 'Processing multipart form data');

      const { fields, files } = await parseMultipartForm(req);

      // Parse path from form field
      if (!fields.path) {
        return errorResponse(res, 400, 'Missing required field: path');
      }

      try {
        path = JSON.parse(fields.path);
      } catch (e) {
        return errorResponse(res, 400, 'Invalid path format. Must be a JSON array.');
      }

      // Get file from form
      if (!files.file) {
        return errorResponse(res, 400, 'Missing required field: file');
      }

      fileBuffer = files.file.buffer;
      fileName = files.file.filename;
      mimeType = files.file.mimeType;

    } 
    // Handle JSON (base64 encoded file)
    else if (contentType.includes('application/json')) {
      logger('uploadAsset', 'Processing JSON with base64 data');

      const { path: pathArray, file: base64File, fileName: providedFileName, mimeType: providedMimeType } = req.body;

      if (!pathArray || !base64File) {
        return errorResponse(res, 400, 'Missing required fields: path and file');
      }

      path = pathArray;
      
      // Decode base64 file
      try {
        fileBuffer = Buffer.from(base64File, 'base64');
      } catch (e) {
        return errorResponse(res, 400, 'Invalid base64 file data');
      }

      fileName = providedFileName || 'file';
      mimeType = providedMimeType || 'application/octet-stream';

    } else {
      return errorResponse(res, 400, 'Content-Type must be multipart/form-data or application/json');
    }

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
    // Join array elements with '/' to create hierarchical path
    const fullPath = path.join('/');
    
    logger('uploadAsset', `Uploading to: ${fullPath}`);
    logger('uploadAsset', `File size: ${fileBuffer.length} bytes`);
    logger('uploadAsset', `MIME type: ${mimeType}`);

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

    // Make file publicly accessible (optional - remove if you want private files)
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
});

module.exports = { functionName: 'uploadAsset' };

