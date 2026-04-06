-- CreateEnum
CREATE TYPE "AiProviderType" AS ENUM ('glm', 'anthropic', 'openai', 'ollama', 'minimax', 'kimi', 'deepseek', 'groq');

-- CreateTable
CREATE TABLE "AiProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "providerType" "AiProviderType" NOT NULL,
    "apiKey" TEXT,
    "baseUrl" TEXT,
    "model" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "temperature" DOUBLE PRECISION,
    "maxTokens" INTEGER NOT NULL DEFAULT 4096,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiProvider_name_key" ON "AiProvider"("name");

-- CreateIndex
CREATE INDEX "AiProvider_providerType_idx" ON "AiProvider"("providerType");

-- CreateIndex
CREATE INDEX "AiProvider_isDefault_idx" ON "AiProvider"("isDefault");
