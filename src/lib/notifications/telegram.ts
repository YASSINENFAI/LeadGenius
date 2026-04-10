// Telegram Notification Service
// Sends notifications when emails are opened, replied, or failed

import { prisma } from "../db/client.js";

interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: "HTML" | "Markdown";
}

interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
}

const TELEGRAM_API = "https://api.telegram.org/bot";

export class TelegramNotifier {
  private botToken: string;
  private chatId: string | number;

  constructor(botToken: string, chatId: string | number) {
    this.botToken = botToken;
    this.chatId = chatId;
  }

  /**
   * Send a text message to Telegram
   */
  async sendMessage(text: string, parseMode?: "HTML" | "Markdown"): Promise<boolean> {
    const url = `${TELEGRAM_API}${this.botToken}/sendMessage`;
    
    const body: TelegramMessage = {
      chat_id: this.chatId,
      text,
      parse_mode: parseMode,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = (await response.json()) as TelegramResponse;
      
      if (!result.ok) {
        console.error("[Telegram] Failed to send message:", result.description);
        return false;
      }

      return true;
    } catch (err) {
      console.error("[Telegram] Error sending message:", err);
      return false;
    }
  }

  /**
   * Notify when an email is opened
   */
  async notifyEmailOpened(businessName: string, email: string): Promise<void> {
    const text = `📧 <b>Email Opened!</b>

🏢 <b>Business:</b> ${businessName}
📧 <b>Email:</b> ${email}

The recipient opened your outreach email.`;

    await this.sendMessage(text, "HTML");
  }

  /**
   * Notify when an email receives a reply
   */
  async notifyEmailReplied(businessName: string, email: string, replySnippet?: string): Promise<void> {
    const text = `💬 <b>Email Reply Received!</b>

🏢 <b>Business:</b> ${businessName}
📧 <b>Email:</b> ${email}
${replySnippet ? `\n📝 <b>Reply:</b>\n${replySnippet}` : ""}

Check your inbox to respond!`;

    await this.sendMessage(text, "HTML");
  }

  /**
   * Notify when an email bounces
   */
  async notifyEmailBounced(businessName: string, email: string, reason?: string): Promise<void> {
    const text = `⚠️ <b>Email Bounced!</b>

🏢 <b>Business:</b> ${businessName}
📧 <b>Email:</b> ${email}
${reason ? `\n❗ <b>Reason:</b> ${reason}` : ""}

The email could not be delivered.`;

    await this.sendMessage(text, "HTML");
  }

  /**
   * Notify when an email is sent successfully
   */
  async notifyEmailSent(businessName: string, email: string): Promise<void> {
    const text = `✅ <b>Email Sent!</b>

🏢 <b>Business:</b> ${businessName}
📧 <b>Email:</b> ${email}

Your outreach email was sent successfully.`;

    await this.sendMessage(text, "HTML");
  }

  /**
   * Notify when an email fails to send
   */
  async notifyEmailFailed(businessName: string, email: string, error: string): Promise<void> {
    const text = `❌ <b>Email Failed!</b>

🏢 <b>Business:</b> ${businessName}
📧 <b>Email:</b> ${email}
❗ <b>Error:</b> ${error}

The email could not be sent.`;

    await this.sendMessage(text, "HTML");
  }

  /**
   * Notify when a scheduled email is sent
   */
  async notifyScheduledEmailSent(businessName: string, email: string): Promise<void> {
    const text = `⏰ <b>Scheduled Email Sent!</b>

🏢 <b>Business:</b> ${businessName}
📧 <b>Email:</b> ${email}

Your scheduled email was sent automatically.`;

    await this.sendMessage(text, "HTML");
  }

  /**
   * Notify when a follow-up email is sent
   */
  async notifyFollowUpSent(businessName: string, email: string, followUpNumber: number): Promise<void> {
    const text = `🔄 <b>Follow-up Email Sent!</b>

🏢 <b>Business:</b> ${businessName}
📧 <b>Email:</b> ${email}
🔢 <b>Follow-up #:</b> ${followUpNumber}

Automatic follow-up was sent.`;

    await this.sendMessage(text, "HTML");
  }
}

// Get Telegram settings from database (async)
export async function getTelegramSettings(): Promise<{ botToken: string; chatId: string; isEnabled: boolean; notifySent: boolean; notifyOpen: boolean; notifyReply: boolean; notifyBounce: boolean; notifyFail: boolean } | null> {
  try {
    const settings = await prisma.telegramSetting.findUnique({
      where: { id: "default" },
    });

    if (!settings || !settings.botToken || !settings.chatId || !settings.isEnabled) {
      return null;
    }

    return {
      botToken: settings.botToken,
      chatId: settings.chatId,
      isEnabled: settings.isEnabled,
      notifySent: settings.notifySent,
      notifyOpen: settings.notifyOpen,
      notifyReply: settings.notifyReply,
      notifyBounce: settings.notifyBounce,
      notifyFail: settings.notifyFail,
    };
  } catch (err) {
    // Fallback to env variables if database fails
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      return null;
    }
    
    return {
      botToken,
      chatId,
      isEnabled: true,
      notifySent: true,
      notifyOpen: true,
      notifyReply: true,
      notifyBounce: true,
      notifyFail: true,
    };
  }
}

// Create notifier from settings
export async function createTelegramNotifier(): Promise<TelegramNotifier | null> {
  const settings = await getTelegramSettings();
  if (!settings) {
    return null;
  }
  return new TelegramNotifier(settings.botToken, settings.chatId);
}

/**
 * Helper functions for quick notifications
 */
export async function notifyTelegram(
  type: "opened" | "replied" | "bounced" | "sent" | "failed" | "scheduled" | "followup",
  businessName: string,
  email: string,
  extra?: { reason?: string; replySnippet?: string; error?: string; followUpNumber?: number }
): Promise<void> {
  const settings = await getTelegramSettings();
  if (!settings) {
    console.log("[Telegram] Not configured, skipping notification");
    return;
  }

  // Check if this notification type is enabled
  if (
    (type === "sent" && !settings.notifySent) ||
    (type === "opened" && !settings.notifyOpen) ||
    (type === "replied" && !settings.notifyReply) ||
    (type === "bounced" && !settings.notifyBounce) ||
    (type === "failed" && !settings.notifyFail)
  ) {
    console.log(`[Telegram] ${type} notifications disabled, skipping`);
    return;
  }

  const notifier = new TelegramNotifier(settings.botToken, settings.chatId);

  switch (type) {
    case "opened":
      await notifier.notifyEmailOpened(businessName, email);
      break;
    case "replied":
      await notifier.notifyEmailReplied(businessName, email, extra?.replySnippet);
      break;
    case "bounced":
      await notifier.notifyEmailBounced(businessName, email, extra?.reason);
      break;
    case "sent":
      await notifier.notifyEmailSent(businessName, email);
      break;
    case "failed":
      await notifier.notifyEmailFailed(businessName, email, extra?.error || "Unknown error");
      break;
    case "scheduled":
      await notifier.notifyScheduledEmailSent(businessName, email);
      break;
    case "followup":
      await notifier.notifyFollowUpSent(businessName, email, extra?.followUpNumber || 1);
      break;
  }
}
