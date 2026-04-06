// OpenAI Chat Completions API adapter — normalizes responses to Anthropic format
// Used by: OpenAI, Ollama, MiniMax, Kimi K, DeepSeek, Groq, and any OpenAI-compatible provider

import type { ProviderConfig } from "./types.js";
import type { MessageParam, ContentBlock, AnthropicResponse, ToolDefinition } from "../../../agents/core/types.js";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Convert Anthropic-style messages to OpenAI format */
function toOpenAIMessages(
  messages: MessageParam[],
  system?: string,
): Array<Record<string, unknown>> {
  const result: Array<Record<string, unknown>> = [];

  if (system) {
    result.push({ role: "system", content: system });
  }

  for (const msg of messages) {
    if (typeof msg.content === "string") {
      result.push({ role: msg.role, content: msg.content });
    } else {
      // Convert Anthropic content blocks to OpenAI format
      const parts: Array<Record<string, unknown>> = [];
      for (const block of msg.content) {
        if (block.type === "text") {
          parts.push({ type: "text", text: block.text });
        } else if (block.type === "tool_use") {
          parts.push({
            type: "function",
            id: block.id,
            function: {
              name: block.name,
              arguments: JSON.stringify(block.input),
            },
          });
        } else if (block.type === "tool_result") {
          // tool_result blocks go in a follow-up message with role "tool"
          // They are handled separately below
        }
      }

      if (msg.role === "assistant" && parts.length > 0) {
        const hasToolCalls = parts.some((p) => p.type === "function");
        if (hasToolCalls) {
          const textParts = parts.filter((p) => p.type === "text");
          const toolParts = parts.filter((p) => p.type === "function");
          result.push({
            role: "assistant",
            content: textParts.length === 1 ? textParts[0].text : textParts.map((p) => p.text).join(""),
            tool_calls: toolParts,
          });
        } else {
          result.push({ role: "assistant", content: parts.map((p) => p.text).join("") });
        }
      } else if (msg.role === "assistant") {
        result.push({ role: "assistant", content: "" });
      }
    }

    // Handle tool_result blocks — they come as user messages in Anthropic format
    if (typeof msg.content !== "string" && msg.role === "user") {
      for (const block of msg.content) {
        if (block.type === "tool_result") {
          result.push({
            role: "tool",
            tool_call_id: block.tool_use_id,
            content: block.content,
          });
        }
      }
    }
  }

  return result;
}

/** Convert Anthropic tool definitions to OpenAI function format */
function toOpenAITools(tools: ToolDefinition[]): Array<Record<string, unknown>> {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));
}

/** Normalize OpenAI response to Anthropic format */
function normalizeResponse(data: Record<string, unknown>): AnthropicResponse {
  const choices = data.choices as Array<Record<string, unknown>> ?? [];
  const choice = choices[0] ?? {};
  const message = (choice.message ?? {}) as Record<string, unknown>;
  const usage = (data.usage ?? {}) as Record<string, number>;

  const content: ContentBlock[] = [];

  // Text content
  const textContent = message.content as string | null;
  if (textContent) {
    content.push({ type: "text", text: textContent });
  }

  // Tool calls
  const toolCalls = message.tool_calls as Array<Record<string, unknown>> | undefined;
  if (toolCalls) {
    for (const tc of toolCalls) {
      const fn = tc.function as Record<string, unknown>;
      content.push({
        type: "tool_use",
        id: tc.id as string,
        name: fn.name as string,
        input: JSON.parse((fn.arguments as string) || "{}"),
      });
    }
  }

  // Determine stop_reason
  const finishReason = choice.finish_reason as string;
  let stopReason: AnthropicResponse["stop_reason"] = "end_turn";
  if (finishReason === "tool_calls" || finishReason === "function_call") {
    stopReason = "tool_use";
  } else if (finishReason === "length") {
    stopReason = "max_tokens";
  }

  return {
    id: (data.id as string) || `chatcmpl-${Date.now()}`,
    content,
    stop_reason: stopReason,
    usage: {
      input_tokens: usage.prompt_tokens ?? 0,
      output_tokens: usage.completion_tokens ?? 0,
    },
  };
}

export interface OpenAIChatParams {
  model?: string;
  system?: string;
  messages: MessageParam[];
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number | null;
  apiKey?: string;
  baseUrl?: string;
}

export async function openaiChat(
  config: ProviderConfig,
  params: OpenAIChatParams,
): Promise<AnthropicResponse> {
  const apiKey = params.apiKey ?? config.apiKey ?? "";
  const baseUrl = params.baseUrl ?? config.baseUrl;
  const model = params.model ?? config.model;

  const body: Record<string, unknown> = {
    model,
    max_tokens: params.maxTokens ?? config.maxTokens ?? 4096,
    messages: toOpenAIMessages(params.messages, params.system),
  };

  if (params.tools && params.tools.length > 0) {
    body.tools = toOpenAITools(params.tools);
  }

  if (params.temperature != null ?? config.temperature != null) {
    body.temperature = params.temperature ?? config.temperature;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Ollama doesn't require an API key; others use Bearer auth
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers,
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

      const data = await response.json() as Record<string, unknown>;
      return normalizeResponse(data);
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
