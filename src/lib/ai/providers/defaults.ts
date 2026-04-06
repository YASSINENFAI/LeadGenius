// Default provider configurations — used for UI suggestions and env-var fallback

import type { ProviderInfo } from "./types.js";

export const PROVIDER_DEFAULTS: Record<string, ProviderInfo> = {
  glm: {
    type: "glm",
    label: "GLM (ZhipuAI)",
    protocol: "anthropic",
    defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-4.7-flash",
    models: ["glm-4.7-flash", "glm-5.1", "glm-4-plus", "glm-4-flash", "glm-4-long"],
    docsUrl: "https://open.bigmodel.cn/dev/api",
    requiresApiKey: true,
  },
  anthropic: {
    type: "anthropic",
    label: "Anthropic Claude",
    protocol: "anthropic",
    defaultBaseUrl: "https://api.anthropic.com",
    defaultModel: "claude-3-7-sonnet-20250219",
    models: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
    ],
    docsUrl: "https://docs.anthropic.com/en/docs/about-claude/models",
    requiresApiKey: true,
  },
  openai: {
    type: "openai",
    label: "OpenAI",
    protocol: "openai",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o3-mini", "o4-mini"],
    docsUrl: "https://platform.openai.com/docs/models",
    requiresApiKey: true,
  },
  ollama: {
    type: "ollama",
    label: "Ollama (Local)",
    protocol: "openai",
    defaultBaseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.1",
    models: ["llama3.1", "llama3.3", "qwen2.5", "qwen3", "gemma3", "deepseek-r1", "mistral", "phi4", "codellama"],
    docsUrl: "https://ollama.com/library",
    requiresApiKey: false,
  },
  minimax: {
    type: "minimax",
    label: "MiniMax",
    protocol: "openai",
    defaultBaseUrl: "https://api.minimax.chat/v1",
    defaultModel: "MiniMax-Text-01",
    models: ["MiniMax-Text-01", "minimax-m2.5", "minimax-m2.7", "minimax-m2", "abab6.5s-chat"],
    docsUrl: "https://platform.minimaxi.com/document",
    requiresApiKey: true,
  },
  kimi: {
    type: "kimi",
    label: "Kimi (Moonshot)",
    protocol: "openai",
    defaultBaseUrl: "https://api.moonshot.cn/v1",
    defaultModel: "moonshot-v1-128k",
    models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
    docsUrl: "https://platform.moonshot.cn/docs",
    requiresApiKey: true,
  },
  deepseek: {
    type: "deepseek",
    label: "DeepSeek",
    protocol: "openai",
    defaultBaseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    docsUrl: "https://platform.deepseek.com/api-docs",
    requiresApiKey: true,
  },
  groq: {
    type: "groq",
    label: "Groq",
    protocol: "openai",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "meta-llama/llama-4-scout-17b-16e-instruct", "qwen/qwen3-32b"],
    docsUrl: "https://console.groq.com/docs/models",
    requiresApiKey: true,
  },
};

/** Build a fallback ProviderConfig from environment variables (GLM legacy) */
export function envFallbackConfig(): import("./types.js").ProviderConfig {
  return {
    name: "GLM (from env)",
    providerType: "glm",
    apiKey: process.env.GLM_API_KEY ?? null,
    baseUrl: process.env.GLM_BASE_URL || PROVIDER_DEFAULTS.glm.defaultBaseUrl,
    model: process.env.GLM_MODEL || PROVIDER_DEFAULTS.glm.defaultModel,
    maxTokens: 4096,
    isActive: true,
    isDefault: true,
  };
}
