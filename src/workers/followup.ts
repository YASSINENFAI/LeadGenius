// Follow-up Worker - Automatically send follow-up emails

import { prisma } from "../lib/db/client.js";
import { sendEmail } from "../lib/email/client.js";
import { notifyTelegram } from "../lib/notifications/telegram.js";

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour
const FOLLOW_UP_DELAY_DAYS = 3; // Days before sending follow-up
const MAX_FOLLOW_UPS = 2; // Maximum number of follow-ups per outreach

let isRunning = false;

export async function startFollowUpWorker() {
  if (isRunning) return;
  isRunning = true;

  console.log("[FollowUp] Started - checking for follow-ups every hour");

  // Process immediately on start
  await processFollowUps();

  // Then run every hour
  setInterval(processFollowUps, CHECK_INTERVAL_MS);
}

async function processFollowUps() {
  try {
    const now = new Date();
    const followUpThreshold = new Date(now);
    followUpThreshold.setDate(followUpThreshold.getDate() - FOLLOW_UP_DELAY_DAYS);

    // Find sent emails that need follow-up:
    // - Sent more than X days ago
    // - Not opened, or opened but not replied
    // - Haven't reached max follow-ups
    const needsFollowUp = await prisma.outreach.findMany({
      where: {
        status: { in: ["sent", "opened"] },
        sentAt: { lte: followUpThreshold },
        followUpCount: { lt: MAX_FOLLOW_UPS },
        // Don't follow up if already replied
        repliedAt: null,
      },
      include: {
        lead: {
          select: {
            id: true,
            businessName: true,
            email: true,
          },
        },
      },
    });

    console.log(`[FollowUp] Found ${needsFollowUp.length} emails needing follow-up`);

    for (const outreach of needsFollowUp) {
      try {
        // Check if we already sent a follow-up recently
        if (outreach.followUpSent) {
          const daysSinceLastFollowUp = Math.floor(
            (now.getTime() - outreach.followUpSent.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceLastFollowUp < FOLLOW_UP_DELAY_DAYS) {
            continue; // Too soon for another follow-up
          }
        }

        // Generate follow-up email
        const followUpSubject = `Re: ${outreach.subject}`;
        const followUpBody = generateFollowUpBody(outreach);

        // Send the follow-up
        const result = await sendEmail(
          outreach.lead?.email || "",
          followUpSubject,
          followUpBody
        );

        if (!result.simulated) {
          // Update follow-up count and timestamp
          await prisma.outreach.update({
            where: { id: outreach.id },
            data: {
              followUpCount: { increment: 1 },
              followUpSent: now,
            },
          });

          console.log(
            `[FollowUp] ✓ Sent follow-up #${outreach.followUpCount + 1} to ${outreach.lead?.businessName}`
          );

          // Send Telegram notification
          await notifyTelegram(
            "followup",
            outreach.lead?.businessName || "Unknown",
            outreach.lead?.email || "",
            { followUpNumber: outreach.followUpCount + 1 }
          );
        } else {
          console.log(`[FollowUp] Email not configured, skipping follow-up for ${outreach.id}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`[FollowUp] ✗ Failed to send follow-up ${outreach.id}: ${message}`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[FollowUp] Error processing follow-ups: ${message}`);
  }
}

function generateFollowUpBody(outreach: { lead?: { businessName?: string } | null; body: string }): string {
  const businessName = outreach.lead?.businessName || "your business";

  return `Hi ${businessName},

I wanted to follow up on my previous email. I know you're busy, but I wanted to make sure you didn't miss the opportunity.

I've analyzed your website and found some quick wins that could help ${businessName} attract more customers.

Would you be open to a quick 15-minute call this week? I can share what I found and see if it's a good fit.

Best regards,
Yassine

---
Original message:
${outreach.body.substring(0, 200)}...
`;
}

export function stopFollowUpWorker() {
  isRunning = false;
  console.log("[FollowUp] Stopped");
}
