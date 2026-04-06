// AI Provider Registry — resolves the active provider from DB or env fallback
// Creates the appropriate protocol adapter (Anthropic or OpenAI)

import { prisma } from "../../db/client.js";
import type { ProviderConfig, ProviderProtocol } from "./types.js";
import { PROVIDER_DEFAULTS, envFallbackConfig } from "./defaults.js";
import { anthropicChat } from "./anthropic-adapter.js";
import { openaiChat } from "./openai-adapter.js";
import type { MessageParam, AnthropicResponse, ToolDefinition } from "../../../agents/core/types.js";

export interface ChatParams {
  model?: string;
  system?: string;
  messages: MessageParam[];
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number | null;
}

/** Get the protocol for a provider type */
function getProtocol(providerType: string): ProviderProtocol {
  const info = PROVIDER_DEFAULTS[providerType];
  return info?.protocol ?? "openai";
}

/** Load the active provider config from DB, falling back to env vars */
export async function getActiveProvider(): Promise<ProviderConfig> {
  try {
    const dbProvider = await prisma.aIProvider.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (dbProvider) {
      return {
        id: dbProvider.id,
        name: dbProvider.name,
        providerType: dbProvider.providerType,
        apiKey: dbProvider.apiKey,
        baseUrl: dbProvider.baseUrl || PROVIDER_DEFAULTS[dbProvider.providerType]?.defaultBaseUrl || "https://api.openai.com/v1",
        model: dbProvider.model,
        temperature: dbProvider.temperature,
        maxTokens: dbProvider.maxTokens,
        isActive: dbProvider.isActive,
        isDefault: dbProvider.isDefault,
      };
    }
  } catch {
    // DB not available yet (migration not run, etc.) — fall through to env
  }

  return envFallbackConfig();
}

/** Get all available providers from DB */
export async function listProviders(): Promise<ProviderConfig[]> {
  try {
    const providers = await prisma.aIProvider.findMany({ orderBy: { isDefault: "desc" } });
    return providers.map((p) => ({
      id: p.id,
      name: p.name,
      providerType: p.providerType,
      apiKey: p.apiKey,
      baseUrl: p.baseUrl || PROVIDER_DEFAULTS[p.providerType]?.defaultBaseUrl || "",
      model: p.model,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
      isActive: p.isActive,
      isDefault: p.isDefault,
    }));
  } catch {
    return [envFallbackConfig()];
  }
}

/** Unified chat function — picks the right adapter based on provider protocol */
export async function chat(params: ChatParams): Promise<AnthropicResponse> {
  const config = await getActiveProvider();
  const protocol = getProtocol(config.providerType);

  if (protocol === "anthropic") {
    return anthropicChat(config, params);
  }

  return openaiChat(config, params);
}

/** Simple text-only chat — convenience wrapper */
export async function simpleChat(
  prompt: string,
  options?: { system?: string; maxTokens?: number; model?: string },
): Promise<string> {
  const result = await chat({
    model: options?.model,
    system: options?.system,
    messages: [{ role: "user", content: prompt }],
    maxTokens: options?.maxTokens,
  });

  const textBlock = result.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Unexpected empty response from AI");
  }
  return textBlock.text;
}

/** Test a provider connection by sending a minimal chat request */
export async function testProvider(config: ProviderConfig): Promise<{ ok: boolean; error?: string; model?: string }> {
  try {
    const protocol = getProtocol(config.providerType);
    const testParams: ChatParams = {
      system: "You are a test assistant.",
      messages: [{ role: "user", content: "Reply with: OK" }],
      maxTokens: 10,
    };

    if (protocol === "anthropic") {
      await anthropicChat(config, testParams);
    } else {
      await openaiChat(config, testParams);
    }

    return { ok: true, model: config.model };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
