# Changelog

All notable changes to this project will be documented in this file, most recent at the top.
Commenced from version 3.0.0.


## [v3.0.2] - 2025-08-20
### Fixed
- Added missing `cors` and `concurrently` dependencies to `package.json` (prevents startup error in MCP server).
- Updated README links (License, Changelog) for correct Markdown formatting.

### Improved
- Confirmed install & run instructions with a clean ZIP download test (ensures a smooth new-user setup).



## [v3.0.1] - 2025-08-20
### Added
- Introduced `.env.example` to help users configure environment variables.
- Added a lightweight `server.js` for serving the Web UI alongside the MCP server.
- New `chatdemo` script in `package.json` to run MCP server and Web UI together with `concurrently`.

### Changed
- Updated README.md with new startup instructions and clarified prerequisites.
- Improved developer experience by providing both `chatdemo` and `dev` aliases.

### Fixed
- Minor formatting issues in README.md links.



## [3.0.0] - 2025-08-20
### Major
This was a major update to bring Github up to date with what had evolved with the local version 
- Introduced **MCP server** and **Agent orchestration**  
  - The Agent now manages message history, prompt construction, and tool invocation.  
  - Chatbot frontend is simplified to a thin client (UI only).  
- Added **Number Plate Risk Scoring tool** (demo of industry-specific extension).  
- Overhauled **project structure** to group tools under `mcp-server/tools/`.  
- Updated **environment configuration** with `.env.example`.  
- Improved **UI layout** and orchestration flow.

### Breaking changes
- The MCP server must be running before the chatbot frontend.  
- Startup scripts have changed — see README for details.  

---

