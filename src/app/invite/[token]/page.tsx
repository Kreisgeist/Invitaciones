"use client";

import { useEffect, useState, useMemo, use } from "react";
import { formatDate, formatTime } from "@/lib/utils";
import {
  InvitationCustomSection,
  InvitationIntroduction,
  InvitationSchedule,
} from "@/components/InvitationContentSections";
import {
  getInvitationBackgroundStyle,
  getInvitationThemeStyle,
} from "@/lib/invitationTheme";
import {
  normalizeInvitationSections,
  type InvitationSection,
} from "@/lib/invitationSections";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  ChefHat,
  UserPlus,
  Trash2,
  AlertCircle,
  PartyPopper,
  HeartCrack,
  Pencil,
  CheckCircle2,
} from "lucide-react";

interface GuestInfo {
  id: string;
  name: string;
  category: "ADULT" | "CHILD";
}

interface EventInfo {
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
}

interface ExistingGuestResponse {
  guestId: string;
  attending: boolean;
  updatedName: string | null;
  menuChoice: "ADULT" | "CHILD";
  dietaryNotes: string | null;
  guestName: string;
  guestCategory: string;
}

interface AdditionalGuestReq {
  id: string;
  fullName: string;
  category: "ADULT" | "CHILD";
  menuChoice: "ADULT" | "CHILD";
}

interface InvitationData {
  token: string;
  displayName: string;
  event: EventInfo;
  guests: GuestInfo[];
  currentGroupSize: number;
  maxGroupSize: number;
  invitationMode: "RSVP" | "STATIC";
  allowAdditionalTickets: boolean;
  status: {
    isExpired: boolean;
    isRoundClosed: boolean;
    isRoundNotOpen: boolean;
    hasResponse: boolean;
    canEdit: boolean;
  };
  existingResponse: {
    status: "ACCEPTED" | "DECLINED";
    respondedAt: string;
    guestResponses: ExistingGuestResponse[];
    additionalGuestRequests: AdditionalGuestReq[];
  } | null;
}

interface GuestFormData {
  guestId: string;
  name: string;
  originalName: string;
  category: "ADULT" | "CHILD";
  attending: boolean;
  menuChoice: "ADULT" | "CHILD";
  dietaryNotes: string;
  updatedName: string;
}

interface AdditionalGuest {
  fullName: string;
  category: "ADULT" | "CHILD";
  menuChoice: "ADULT" | "CHILD";
}

export default function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const toast = useToast();
  const confirmAction = useConfirm();
  const [data, setData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Form state
  const [guestForms, setGuestForms] = useState<GuestFormData[]>([]);
  const [wantsAdditional, setWantsAdditional] = useState(false);
  const [additionalGuests, setAdditionalGuests] = useState<AdditionalGuest[]>(
    []
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<"ACCEPTED" | "DECLINED" | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);

  const themeStyle = useMemo(
    () => (data ? getInvitationThemeStyle(data.event) : {}),
    [data]
  );
  const bgStyle = useMemo(
    () => (data ? getInvitationBackgroundStyle(data.event) : themeStyle),
    [data, themeStyle]
  );

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Error al cargar la invitación");
          setErrorCode(err.code || null);
          return;
        }
        const invData: InvitationData = await res.json();
        setData(invData);

        // Initialize form data from guests
        if (invData.existingResponse && invData.status.hasResponse) {
          // Pre-fill with existing response
          const resp = invData.existingResponse;
          setGuestForms(
            invData.guests.map((g) => {
              const existing = resp.guestResponses.find(
                (gr) => gr.guestId === g.id
              );
              return {
                guestId: g.id,
                name: g.name,
                originalName: g.name,
                category: g.category,
                attending: existing?.attending ?? true,
                menuChoice: existing?.menuChoice || (g.category === "CHILD" ? "CHILD" : "ADULT"),
                dietaryNotes: existing?.dietaryNotes || "",
                updatedName: existing?.updatedName || "",
              };
            })
          );
          if (resp.additionalGuestRequests.length > 0) {
            setWantsAdditional(true);
            setAdditionalGuests(
              resp.additionalGuestRequests.map((ag) => ({
                fullName: ag.fullName,
                category: ag.category,
                menuChoice: ag.menuChoice,
              }))
            );
          }
        } else {
          setGuestForms(
            invData.guests.map((g) => ({
              guestId: g.id,
              name: g.name,
              originalName: g.name,
              category: g.category,
              attending: true,
              menuChoice: g.category === "CHILD" ? "CHILD" : "ADULT",
              dietaryNotes: "",
              updatedName: "",
            }))
          );
        }
      })
      .catch(() => {
        setError("Error de conexión. Intenta de nuevo más tarde.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (responseStatus: "ACCEPTED" | "DECLINED") => {
    setSubmitting(true);

    try {
      const payload = {
        status: responseStatus,
        guestResponses: guestForms.map((gf) => ({
          guestId: gf.guestId,
          attending: responseStatus === "ACCEPTED" ? gf.attending : false,
          updatedName: gf.updatedName || undefined,
          menuChoice: gf.menuChoice,
          dietaryNotes: gf.dietaryNotes || undefined,
        })),
        wantsAdditionalTickets: wantsAdditional,
        additionalGuests:
          responseStatus === "ACCEPTED" ? additionalGuests : [],
      };

      const res = await fetch(`/api/invite/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(responseStatus);
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al enviar la respuesta");
      }
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStaticConfirmation = async () => {
    setSubmitting(true);

    try {
      const res = await fetch(`/api/invite/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });

      if (res.ok) {
        setSubmitted("ACCEPTED");
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al confirmar la invitación");
      }
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const addAdditionalGuest = () => {
    if (data && guestForms.length + additionalGuests.length >= data.maxGroupSize) {
      toast.warning(`El máximo de invitados por grupo es ${data.maxGroupSize}`);
      return;
    }
    setAdditionalGuests([
      ...additionalGuests,
      { fullName: "", category: "ADULT", menuChoice: "ADULT" },
    ]);
  };

  const removeAdditionalGuest = (index: number) => {
    setAdditionalGuests(additionalGuests.filter((_, i) => i !== index));
  };

  const updateAdditionalGuest = (
    index: number,
    field: keyof AdditionalGuest,
    value: string
  ) => {
    setAdditionalGuests(
      additionalGuests.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  };

  const updateGuestForm = (
    index: number,
    field: keyof GuestFormData,
    value: string | boolean
  ) => {
    setGuestForms(
      guestForms.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="invitation-bg flex items-center justify-center" style={bgStyle}>
        <div className="text-text-muted text-lg">Cargando invitación...</div>
      </div>
    );
  }

  // ─── Error states ───
  if (error) {
    return (
      <div className="invitation-bg flex items-center justify-center p-4" style={bgStyle}>
        <div className="invitation-card max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h1
            className="text-2xl font-bold text-text-main mb-2"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            {errorCode === "NOT_FOUND"
              ? "Invitación no encontrada"
              : "Invitación no disponible"}
          </h1>
          <p className="text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // ─── Expired / Closed / Not Open ───
  if (data.status.isExpired || data.status.isRoundClosed) {
    return (
      <div className="invitation-bg flex items-center justify-center p-4" style={bgStyle}>
        <div className="invitation-card max-w-md w-full p-8 text-center">
          <Clock className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h1
            className="text-2xl font-bold text-text-main mb-2"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Periodo finalizado
          </h1>
          <p className="text-text-muted">
            El periodo de confirmación ha finalizado. Si necesitas asistencia,
            contacta directamente a los anfitriones.
          </p>
        </div>
      </div>
    );
  }

  if (data.status.isRoundNotOpen) {
    return (
      <div className="invitation-bg flex items-center justify-center p-4" style={bgStyle}>
        <div className="invitation-card max-w-md w-full p-8 text-center">
          <Clock className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h1
            className="text-2xl font-bold text-text-main mb-2"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Invitación aún no disponible
          </h1>
          <p className="text-text-muted">
            El periodo de confirmación aún no ha iniciado. Te notificaremos
            cuando esté disponible.
          </p>
        </div>
      </div>
    );
  }

  if (data.invitationMode === "STATIC") {
    return (
      <StaticInvitation
        data={data}
        bgStyle={bgStyle}
        confirmed={data.status.hasResponse || submitted === "ACCEPTED"}
        submitting={submitting}
        onConfirm={handleStaticConfirmation}
      />
    );
  }

  // ─── Already responded (not editing) ───
  if (data.status.hasResponse && !isEditing && !submitted) {
    const resp = data.existingResponse!;
    return (
      <div className="invitation-bg flex items-center justify-center p-4" style={bgStyle}>
        <div className="invitation-card max-w-lg w-full p-8">
          <div className="text-center mb-6">
            {resp.status === "ACCEPTED" ? (
              <PartyPopper className="w-12 h-12 text-accent mx-auto mb-3" />
            ) : (
              <HeartCrack className="w-12 h-12 text-text-muted mx-auto mb-3" />
            )}
            <h1
              className="text-2xl font-bold text-text-main mb-2"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Invitación ya respondida
            </h1>
            <p className="text-text-muted">
              {resp.status === "ACCEPTED"
                ? "Ya confirmaste tu asistencia. ¡Te esperamos!"
                : "Lamentamos que no puedas acompañarnos."}
            </p>
          </div>

          {resp.status === "ACCEPTED" && (
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-medium text-text-main">
                Resumen de tu respuesta:
              </h3>
              {resp.guestResponses.map((gr, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg-warm text-sm"
                >
                  <span>{gr.updatedName || gr.guestName}</span>
                  <span className="text-text-muted">
                    {gr.attending
                      ? `Asiste · Menú ${
                          gr.menuChoice === "CHILD" ? "infantil" : "adulto"
                        }`
                      : "No asiste"}
                  </span>
                </div>
              ))}
              {resp.additionalGuestRequests.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-xs text-text-muted mb-1">
                    Boletos adicionales solicitados:
                  </p>
                  {resp.additionalGuestRequests.map((ag, i) => (
                    <div key={i} className="text-sm text-text-muted">
                      {ag.fullName} (
                      {ag.category === "CHILD" ? "Menor" : "Adulto"})
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {data.status.canEdit && (
            <div className="text-center">
              <p className="text-sm text-text-muted mb-3">
                ¿Deseas cambiar tus respuestas?
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary text-sm inline-flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Editar respuestas
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Success / Thank you ───
  if (submitted) {
    return (
      <div className="invitation-bg flex items-center justify-center p-4" style={bgStyle}>
        <div className="invitation-card max-w-lg w-full p-8 text-center">
          {submitted === "ACCEPTED" ? (
            <>
              <PartyPopper className="w-16 h-16 text-accent mx-auto mb-4 animate-fade-in-up" />
              <h1
                className="text-3xl font-bold text-text-main mb-3 animate-fade-in-up animate-delay-100"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                ¡Gracias por confirmar!
              </h1>
              <p className="text-text-muted mb-6 animate-fade-in-up animate-delay-200">
                ¡Nos emociona que puedas acompañarnos! Te esperamos con mucho
                gusto.
              </p>

              {/* Summary */}
              <div className="text-left space-y-2 mb-6 animate-fade-in-up animate-delay-300">
                <h3 className="text-sm font-medium text-text-main">
                  Resumen de tu confirmación:
                </h3>
                {guestForms.map((gf, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg-warm text-sm"
                  >
                    <span className="font-medium">
                      {gf.updatedName || gf.name}
                    </span>
                    <span className="text-text-muted">
                      {gf.attending
                        ? `Asiste · Menú ${
                            gf.menuChoice === "CHILD" ? "infantil" : "adulto"
                          }`
                        : "No asiste"}
                    </span>
                  </div>
                ))}
                {additionalGuests.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-amber-600 mb-1">
                      Boletos adicionales solicitados:
                    </p>
                    {additionalGuests.map((ag, i) => (
                      <div key={i} className="text-sm text-text-muted">
                        {ag.fullName} (
                        {ag.category === "CHILD" ? "Menor" : "Adulto"})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="animate-fade-in-up animate-delay-400">
                <div className="divider-ornament">
                  <span className="text-accent text-sm">✦</span>
                </div>
                <div className="space-y-1 text-sm text-text-muted">
                  <div className="flex items-center justify-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    <span>{formatDate(data.event.date, true)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(data.event.time)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{data.event.location}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <HeartCrack className="w-16 h-16 text-text-muted mx-auto mb-4 animate-fade-in-up" />
              <h1
                className="text-3xl font-bold text-text-main mb-3 animate-fade-in-up animate-delay-100"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Lamentamos que no puedas asistir
              </h1>
              <p className="text-text-muted animate-fade-in-up animate-delay-200">
                Agradecemos que nos hayas informado. ¡Esperamos verte en una
                próxima ocasión!
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Main Form ───
  const adults = guestForms.filter((g) => g.category === "ADULT");
  const children = guestForms.filter((g) => g.category === "CHILD");
  const isGenericName = (name: string) =>
    /^(hijo|hija|niño|niña|menor|invitado|guest|child)\s*\d*$/i.test(
      name.trim()
    );
  const sections = normalizeInvitationSections(
    data.event.invitationSections
  );

  const guestsSection = (
    <div className="space-y-6">
      <div className="invitation-card p-6 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-5 h-5 text-primary" />
          <h2
            className="text-xl font-semibold text-text-main"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            {data.displayName}
          </h2>
        </div>
        <p className="text-text-muted text-sm">
          Hemos reservado {data.guests.length} lugar(es) para tu grupo. Por
          favor confirma la asistencia de cada invitado.
        </p>
      </div>

      {adults.length > 0 && (
        <div className="invitation-card p-6 animate-fade-in-up">
          <h3 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Adultos
          </h3>
          <div className="space-y-4">
            {adults.map((guest) => {
              const idx = guestForms.findIndex(
                (candidate) => candidate.guestId === guest.guestId
              );
              return (
                <GuestCard
                  key={guest.guestId}
                  guest={guest}
                  index={idx}
                  needsNameUpdate={isGenericName(guest.originalName)}
                  isAdult={true}
                  onUpdate={updateGuestForm}
                />
              );
            })}
          </div>
        </div>
      )}

      {children.length > 0 && (
        <div className="invitation-card p-6 animate-fade-in-up">
          <h3 className="text-lg font-semibold text-text-main mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Menores de edad
          </h3>
          <div className="space-y-4">
            {children.map((guest) => {
              const idx = guestForms.findIndex(
                (candidate) => candidate.guestId === guest.guestId
              );
              return (
                <GuestCard
                  key={guest.guestId}
                  guest={guest}
                  index={idx}
                  needsNameUpdate={isGenericName(guest.originalName)}
                  isAdult={false}
                  onUpdate={updateGuestForm}
                />
              );
            })}
          </div>
        </div>
      )}

      {data.allowAdditionalTickets && (
        <AdditionalTicketsSection
          wantsAdditional={wantsAdditional}
          setWantsAdditional={setWantsAdditional}
          additionalGuests={additionalGuests}
          setAdditionalGuests={setAdditionalGuests}
          currentGroupSize={data.currentGroupSize}
          maxGroupSize={data.maxGroupSize}
          onAdd={addAdditionalGuest}
          onRemove={removeAdditionalGuest}
          onUpdate={updateAdditionalGuest}
        />
      )}
    </div>
  );

  const actionsSection = (
    <div className="space-y-3 pb-8 animate-fade-in-up">
      <button
        onClick={() => handleSubmit("ACCEPTED")}
        disabled={submitting}
        className="btn-primary w-full text-center text-lg py-4"
      >
        {submitting ? "Enviando..." : "✨ Confirmar asistencia"}
      </button>
      <button
        onClick={async () => {
          const ok = await confirmAction({
            title: "No podré asistir",
            message:
              "¿Estás seguro de que no podrás asistir? Esta acción registrará que ninguno de los invitados de tu grupo asistirá.",
            confirmLabel: "Confirmar ausencia",
            variant: "warning",
          });
          if (ok) handleSubmit("DECLINED");
        }}
        disabled={submitting}
        className="btn-secondary w-full text-center"
      >
        No podré asistir
      </button>
    </div>
  );

  return (
    <div className="invitation-bg min-h-screen py-6 px-4" style={bgStyle}>
      <div className="max-w-lg mx-auto space-y-6">
        {sections.map((section) => {
          if (section.type === "INTRODUCTION") {
            return (
              <InvitationIntroduction key={section.id} event={data.event} />
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
          if (section.type === "GUESTS") {
            return <div key={section.id}>{guestsSection}</div>;
          }
          if (section.type === "ACTIONS") {
            return <div key={section.id}>{actionsSection}</div>;
          }
          return null;
        })}
      </div>
    </div>
  );
}

function AdditionalTicketsSection({
  wantsAdditional,
  setWantsAdditional,
  additionalGuests,
  setAdditionalGuests,
  currentGroupSize,
  maxGroupSize,
  onAdd,
  onRemove,
  onUpdate,
}: {
  wantsAdditional: boolean;
  setWantsAdditional: (value: boolean) => void;
  additionalGuests: AdditionalGuest[];
  setAdditionalGuests: (guests: AdditionalGuest[]) => void;
  currentGroupSize: number;
  maxGroupSize: number;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (
    index: number,
    field: keyof AdditionalGuest,
    value: string
  ) => void;
}) {
  return (
    <div className="invitation-card p-6 animate-fade-in-up">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={wantsAdditional}
          onChange={(event) => {
            setWantsAdditional(event.target.checked);
            if (!event.target.checked) setAdditionalGuests([]);
          }}
          className="mt-1 w-4 h-4 rounded border-border text-primary accent-primary"
        />
        <div>
          <span className="text-sm font-medium text-text-main">
            ¿Te interesaría contar con más boletos de acceso?
          </span>
          <p className="text-xs text-text-muted mt-1">
            Consideraremos tu solicitud, pero no podemos garantizarte que será
            posible. En caso de serlo, te lo confirmaremos personalmente.
          </p>
        </div>
      </label>

      {wantsAdditional && (
        <div className="mt-4 space-y-3">
          {additionalGuests.map((guest, index) => (
            <div
              key={index}
              className="p-3 rounded-lg bg-bg-warm border border-border space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-text-muted mb-1">
                    Nombre completo
                  </label>
                  <input
                    value={guest.fullName}
                    onChange={(event) =>
                      onUpdate(index, "fullName", event.target.value)
                    }
                    placeholder="Ej: María López"
                    className="input-field"
                  />
                </div>
                <div className="sm:w-28">
                  <label className="block text-xs text-text-muted mb-1">
                    Categoría
                  </label>
                  <select
                    value={guest.category}
                    onChange={(event) => {
                      onUpdate(index, "category", event.target.value);
                      onUpdate(
                        index,
                        "menuChoice",
                        event.target.value === "CHILD" ? "CHILD" : "ADULT"
                      );
                    }}
                    className="input-field"
                  >
                    <option value="ADULT">Adulto</option>
                    <option value="CHILD">Menor</option>
                  </select>
                </div>
                {guest.category === "CHILD" && (
                  <div className="sm:w-36">
                    <label className="block text-xs text-text-muted mb-1">
                      Menú
                    </label>
                    <select
                      value={guest.menuChoice}
                      onChange={(event) =>
                        onUpdate(index, "menuChoice", event.target.value)
                      }
                      className="input-field"
                    >
                      <option value="CHILD">Menú infantil</option>
                      <option value="ADULT">Menú adulto</option>
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-red-400 hover:text-red-600 self-center p-1"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {currentGroupSize + additionalGuests.length < maxGroupSize && (
            <button
              type="button"
              onClick={onAdd}
              className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              Agregar invitado adicional
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StaticInvitation({
  data,
  bgStyle,
  confirmed,
  submitting,
  onConfirm,
}: {
  data: InvitationData;
  bgStyle: React.CSSProperties;
  confirmed: boolean;
  submitting: boolean;
  onConfirm: () => void;
}) {
  const adults = data.guests.filter((guest) => guest.category === "ADULT");
  const children = data.guests.filter((guest) => guest.category === "CHILD");
  const sections = normalizeInvitationSections(
    data.event.invitationSections
  );

  const guestsSection = (
    <div className="space-y-6">
      <div className="invitation-card p-6 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-5 h-5 text-primary" />
          <h2
            className="text-xl font-semibold text-text-main"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            {data.displayName}
          </h2>
        </div>
        <p className="text-text-muted text-sm">
          Hemos reservado {data.currentGroupSize} lugar(es) para tu grupo. Esta
          invitación incluye a las siguientes personas:
        </p>
      </div>

      <div className="invitation-card p-6 animate-fade-in-up">
        {adults.length > 0 && <GuestList title="Adultos" guests={adults} />}
        {children.length > 0 && (
          <div
            className={
              adults.length > 0 ? "mt-5 pt-5 border-t border-border" : ""
            }
          >
            <GuestList title="Menores de edad" guests={children} />
          </div>
        )}
      </div>
    </div>
  );

  const actionsSection = (
    <div className="pb-8 animate-fade-in-up">
      {confirmed ? (
        <div className="invitation-card p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-3" />
          <h3
            className="text-xl font-semibold text-text-main mb-2"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Invitación confirmada
          </h3>
          <p className="text-sm text-text-muted">
            Registramos la asistencia de las {data.currentGroupSize} personas
            incluidas en tu grupo. ¡Te esperamos!
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-text-muted text-center mb-3">
            Al confirmar, registraremos la asistencia de todo el grupo.
          </p>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="btn-primary w-full text-center text-lg py-4"
          >
            {submitting ? "Confirmando..." : "✨ Confirmar invitación"}
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="invitation-bg min-h-screen py-6 px-4" style={bgStyle}>
      <div className="max-w-lg mx-auto space-y-6">
        {sections.map((section) => {
          if (section.type === "INTRODUCTION") {
            return (
              <InvitationIntroduction key={section.id} event={data.event} />
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
          if (section.type === "GUESTS") {
            return <div key={section.id}>{guestsSection}</div>;
          }
          if (section.type === "ACTIONS") {
            return <div key={section.id}>{actionsSection}</div>;
          }
          return null;
        })}
      </div>
    </div>
  );
}

function GuestList({
  title,
  guests,
}: {
  title: string;
  guests: GuestInfo[];
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-text-main mb-3 flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" />
        {title}
      </h3>
      <div className="space-y-2">
        {guests.map((guest) => (
          <div
            key={guest.id}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-bg-warm text-sm"
          >
            <span className="font-medium text-text-main">{guest.name}</span>
            <span className="text-text-muted">
              {guest.category === "CHILD" ? "Menor" : "Adulto"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Guest Card Component ───
function GuestCard({
  guest,
  index,
  needsNameUpdate,
  isAdult,
  onUpdate,
}: {
  guest: GuestFormData;
  index: number;
  needsNameUpdate: boolean;
  isAdult: boolean;
  onUpdate: (
    index: number,
    field: keyof GuestFormData,
    value: string | boolean
  ) => void;
}) {
  return (
    <div className="rounded-xl p-4 space-y-3 bg-white/70">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-main">
            {guest.updatedName || guest.name}
          </span>
          {!isAdult && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Menor
            </span>
          )}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-text-muted">
            {guest.attending ? "Asiste" : "No asiste"}
          </span>
          <div
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              guest.attending ? "bg-green-500" : "bg-gray-300"
            }`}
            onClick={() => onUpdate(index, "attending", !guest.attending)}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                guest.attending ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </div>
        </label>
      </div>

      {/* Name update */}
      {(needsNameUpdate || guest.updatedName) && (
        <div>
          <label className="block text-xs text-text-muted mb-1">
            {needsNameUpdate
              ? "Por favor ingresa el nombre completo"
              : "Actualizar nombre (opcional)"}
          </label>
          <input
            value={guest.updatedName}
            onChange={(e) => onUpdate(index, "updatedName", e.target.value)}
            placeholder={guest.name}
            className="input-field"
            required={needsNameUpdate}
          />
        </div>
      )}

      {/* Name edit for non-generic names */}
      {!needsNameUpdate && !guest.updatedName && (
        <button
          onClick={() => onUpdate(index, "updatedName", guest.name)}
          className="text-xs text-text-muted hover:text-text-main bg-bg-warm border border-border/50 rounded-full px-3 py-1 flex items-center gap-1 transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Corregir nombre
        </button>
      )}

      {guest.attending && (
        <>
          {/* Menu choice - only for children */}
          {!isAdult && (
            <div>
              <label className="block text-xs text-text-muted mb-1 flex items-center gap-1">
                <ChefHat className="w-3 h-3" />
                Menú
              </label>
              <select
                value={guest.menuChoice}
                onChange={(e) => onUpdate(index, "menuChoice", e.target.value)}
                className="input-field"
              >
                <option value="CHILD">Menú infantil</option>
                <option value="ADULT">Menú adulto</option>
              </select>
            </div>
          )}

          {/* Dietary notes */}
          <div>
            <label className="block text-xs text-text-muted mb-1">
              ¿Alguna restricción alimentaria o alergia? (opcional)
            </label>
            <input
              value={guest.dietaryNotes}
              onChange={(e) =>
                onUpdate(index, "dietaryNotes", e.target.value)
              }
              placeholder="Ej: Vegetariano, alergia a mariscos..."
              className="input-field"
            />
          </div>
        </>
      )}
    </div>
  );
}
