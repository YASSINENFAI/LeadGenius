import nodemailer from "nodemailer";
import type { EmailProvider, SendParams, SendResult } from "./types.js";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export function createSmtpProvider(config: SmtpConfig): EmailProvider {
  return {
    name: "smtp",

    isConfigured(): boolean {
      return !!(config.host && config.user && config.password && config.fromEmail);
    },

    async send({ to, subject, html }: SendParams): Promise<SendResult> {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.password,
        },
      });

      const result = await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to,
        subject,
        html,
      });

      return {
        id: result.messageId ?? `smtp_${Date.now()}`,
        from: config.fromEmail,
        to,
      };
    },
  };
}
