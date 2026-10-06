CREATE TYPE "InvitationMode" AS ENUM ('RSVP', 'STATIC');

ALTER TABLE "Round"
ADD COLUMN "invitationMode" "InvitationMode" NOT NULL DEFAULT 'RSVP';
