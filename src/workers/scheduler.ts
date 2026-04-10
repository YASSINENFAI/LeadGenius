// Scheduler Worker - Sends scheduled emails when their time comes

import { prisma } from "../lib/db/client.js";
import { sendOutreach } from "../modules/outreach/outreach.service.js";
import { notifyTelegram } from "../lib/notifications/telegram.js";

const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute
let isRunning = false;

export async function startScheduler() {
  if (isRunning) return;
  isRunning = true;
  
  console.log("[Scheduler] Started - checking for scheduled emails every minute");
  
  // Process immediately on start
  await processScheduledEmails();
  
  // Then run every minute
  setInterval(processScheduledEmails, CHECK_INTERVAL_MS);
}

async function processScheduledEmails() {
  try {
    const now = new Date();
    
    // Find all scheduled emails that should be sent now
    const scheduledEmails = await prisma.outreach.findMany({
      where: {
        scheduledAt: {
          lte: now, // scheduled time is in the past or now
        },
        status: {
          in: ["draft", "pending_approval", "approved"],
        },
      },
      include: {
        lead: {
          select: {
            businessName: true,
            email: true,
          },
        },
      },
    });

    console.log(`[Scheduler] Found ${scheduledEmails.length} emails to send`);

    for (const outreach of scheduledEmails) {
      try {
        // Send the email
        const result = await sendOutreach(outreach.id);
        console.log(`[Scheduler] ✓ Email sent to ${outreach.lead?.businessName || outreach.leadId}`);
        
        // Send Telegram notification for scheduled email
        if (result.sent) {
          await notifyTelegram("scheduled", outreach.lead?.businessName || "Unknown", outreach.lead?.email || "No email");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Scheduler] ✗ Failed to send email ${outreach.id}: ${message}`);
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Scheduler] Error processing scheduled emails: ${message}`);
  }
}

export function stopScheduler() {
  isRunning = false;
  console.log("[Scheduler] Stopped");
}
