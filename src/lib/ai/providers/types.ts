// AI provider configuration types

export type ProviderProtocol = "anthropic" | "openai";

export interface ProviderConfig {
  id?: string;
  name: string;
  providerType: string;
  apiKey: string | null;
  baseUrl: string;
  model: string;
  temperature?: number | null;
  maxTokens: number;
  isActive: boolean;
  isDefault: boolean;
}

export interface ProviderInfo {
  type: string;
  label: string;
  protocol: ProviderProtocol;
  defaultBaseUrl: string;
  defaultModel: string;
  models: string[];
  docsUrl: string;
  requiresApiKey: boolean;
}
