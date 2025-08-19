const fs = require('fs');
const path = require('path');

function loadToolManifests(toolsDir) {
  const tools = [];

  fs.readdirSync(toolsDir).forEach(toolName => {
    const manifestPath = path.join(toolsDir, toolName, 'manifest.js');
    if (fs.existsSync(manifestPath)) {
      const manifest = require(manifestPath);
      tools.push({
        name: manifest.name || toolName,
        description: manifest.description || '',
        usage: manifest.usageExample || ''
      });
    }
  });

  return tools;
}

module.exports = loadToolManifests;

