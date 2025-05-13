#!/bin/bash

# Navigate to the project directory
cd ~/Projects/tealium-llm-MAPI-demo || {
  echo "❌ Project folder not found!";
  exit 1;
}

# Open the project in VS Code
echo "🟢 Launching VS Code..."
code .

# Start the proxy server in a new Terminal window
echo "🟢 Starting proxy server in new Terminal window..."
osascript <<EOF
tell application "Terminal"
  do script "cd ~/Projects/tealium-llm-MAPI-demo && node proxy-server.js"
  activate
end tell
EOF

echo "✅ Ready! Open index.html in VS Code and right-click → Open with Live Server."

