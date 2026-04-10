-- CreateTable
CREATE TABLE "TelegramSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "botToken" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifySent" BOOLEAN NOT NULL DEFAULT true,
    "notifyOpen" BOOLEAN NOT NULL DEFAULT true,
    "notifyReply" BOOLEAN NOT NULL DEFAULT true,
    "notifyBounce" BOOLEAN NOT NULL DEFAULT true,
    "notifyFail" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSetting_pkey" PRIMARY KEY ("id")
);
