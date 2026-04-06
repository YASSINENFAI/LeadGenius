// Unified AI client — delegates to the provider registry for multi-provider support.
// The registry resolves the active provider from DB settings (with env-var fallback).
// All AI calls go through this module — never duplicate fetch() calls elsewhere.

export { chat, simpleChat } from "../../lib/ai/providers/registry.js";
export type { ChatParams } from "../../lib/ai/providers/registry.js";
