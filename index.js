/**
 * Google Cloud Functions - Main Entry Point
 * 
 * This file automatically imports all function files from the /functions directory
 * 
 * To add a new function:
 * 1. Create a new file in /functions directory (e.g., myFunction.js)
 * 2. Define your function using @google-cloud/functions-framework
 * 3. Export it with module.exports = { functionName: 'yourFunctionName' }
 * 4. Add configuration to functions.yaml
 * 5. Commit and push - it will auto-deploy!
 */

const fs = require('fs');
const path = require('path');

// Auto-import all function files from the /functions directory
const functionsDir = path.join(__dirname, 'functions');

if (fs.existsSync(functionsDir)) {
  const functionFiles = fs.readdirSync(functionsDir)
    .filter(file => file.endsWith('.js'));
  
  console.log(`Loading ${functionFiles.length} function(s)...`);
  
  functionFiles.forEach(file => {
    const functionPath = path.join(functionsDir, file);
    try {
      require(functionPath);
      console.log(`✓ Loaded: ${file}`);
    } catch (error) {
      console.error(`✗ Error loading ${file}:`, error.message);
    }
  });
  
  console.log('All functions loaded successfully!');
} else {
  console.error('Functions directory not found!');
}

// You can also manually import specific functions if needed:
// require('./functions/helloWorld');
// require('./functions/getUserData');
