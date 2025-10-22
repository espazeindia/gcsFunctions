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
const busboy = require('busboy');
const { logger, setCorsHeaders, errorResponse, successResponse } = require('../shared/utils');

// Initialize Google Cloud Storage
const storage = new Storage();
const BUCKET_NAME = 'espaze-seller-product-assets';

/**
 * Parse multipart form data with proper error handling
 */
function parseMultipartForm(req) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ 
      headers: req.headers,
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 1
      }
    });
    
    const fields = {};
    const files = {};
    let fileProcessed = false;

    bb.on('field', (name, val, info) => {
      logger('uploadAsset', `Field [${name}]: ${val}`);
      fields[name] = val;
    });

    bb.on('file', (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      logger('uploadAsset', `File [${name}]: filename=${filename}, mimeType=${mimeType}`);
      
      const chunks = [];
      
      file.on('data', (data) => {
        chunks.push(data);
      });
      
      file.on('end', () => {
        logger('uploadAsset', `File [${name}] finished, size=${Buffer.concat(chunks).length}`);
        files[name] = {
          filename,
          mimeType,
          encoding,
          buffer: Buffer.concat(chunks)
        };
        fileProcessed = true;
      });
      
      file.on('error', (err) => {
        logger('uploadAsset', `File error: ${err.message}`);
        reject(err);
      });
    });

    bb.on('finish', () => {
      logger('uploadAsset', 'Busboy finished parsing');
      resolve({ fields, files });
    });

    bb.on('error', (err) => {
      logger('uploadAsset', `Busboy error: ${err.message}`);
      reject(err);
    });

    bb.on('close', () => {
      logger('uploadAsset', 'Busboy closed');
    });

    // Pipe the request to busboy
    req.pipe(bb);
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
  logger('uploadAsset', `Content-Type: ${req.get('content-type')}`);
  logger('uploadAsset', `Method: ${req.method}`);

  try {
    let path;
    let fileBuffer;
    let fileName;
    let mimeType;

    const contentType = req.get('content-type') || '';

    // Handle multipart/form-data (file upload)
    if (contentType.includes('multipart/form-data')) {
      logger('uploadAsset', 'Processing multipart form data');

      try {
        const { fields, files } = await parseMultipartForm(req);
        
        logger('uploadAsset', `Fields received: ${Object.keys(fields).join(', ')}`);
        logger('uploadAsset', `Files received: ${Object.keys(files).join(', ')}`);

        // Parse path from form field
        if (!fields.path) {
          return errorResponse(res, 400, 'Missing required field: path');
        }

        try {
          path = JSON.parse(fields.path);
        } catch (e) {
          logger('uploadAsset', `Path parse error: ${e.message}`);
          return errorResponse(res, 400, 'Invalid path format. Must be a JSON array like ["folder", "file.png"]');
        }

        // Get file from form
        if (!files.file) {
          return errorResponse(res, 400, 'Missing required field: file');
        }

        fileBuffer = files.file.buffer;
        fileName = files.file.filename;
        mimeType = files.file.mimeType;
        
      } catch (parseError) {
        logger('uploadAsset', `Parse error: ${parseError.message}`);
        return errorResponse(res, 400, 'Failed to parse multipart form data', parseError.message);
      }

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

    // Validate file buffer
    if (!fileBuffer || fileBuffer.length === 0) {
      return errorResponse(res, 400, 'File is empty or invalid');
    }

    // Construct the full file path
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
    logger('uploadAsset', `Stack: ${error.stack}`);
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
