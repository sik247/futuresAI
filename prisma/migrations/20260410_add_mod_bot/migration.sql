-- Group moderation state on User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "warnCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "banReason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bannedAt" TIMESTAMPTZ;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mutedUntil" TIMESTAMPTZ;

-- ModAction: audit log for every moderation action
CREATE TABLE IF NOT EXISTS "ModAction" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetId" TEXT,
    "targetTgId" TEXT,
    "chatId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ModAction_actorId_idx" ON "ModAction"("actorId");
CREATE INDEX IF NOT EXISTS "ModAction_targetId_idx" ON "ModAction"("targetId");
CREATE INDEX IF NOT EXISTS "ModAction_chatId_idx" ON "ModAction"("chatId");
CREATE INDEX IF NOT EXISTS "ModAction_action_idx" ON "ModAction"("action");
CREATE INDEX IF NOT EXISTS "ModAction_createdAt_idx" ON "ModAction"("createdAt");

ALTER TABLE "ModAction" DROP CONSTRAINT IF EXISTS "ModAction_actorId_fkey";
ALTER TABLE "ModAction" ADD CONSTRAINT "ModAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ModAction" DROP CONSTRAINT IF EXISTS "ModAction_targetId_fkey";
ALTER TABLE "ModAction" ADD CONSTRAINT "ModAction_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- GroupSettings: per-group rules, welcome message
CREATE TABLE IF NOT EXISTS "GroupSettings" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "rules" TEXT,
    "welcomeMsg" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "GroupSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "GroupSettings_chatId_key" ON "GroupSettings"("chatId");
