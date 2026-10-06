"use client";

import { use, useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  InvitationCustomSection,
  InvitationIntroduction,
  InvitationSchedule,
} from "@/components/InvitationContentSections";
import { getInvitationBackgroundStyle } from "@/lib/invitationTheme";
import {
  normalizeInvitationSections,
  type InvitationSection,
} from "@/lib/invitationSections";

interface StaticInvitationData {
  event: {
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
    primaryColor: string | null;
    secondaryColor: string | null;
    bgImageUrl: string | null;
    invitationSections: InvitationSection[] | null;
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
      <div className="max-w-lg mx-auto space-y-6">
        {normalizeInvitationSections(data.event.invitationSections).map(
          (section) => {
            if (section.type === "INTRODUCTION") {
              return (
                <InvitationIntroduction
                  key={section.id}
                  event={data.event}
                />
              );
            }
            if (section.type === "CEREMONY") {
              return (
                <InvitationSchedule
                  key={section.id}
                  event={data.event}
                  type="CEREMONY"
                />
              );
            }
            if (section.type === "RECEPTION") {
              return (
                <InvitationSchedule
                  key={section.id}
                  event={data.event}
                  type="RECEPTION"
                />
              );
            }
            if (section.type === "CUSTOM") {
              return (
                <InvitationCustomSection
                  key={section.id}
                  section={section}
                />
              );
            }
            return null;
          }
        )}
      </div>
    </div>
  );
}
