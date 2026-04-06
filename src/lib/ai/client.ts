// AI client is now in src/lib/ai/providers/registry.ts — this file re-exports for backward compat.
// The registry resolves providers from DB settings (with env-var fallback).
export { chat, simpleChat } from "./providers/registry.js";
