// src/tool-registry.ts

import { weatherTool } from './weather-tool.js';
import type { Schema } from '@google/genai';

type Tool = {
  name: string;
  description: string;
  parameters: Schema;
  execute: (..._args: unknown[]) => Promise<unknown>;
};

const tools = new Map<string, Tool>();

// Register tools

tools.set(weatherTool.name, weatherTool);

/**
 * Find a tool by name.
 */
export function getTool(name: string) {
  return tools.get(name);
}

/**
 * Execute a tool.
 */
export async function executeTool(name: string, args: Record<string, unknown>) {
  const tool = tools.get(name);

  if (!tool) {
    throw new Error(`Tool "${name}" not found.`);
  }

  return tool.execute(args);
}

/**
 * Return tool definitions for the provider.
 */
export function getToolDefinitions() {
  return Array.from(tools.values()).map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}
