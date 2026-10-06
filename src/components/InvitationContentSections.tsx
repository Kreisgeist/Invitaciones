import {
  CalendarDays,
  Church,
  Clock,
  ExternalLink,
  MapPin,
  PartyPopper,
  Shirt,
} from "lucide-react";
import { renderInviteHtml } from "@/lib/renderInviteHtml";
import { formatDate, formatTime } from "@/lib/utils";
import type { InvitationSection } from "@/lib/invitationSections";

export interface InvitationEventContent {
  name: string;
  description: string | null;
  date: string;
  time: string;
  location: string;
  mapUrl: string | null;
  ceremonyTime: string | null;
  ceremonyLocation: string | null;
  ceremonyMapUrl: string | null;
  dressCode: string | null;
}

export function InvitationIntroduction({
  event,
}: {
  event: InvitationEventContent;
}) {
  return (
    <div className="invitation-card p-8 text-center animate-fade-in-up">
      {event.description ? (
        <div
          className="prose-invite"
          dangerouslySetInnerHTML={{
            __html: renderInviteHtml(event.description),
          }}
        />
      ) : (
        <h1
          className="text-3xl font-bold text-text-main"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          {event.name}
        </h1>
      )}
    </div>
  );
}

export function InvitationSchedule({
  event,
  type,
}: {
  event: InvitationEventContent;
  type: "CEREMONY" | "RECEPTION";
}) {
  const isCeremony = type === "CEREMONY";
  const time = isCeremony ? event.ceremonyTime : event.time;
  const location = isCeremony ? event.ceremonyLocation : event.location;
  const mapUrl = isCeremony ? event.ceremonyMapUrl : event.mapUrl;

  if (!time || !location) return null;

  const Icon = isCeremony ? Church : PartyPopper;
  return (
    <div className="invitation-card p-6 text-center animate-fade-in-up">
      <Icon className="w-7 h-7 text-accent mx-auto mb-2" />
      <h2
        className="text-xl font-semibold text-text-main mb-4"
        style={{ fontFamily: "Playfair Display, serif" }}
      >
        {isCeremony ? "Ceremonia religiosa" : "Recepción"}
      </h2>
      <div className="space-y-3 text-sm text-text-muted">
        <div className="flex items-center justify-center gap-2">
          <CalendarDays className="w-4 h-4 text-accent shrink-0" />
          <span>{formatDate(event.date, true)}</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-accent shrink-0" />
          <span>{formatTime(time)}</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4 text-accent shrink-0" />
          <span>{location}</span>
        </div>
        {!isCeremony && event.dressCode && (
          <div className="flex items-center justify-center gap-2">
            <Shirt className="w-4 h-4 text-accent shrink-0" />
            <span>{event.dressCode}</span>
          </div>
        )}
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-main bg-bg-warm border border-border/50 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            Ver en Google Maps
          </a>
        )}
      </div>
    </div>
  );
}

export function InvitationCustomSection({
  section,
}: {
  section: InvitationSection;
}) {
  if (!section.title?.trim() && !section.content?.trim()) return null;

  return (
    <div className="invitation-card p-6 text-center animate-fade-in-up">
      {section.title?.trim() && (
        <h2
          className="text-xl font-semibold text-text-main mb-3"
          style={{ fontFamily: "Playfair Display, serif" }}
        >
          {section.title}
        </h2>
      )}
      {section.content?.trim() && (
        <div
          className="prose-invite"
          dangerouslySetInnerHTML={{
            __html: renderInviteHtml(section.content),
          }}
        />
      )}
    </div>
  );
}
