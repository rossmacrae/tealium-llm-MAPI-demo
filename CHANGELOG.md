# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0] - 2025-08-20
### Major
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

