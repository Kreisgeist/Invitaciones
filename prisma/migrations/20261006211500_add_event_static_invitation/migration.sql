CREATE TABLE "StaticInvitation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaticInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaticInvitation_eventId_key" ON "StaticInvitation"("eventId");
CREATE UNIQUE INDEX "StaticInvitation_token_key" ON "StaticInvitation"("token");
CREATE INDEX "StaticInvitation_token_idx" ON "StaticInvitation"("token");

ALTER TABLE "StaticInvitation"
ADD CONSTRAINT "StaticInvitation_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
