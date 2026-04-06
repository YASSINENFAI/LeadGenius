-- CreateTable
CREATE TABLE "SmtpConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 465,
    "secure" BOOLEAN NOT NULL DEFAULT true,
    "user" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT NOT NULL DEFAULT 'FindX',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmtpConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultProvider" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailSetting_pkey" PRIMARY KEY ("id")
);
