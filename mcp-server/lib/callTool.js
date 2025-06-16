const path = require('path');

module.exports = async function callTool(toolName, input) {
  try {
    const tool = require(path.resolve(__dirname, `../tools/${toolName}/index.js`));
    return await tool.run(input);
  } catch (err) {
    console.error(`❌ Failed to run tool "${toolName}":`, err);
    return null;
  }
};

