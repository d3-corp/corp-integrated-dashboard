import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  getDefaultEnvironment,
  StdioClientTransport,
} from "@modelcontextprotocol/sdk/client/stdio.js";

const allowedTools = new Set(["list_organizations", "list_assets"]);

function readArgs(value) {
  if (value === undefined || value === "") return [];
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("ACTION1_MCP_ARGS must be a JSON array of strings");
  }
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
    throw new Error("ACTION1_MCP_ARGS must be a JSON array of strings");
  }
  return parsed;
}

export async function connectGateway(env = process.env) {
  const command = env.ACTION1_MCP_COMMAND;
  if (!command) throw new Error("Set ACTION1_MCP_COMMAND");
  const args = readArgs(env.ACTION1_MCP_ARGS);
  const forwarded = {};
  for (const name of ["ACTION1_BASE_URL", "ACTION1_ORGANIZATION_IDS"]) {
    if (env[name]) forwarded[name] = env[name];
  }

  const client = new Client({
    name: "corp-integrated-dashboard-live",
    version: "0.1.0",
  });
  const transport = new StdioClientTransport({
    command,
    args,
    env: { ...getDefaultEnvironment(), ...forwarded },
    stderr: "pipe",
  });
  // Consume launcher diagnostics without printing credentials or tenant data.
  transport.stderr?.on("data", () => {});

  try {
    await client.connect(transport, { timeout: 60000 });
  } catch (error) {
    await client.close();
    throw error;
  }

  return {
    async call(name, args) {
      if (!allowedTools.has(name)) {
        throw new Error("Unsupported gateway operation");
      }
      const result = await client.callTool(
        { name, arguments: args },
        undefined,
        { timeout: 180000 },
      );
      if (result.isError) {
        const text = result.content?.find((item) => item.type === "text")?.text;
        throw new Error(text || "Gateway read failed");
      }
      const text = result.content?.find((item) => item.type === "text")?.text;
      const data = JSON.parse(text);
      if (!Array.isArray(data?.items)) {
        throw new Error("Invalid gateway collection");
      }
      return data;
    },
    close: () => client.close(),
  };
}
