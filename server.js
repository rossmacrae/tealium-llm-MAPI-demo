// server.js - tiny static web server for the demo UI
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve everything in repo root (index.html, app.js, assets, etc.)
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`Web UI available at http://localhost:${PORT}`);
});
