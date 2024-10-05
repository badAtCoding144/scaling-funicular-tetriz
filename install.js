// install.js
const { exec } = require('child_process');
const path = require('path');

// Function to run 'npm install' in a specific directory
function runNpmInstall(directory) {
  return new Promise((resolve, reject) => {
    exec('npm install', { cwd: directory }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error installing dependencies in ${directory}:`, error);
        reject(error);
        return;
      }

      console.log(`Installed dependencies in ${directory}`);
      console.log(stdout);
      if (stderr) {
        console.error(stderr);
      }

      resolve();
    });
  });
}

// Directories for client and server
const rootDir = process.cwd();
const clientDir = path.join(rootDir, 'client');
const serverDir = path.join(rootDir, 'server');

// Run npm install in both directories
Promise.all([runNpmInstall(clientDir), runNpmInstall(serverDir)])
  .then(() => {
    console.log('All dependencies installed successfully.');
  })
  .catch((err) => {
    console.error('Error installing dependencies:', err);
  });
