import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

import {
  Server
} from "@modelcontextprotocol/sdk/server/index.js";

import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const PORT = Number(process.env.MCP_ADAPTER_PORT || 3333);
const TOOL_RUNNER_BASE_URL =
  process.env.TOOL_RUNNER_BASE_URL || "http://localhost:3002";

// repo paths (assumes mcp-adapter and mcp-server are siblings)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");
const TOOLS_DIR = path.resolve(REPO_ROOT, "mcp-server/tools");

// Exclude per your requirement
const EXCLUDE_FOLDERS = new Set(["agent"]);

// Demo-friendly ordering for tools
const PREFERRED_ORDER = [
  "fetch-profile",
  "fetch-anon-profile",
  "send-to-tealium",
  "send-anon-to-tealium",
  "interpret-message",
  "construct-prompt-end-customer",
  "construct-prompt-cs-copilot",
  "generate-response",
  "number-plate-risk-score",
  "send-plate-score-to-tealium",
  "construct-prompt"
];

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    console.warn(`⚠️ Skipping invalid JSON manifest: ${filePath}`);
    console.warn(`   ${String(e?.message || e)}`);
    return null;
  }
}

function formatType(def) {
  if (!def) return "";
  if (def.type === "array") {
    const itemType = def.items?.type ? def.items.type : "any";
    return `array<${itemType}>`;
  }
  return def.type || "";
}

function formatInputs(parameters) {
  const props = parameters?.properties || {};
  const required = new Set(parameters?.required || []);
  const lines = [];

  for (const [key, def] of Object.entries(props)) {
    const type = formatType(def);
    const req = required.has(key) ? "required" : "optional";
    const desc = def?.description ? `— ${def.description}` : "";
    lines.push(`• ${key}${type ? ` (${type})` : ""} — ${req} ${desc}`.trim());

    // extra detail for arrays of objects (like history)
    if (def?.type === "array" && def.items?.type === "object" && def.items?.properties) {
      const itemProps = Object.keys(def.items.properties);
      if (itemProps.length) {
        lines.push(` ↳ items: { ${itemProps.join(", ")} }`);
      }
    }
  }

  return lines.length ? `\n\nInputs:\n${lines.join("\n")}` : "";
}

function summarizeOutputs(manifest) {
  const out = manifest.returns || manifest.output || manifest.response || null;
  if (!out) return "";

  const props = out.properties || null;
  if (!props || typeof props !== "object") return "";

  const keys = Object.keys(props);
  if (!keys.length) return "";

  const summary = keys.slice(0, 8).join(", ") + (keys.length > 8 ? ", ..." : "");
  return `\n\nOutputs:\n• ${summary}`;
}

function loadToolDefs() {
  if (!fs.existsSync(TOOLS_DIR)) {
    throw new Error(`TOOLS_DIR not found: ${TOOLS_DIR}`);
  }

  const entries = fs.readdirSync(TOOLS_DIR, { withFileTypes: true });
  const folders = entries.filter(e => e.isDirectory()).map(e => e.name);

  const tools = [];

  for (const folder of folders) {
    if (EXCLUDE_FOLDERS.has(folder)) continue;

    const manifestPath = path.join(TOOLS_DIR, folder, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;

    const manifest = safeReadJson(manifestPath);
    if (!manifest) continue;

    const baseDesc =
      manifest.description ||
      manifest.summary ||
      manifest?.tool?.description ||
      `Tool: ${folder}`;

    const inputsHint = formatInputs(manifest.parameters);
    const outputsHint = summarizeOutputs(manifest);

    // Prefer manifest.parameters as the input schema; fall back to permissive
    const inputSchema =
      manifest.parameters && typeof manifest.parameters === "object"
        ? manifest.parameters
        : {
            type: "object",
            additionalProperties: true
          };

    tools.push({
      // Use folder name as canonical tool name (must match /tools/:toolName)
      name: folder,
      description: baseDesc + inputsHint + outputsHint,
      inputSchema
    });
  }

  // De-dupe by name
  const map = new Map(tools.map(t => [t.name, t]));
  const unique = [...map.values()];

  // Sort by preferred order, then alpha
  const orderIndex = new Map(PREFERRED_ORDER.map((name, idx) => [name, idx]));
  unique.sort((a, b) => {
    const ai = orderIndex.has(a.name) ? orderIndex.get(a.name) : 9999;
    const bi = orderIndex.has(b.name) ? orderIndex.get(b.name) : 9999;
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });

  return unique;
}

async function forwardToToolRunner(toolName, args) {
  const base = TOOL_RUNNER_BASE_URL.replace(/\/$/, "");
  const url = `${base}/tools/${encodeURIComponent(toolName)}`;

  console.log(
    `[adapter] → tool runner ${toolName} payload:\n${JSON.stringify(args ?? {}, null, 2)}`
  );

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args ?? {})
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Tool runner error ${res.status} ${res.statusText}: ${text}`);
  }

  const json = await res.json();
  return (json && Object.prototype.hasOwnProperty.call(json, "output")) ? json.output : json;
}

async function main() {
  const toolDefs = loadToolDefs();
  const toolNames = new Set(toolDefs.map(t => t.name));

  const server = new Server(
    { name: "tool-runner-mcp-adapter", version: "0.3.0" },
    { capabilities: { tools: {} } }
  );

  // tools/list
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: toolDefs.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      }))
    };
  });

  // tools/call
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params?.name;
    let args =
      request.params?.arguments ??
      request.params?.input ??
      request.params?.toolInput ??
      {};

    console.log(`[adapter] tools/call: ${toolName}`);
    console.log(`[adapter] raw params:\n${JSON.stringify(request.params, null, 2)}`);
    console.log(`[adapter] extracted args:\n${JSON.stringify(args, null, 2)}`);


    if (!toolName || !toolNames.has(toolName)) {
      return {
        content: [{
          type: "text",
          text: `Unknown tool: ${String(toolName)}`
        }],
        isError: true
      };
    }

    try {
      const result = await forwardToToolRunner(toolName, args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (err) {
      return {
        content: [{
          type: "text",
          text: `Tool execution failed: ${String(err?.message || err)}`
        }],
        isError: true
      };
    }
  });

  const transport = new StreamableHTTPServerTransport();
  await server.connect(transport);

  const httpServer = http.createServer((req, res) => transport.handleRequest(req, res));

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ MCP adapter listening: http://localhost:${PORT}`);
    console.log(`   Forwarding to tool runner: ${TOOL_RUNNER_BASE_URL}`);
    console.log(`   Excluding folders: ${[...EXCLUDE_FOLDERS].join(", ") || "(none)"}`);
    console.log(
      `   Tools advertised (${toolDefs.length}): ${toolDefs.map(t => t.name).join(", ")}`
    );
  });
}

main().catch((err) => {
  console.error("❌ MCP adapter failed:", err);
  process.exit(1);
});