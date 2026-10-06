ALTER TABLE "Event"
ADD COLUMN "ceremonyTime" TEXT,
ADD COLUMN "ceremonyLocation" TEXT,
ADD COLUMN "ceremonyMapUrl" TEXT,
ADD COLUMN "invitationSections" JSONB;
