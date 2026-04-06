// Anthropic Messages API adapter — used by Claude and GLM (via z.ai proxy)

import type { ProviderConfig } from "./types.js";
import type { MessageParam, ContentBlock, AnthropicResponse, ToolDefinition } from "../../../agents/core/types.js";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface AnthropicChatParams {
  model?: string;
  system?: string;
  messages: MessageParam[];
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number | null;
  apiKey?: string;
  baseUrl?: string;
}

export async function anthropicChat(
  config: ProviderConfig,
  params: AnthropicChatParams,
): Promise<AnthropicResponse> {
  const apiKey = params.apiKey ?? config.apiKey ?? "";
  const baseUrl = params.baseUrl ?? config.baseUrl;
  const model = params.model ?? config.model;

  const body: Record<string, unknown> = {
    model,
    max_tokens: params.maxTokens ?? config.maxTokens ?? 4096,
    messages: params.messages,
  };

  if (params.system) {
    body.system = params.system;
  }

  if (params.tools && params.tools.length > 0) {
    body.tools = params.tools;
  }

  if (params.temperature != null ?? config.temperature != null) {
    body.temperature = params.temperature ?? config.temperature;
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        const isRetryable = response.status >= 500 || response.status === 429;
        if (isRetryable && attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * attempt;
          console.warn(`[AI Client] API error ${response.status}, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES}): ${text.slice(0, 200)}`);
          await sleep(delay);
          continue;
        }
        throw new Error(`AI API error (${response.status}): ${text}`);
      }

      return response.json() as Promise<AnthropicResponse>;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES && (
        lastError.message.includes("fetch") ||
        lastError.message.includes("ECONNREFUSED") ||
        lastError.message.includes("timeout")
      )) {
        const delay = RETRY_DELAY_MS * attempt;
        console.warn(`[AI Client] Network error, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES}): ${lastError.message}`);
        await sleep(delay);
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error("AI API failed after all retries");
}
