#!/usr/bin/env node

/**
 * Function Template Generator
 * 
 * Quickly scaffold a new Google Cloud Function
 * 
 * Usage:
 *   node scripts/create-function.js myFunctionName
 *   npm run create-function myFunctionName
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function toCamelCase(str) {
  return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, char => char.toLowerCase());
}

const httpTemplate = (functionName, description) => `/**
 * ${functionName} Function
 * 
 * ${description}
 * 
 * Trigger: HTTP
 * Method: GET, POST
 * URL: https://REGION-PROJECT_ID.cloudfunctions.net/${functionName}
 */

const functions = require('@google-cloud/functions-framework');
const { logger, setCorsHeaders, errorResponse, successResponse } = require('../shared/utils');

functions.http('${functionName}', async (req, res) => {
  setCorsHeaders(res);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  logger('${functionName}', 'Function invoked');
  
  try {
    // TODO: Add your function logic here
    
    const result = {
      message: 'Function executed successfully',
      timestamp: new Date().toISOString()
    };
    
    successResponse(res, result);
    
  } catch (error) {
    logger('${functionName}', \`Error: \${error.message}\`);
    errorResponse(res, 500, 'Internal server error');
  }
});

module.exports = { functionName: '${functionName}' };
`;

const pubsubTemplate = (functionName, description) => `/**
 * ${functionName} Function
 * 
 * ${description}
 * 
 * Trigger: Pub/Sub Topic
 * Topic: ${toKebabCase(functionName)}-topic
 */

const functions = require('@google-cloud/functions-framework');
const { logger } = require('../shared/utils');

functions.cloudEvent('${functionName}', async (cloudEvent) => {
  logger('${functionName}', 'Function invoked');
  
  try {
    const data = cloudEvent.data;
    const message = data.message 
      ? Buffer.from(data.message.data, 'base64').toString() 
      : 'No message data';
    
    logger('${functionName}', \`Processing message: \${message}\`);
    
    // TODO: Add your function logic here
    
    logger('${functionName}', 'Processing completed successfully');
    
  } catch (error) {
    logger('${functionName}', \`Error: \${error.message}\`);
    throw error;
  }
});

module.exports = { functionName: '${functionName}' };
`;

const storageTemplate = (functionName, description) => `/**
 * ${functionName} Function
 * 
 * ${description}
 * 
 * Trigger: Cloud Storage
 * Bucket: ${toKebabCase(functionName)}-bucket
 */

const functions = require('@google-cloud/functions-framework');
const { logger } = require('../shared/utils');

functions.cloudEvent('${functionName}', async (cloudEvent) => {
  logger('${functionName}', 'Function invoked');
  
  try {
    const file = cloudEvent.data;
    
    logger('${functionName}', \`File: \${file.name}\`);
    logger('${functionName}', \`Bucket: \${file.bucket}\`);
    logger('${functionName}', \`Size: \${file.size} bytes\`);
    logger('${functionName}', \`Content Type: \${file.contentType}\`);
    
    // TODO: Add your file processing logic here
    
    logger('${functionName}', 'File processing completed');
    
  } catch (error) {
    logger('${functionName}', \`Error: \${error.message}\`);
    throw error;
  }
});

module.exports = { functionName: '${functionName}' };
`;

const yamlTemplate = (functionName, trigger, memory = '256MB', timeout = '60s') => {
  let triggerConfig = 'http';
  
  if (trigger === 'pubsub') {
    triggerConfig = `topic:${toKebabCase(functionName)}-topic`;
  } else if (trigger === 'storage') {
    triggerConfig = `bucket:${toKebabCase(functionName)}-bucket`;
  }
  
  return `
# ${functionName} Function
name: ${functionName}
entry_point: ${functionName}
runtime: nodejs18
trigger: ${triggerConfig}
region: us-central1
memory: ${memory}
timeout: ${timeout}
---
`;
};

async function createFunction() {
  console.log('\n🚀 Google Cloud Function Generator\n');
  
  // Get function name
  let functionName = process.argv[2];
  if (!functionName) {
    functionName = await question('Function name (camelCase): ');
  }
  
  functionName = toCamelCase(functionName.trim());
  
  if (!functionName) {
    console.error('❌ Function name is required');
    rl.close();
    process.exit(1);
  }
  
  // Get description
  const description = await question('Description (optional): ') || 'Cloud function';
  
  // Get trigger type
  console.log('\nTrigger type:');
  console.log('  1. HTTP (default)');
  console.log('  2. Pub/Sub');
  console.log('  3. Cloud Storage');
  const triggerChoice = await question('Choose (1-3): ') || '1';
  
  const triggerMap = {
    '1': 'http',
    '2': 'pubsub',
    '3': 'storage'
  };
  
  const trigger = triggerMap[triggerChoice] || 'http';
  
  // Get memory
  const memory = await question('Memory allocation (default: 256MB): ') || '256MB';
  
  // Get timeout
  const timeout = await question('Timeout (default: 60s): ') || '60s';
  
  // Generate files
  const functionsDir = path.join(__dirname, '..', 'functions');
  const functionFile = path.join(functionsDir, `${functionName}.js`);
  
  // Check if function already exists
  if (fs.existsSync(functionFile)) {
    const overwrite = await question(`\n⚠️  Function ${functionName} already exists. Overwrite? (y/N): `);
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ Cancelled');
      rl.close();
      process.exit(0);
    }
  }
  
  // Create function file
  let template;
  if (trigger === 'http') {
    template = httpTemplate(functionName, description);
  } else if (trigger === 'pubsub') {
    template = pubsubTemplate(functionName, description);
  } else {
    template = storageTemplate(functionName, description);
  }
  
  fs.writeFileSync(functionFile, template);
  console.log(`\n✅ Created: functions/${functionName}.js`);
  
  // Append to functions.yaml
  const yamlPath = path.join(__dirname, '..', 'functions.yaml');
  const yamlContent = yamlTemplate(functionName, trigger, memory, timeout);
  fs.appendFileSync(yamlPath, yamlContent);
  console.log(`✅ Updated: functions.yaml`);
  
  // Instructions
  console.log('\n📋 Next steps:');
  console.log(`   1. Edit functions/${functionName}.js to add your logic`);
  console.log('   2. Test locally: npm start');
  console.log('   3. Commit and push to deploy automatically');
  
  if (trigger === 'pubsub') {
    console.log(`\n⚠️  Don't forget to create the Pub/Sub topic:`);
    console.log(`   gcloud pubsub topics create ${toKebabCase(functionName)}-topic`);
  } else if (trigger === 'storage') {
    console.log(`\n⚠️  Don't forget to create the Cloud Storage bucket:`);
    console.log(`   gsutil mb gs://${toKebabCase(functionName)}-bucket`);
  }
  
  console.log('\n✨ Done!\n');
  rl.close();
}

createFunction().catch(error => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});

