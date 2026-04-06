import { prisma } from "../db/client.js";
import { createResendProvider } from "./providers/resend.js";
import { createGmailProvider } from "./providers/gmail.js";
import { createSmtpProvider } from "./providers/smtp.js";
import { getStoredTokens } from "./gmail-oauth.js";
import type { EmailProvider, SendResult } from "./providers/types.js";

let _cachedProvider: EmailProvider | null = null;

type ProviderName = "resend" | "gmail" | "smtp";

async function tryCreateProvider(name: ProviderName): Promise<EmailProvider | null> {
  switch (name) {
    case "gmail": {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return null;
      const tokens = await getStoredTokens();
      if (!tokens) return null;
      return createGmailProvider();
    }
    case "smtp": {
      const config = await prisma.smtpConfig.findUnique({ where: { id: "default" } });
      if (!config) return null;
      return createSmtpProvider({
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        password: config.password,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
      });
    }
    case "resend": {
      if (!process.env.RESEND_API_KEY) return null;
      return createResendProvider();
    }
  }
}

async function getActiveProvider(): Promise<EmailProvider> {
  if (_cachedProvider) return _cachedProvider;

  // 1. Check user's preferred provider from DB
  const setting = await prisma.emailSetting.findUnique({ where: { id: "default" } });
  if (setting?.defaultProvider) {
    const provider = await tryCreateProvider(setting.defaultProvider as ProviderName);
    if (provider) {
      _cachedProvider = provider;
      return _cachedProvider;
    }
  }

  // 2. Auto-detect: Gmail if OAuth tokens exist, then Resend
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const tokens = await getStoredTokens();
    if (tokens) {
      _cachedProvider = createGmailProvider();
      return _cachedProvider;
    }
  }

  if (process.env.EMAIL_PROVIDER === "gmail") {
    _cachedProvider = createGmailProvider();
    return _cachedProvider;
  }

  _cachedProvider = createResendProvider();
  return _cachedProvider;
}

/** Clear the cached provider (call after config changes) */
export function resetProviderCache(): void {
  _cachedProvider = null;
}

/**
 * Check whether email sending is configured.
 */
export async function isEmailConfigured(): Promise<boolean> {
  const provider = await getActiveProvider();
  return provider.isConfigured();
}

export interface SendEmailResult {
  id: string;
  from: string;
  to: string;
  /** True when the provider was not configured and the email was simulated */
  simulated?: boolean;
}

/**
 * Send an email via the active provider (Gmail, SMTP, or Resend).
 *
 * If the provider is not configured the call is **not** an error — instead
 * the function logs a warning and returns a mock success response so callers
 * can continue their workflow (e.g. saving the outreach as "saved" rather than
 * failing outright).
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<SendEmailResult> {
  const provider = await getActiveProvider();
  const result: SendResult = await provider.send({ to, subject, html });
  return result;
}
