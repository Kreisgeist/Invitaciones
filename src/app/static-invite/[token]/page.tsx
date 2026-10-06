"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Shirt,
} from "lucide-react";
import { getInvitationBackgroundStyle } from "@/lib/invitationTheme";
import { renderInviteHtml } from "@/lib/renderInviteHtml";
import { formatDate, formatTime } from "@/lib/utils";

interface StaticInvitationData {
  event: {
    name: string;
    description: string | null;
    date: string;
    time: string;
    location: string;
    mapUrl: string | null;
    dressCode: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    bgImageUrl: string | null;
  };
}

export default function StaticInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<StaticInvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/static-invite/${token}`)
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json();
          setError(body.error || "Invitación no disponible");
          return;
        }
        setData(await response.json());
      })
      .catch(() => setError("Error de conexión. Intenta de nuevo más tarde."))
      .finally(() => setLoading(false));
  }, [token]);

  const bgStyle = useMemo(
    () => (data ? getInvitationBackgroundStyle(data.event) : {}),
    [data]
  );

  if (loading) {
    return (
      <div className="invitation-bg flex items-center justify-center">
        <div className="text-text-muted text-lg">Cargando invitación...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="invitation-bg flex items-center justify-center p-4">
        <div className="invitation-card max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h1
            className="text-2xl font-bold text-text-main mb-2"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Invitación no disponible
          </h1>
          <p className="text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invitation-bg min-h-screen py-6 px-4" style={bgStyle}>
      <div className="max-w-lg mx-auto">
        <div className="invitation-card p-8 text-center animate-fade-in-up">
          {data.event.description ? (
            <div
              className="prose-invite mb-6"
              dangerouslySetInnerHTML={{
                __html: renderInviteHtml(data.event.description),
              }}
            />
          ) : (
            <h1
              className="text-3xl font-bold text-text-main mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {data.event.name}
            </h1>
          )}

          <div className="divider-ornament">
            <span className="text-accent text-sm">✦</span>
          </div>

          <div className="space-y-3 text-text-muted">
            <div className="flex items-center justify-center gap-2">
              <CalendarDays className="w-5 h-5 text-accent shrink-0" />
              <span>{formatDate(data.event.date, true)}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-accent shrink-0" />
              <span>{formatTime(data.event.time)}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPin className="w-5 h-5 text-accent shrink-0" />
              <span>{data.event.location}</span>
            </div>
            {data.event.dressCode && (
              <div className="flex items-center justify-center gap-2">
                <Shirt className="w-5 h-5 text-accent shrink-0" />
                <span>{data.event.dressCode}</span>
              </div>
            )}
            {data.event.mapUrl && (
              <a
                href={data.event.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-main bg-bg-warm border border-border/50 rounded-full px-4 py-2 text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                Ver en Google Maps
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
