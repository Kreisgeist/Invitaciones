"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  CalendarDays,
  BarChart3,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  StickyNote,
  UserPlus,
  Clock,
  MapPin,
  Pencil,
  X,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Ticket,
  UserCheck,
  Ban,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import RichTextEditor, { ColorPickerField } from "@/components/RichTextEditor";

interface Guest {
  id: string;
  name: string;
  category: "ADULT" | "CHILD";
  order: number;
  groupId: string;
}

interface Group {
  id: string;
  name: string;
  notes: string | null;
  guests: Guest[];
  _count: { links: number };
}

interface InvitationLink {
  id: string;
  token: string;
  used: boolean;
  usedAt: string | null;
  group: { id: string; name: string };
  response: {
    status: string;
    respondedAt: string;
    guestResponses: {
      guestId: string;
      attending: boolean;
      updatedName: string | null;
      menuChoice: string;
      dietaryNotes: string | null;
      guest: { name: string; category: string };
    }[];
    additionalGuestRequests: {
      id: string;
      fullName: string;
      category: string;
      menuChoice: string;
      approved: boolean;
    }[];
  } | null;
}

interface Round {
  id: string;
  name: string;
  opensAt: string;
  closesAt: string;
  status: "DRAFT" | "OPEN" | "CLOSED";
  allowAdditionalTickets: boolean;
  links: InvitationLink[];
  _count: { links: number };
}

interface EventData {
  id: string;
  name: string;
  description: string | null;
  date: string;
  time: string;
  location: string;
  mapUrl: string | null;
  dressCode: string | null;
  maxGuests: number;
  primaryColor: string | null;
  secondaryColor: string | null;
  bgImageUrl: string | null;
  groups: Group[];
  rounds: Round[];
}

interface Stats {
  totalGroups: number;
  totalGuests: number;
  totalAdults: number;
  totalChildren: number;
  confirmedGroups: number;
  declinedGroups: number;
  pendingGroups: number;
  confirmedGuests: number;
  declinedGuests: number;
  pendingGuests: number;
  adultMenus: number;
  childMenus: number;
  additionalMenusAdult: number;
  additionalMenusChild: number;
  totalAdditionalRequested: number;
  maxGuests: number;
  dietaryNotes: { guestName: string; groupName: string; notes: string }[];
}

type Tab = "groups" | "rounds" | "stats";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const toast = useToast();
  const confirm = useConfirm();
  const [event, setEvent] = useState<EventData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("groups");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editDescription, setEditDescription] = useState("");

  const loadEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
      }
    } catch {
      console.error("Error loading event");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/stats`);
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {
      console.error("Error loading stats");
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
    loadStats();
  }, [loadEvent, loadStats]);

  const copyLink = async (token: string) => {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const url = `${baseUrl}/invite/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const saveEvent = async (formData: FormData) => {
    setEditSaving(true);
    try {
      const data = {
        name: formData.get("name") as string,
        description: editDescription || undefined,
        date: formData.get("date") as string,
        time: formData.get("time") as string,
        location: formData.get("location") as string,
        mapUrl: (formData.get("mapUrl") as string) || undefined,
        dressCode: (formData.get("dressCode") as string) || undefined,
        maxGuests: parseInt(formData.get("maxGuests") as string) || 200,
        primaryColor: (formData.get("primaryColor") as string) || undefined,
        secondaryColor: (formData.get("secondaryColor") as string) || undefined,
        bgImageUrl: (formData.get("bgImageUrl") as string) || undefined,
      };
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Evento actualizado exitosamente");
        setEditMode(false);
        loadEvent();
        loadStats();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al actualizar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando evento...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Evento no encontrado</p>
        <Link href="/dashboard" className="text-primary hover:underline mt-2 inline-block">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "groups", label: "Grupos e Invitados", icon: Users },
    { key: "rounds", label: "Rondas de Invitación", icon: Send },
    { key: "stats", label: "Resumen", icon: BarChart3 },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {editMode ? (
            <form
              className="w-full bg-white border border-gray-200 rounded-xl p-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                saveEvent(new FormData(e.currentTarget));
              }}
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Pencil className="w-5 h-5" /> Editar Evento
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input name="name" defaultValue={event.name} className="input-field" required />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <RichTextEditor
                    content={event.description ?? ""}
                    onChange={setEditDescription}
                    placeholder="Escribe la descripción de tu evento..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Usa las herramientas de formato para personalizar el texto.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input name="date" type="date" defaultValue={event.date ? new Date(event.date).toISOString().split("T")[0] : ""} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
                  <input name="time" type="time" defaultValue={event.time} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación *</label>
                  <input name="location" defaultValue={event.location} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código de vestimenta</label>
                  <input name="dressCode" defaultValue={event.dressCode ?? ""} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación en Google Maps</label>
                  <input name="mapUrl" type="url" defaultValue={event.mapUrl ?? ""} className="input-field" placeholder="https://maps.google.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de invitados</label>
                  <input name="maxGuests" type="number" defaultValue={event.maxGuests} className="input-field" min={1} />
                </div>
              </div>
              {/* Theme customization */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Personalización del formulario</h3>
                <p className="text-xs text-gray-500 mb-3">Colores e imagen que verán tus invitados.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ColorPickerField
                    name="primaryColor"
                    label="Color primario"
                    defaultValue={event.primaryColor ?? "#8B5E3C"}
                    description="Botones y acentos"
                  />
                  <ColorPickerField
                    name="secondaryColor"
                    label="Color secundario"
                    defaultValue={event.secondaryColor ?? "#D4AF37"}
                    description="Decoraciones"
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de fondo (Google Drive)</label>
                    <input name="bgImageUrl" type="url" defaultValue={event.bgImageUrl ?? ""} className="input-field" placeholder="https://drive.google.com/file/d/.../view?usp=drive_link" />
                    <p className="text-xs text-gray-500 mt-1">Pega el enlace para compartir de Google Drive. La imagen debe ser pública ("Cualquier persona con el enlace").</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditMode(false)} className="btn-secondary text-sm flex items-center gap-1">
                  <X className="w-4 h-4" /> Cancelar
                </button>
                <button type="submit" disabled={editSaving} className="btn-primary text-sm flex items-center gap-1">
                  <Save className="w-4 h-4" /> {editSaving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" />
                    {formatDate(event.date, true)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(event.time)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </span>
                  {event.mapUrl && (
                    <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:text-primary-dark">
                      <ExternalLink className="w-4 h-4" />
                      Google Maps
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 self-start">
                <button
                  onClick={() => { setEditDescription(event.description ?? ""); setEditMode(true); }}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Eliminar evento",
                      message: "¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.",
                      confirmLabel: "Sí, eliminar",
                      variant: "danger",
                    });
                    if (ok) {
                      await fetch(`/api/events/${eventId}`, { method: "DELETE" });
                      toast.success("Evento eliminado");
                      router.push("/dashboard");
                    }
                  }}
                  className="btn-danger text-sm"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary-dark"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "groups" && (
        <GroupsTab
          eventId={eventId}
          groups={event.groups}
          rounds={event.rounds}
          onRefresh={() => {
            loadEvent();
            loadStats();
          }}
        />
      )}
      {activeTab === "rounds" && (
        <RoundsTab
          eventId={eventId}
          rounds={event.rounds}
          onRefresh={() => {
            loadEvent();
            loadStats();
          }}
          copiedToken={copiedToken}
          onCopyLink={copyLink}
        />
      )}
      {activeTab === "stats" && <StatsTab stats={stats} onRefresh={loadStats} />}
    </div>
  );
}

// ─── Groups Tab ───────────────────────────────────────────────
type GroupStatus = "confirmed" | "declined" | "pending" | "partial";

interface GroupResponseInfo {
  status: GroupStatus;
  guestStatuses: Map<string, boolean>;
}

interface AdditionalRequestItem {
  id: string;
  fullName: string;
  category: string;
  menuChoice: string;
  approved: boolean;
  groupName: string;
  groupId: string;
  roundName: string;
}

function GroupsTab({
  eventId,
  groups,
  rounds,
  onRefresh,
}: {
  eventId: string;
  groups: Group[];
  rounds: Round[];
  onRefresh: () => void;
}) {
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupNotes, setNewGroupNotes] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestCategory, setNewGuestCategory] = useState<"ADULT" | "CHILD">("ADULT");
  const [saving, setSaving] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editingGuestName, setEditingGuestName] = useState("");
  const [editingGuestSaving, setEditingGuestSaving] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [editingGroupNotes, setEditingGroupNotes] = useState("");
  const [editingGroupSaving, setEditingGroupSaving] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  // ── Compute response status for each group from rounds ──
  const groupResponseMap = useMemo(() => {
    const map = new Map<string, GroupResponseInfo>();
    for (const group of groups) {
      let latestResponse: InvitationLink["response"] | null = null;
      // Rounds ordered by createdAt desc → first match is latest
      for (const round of rounds) {
        const link = (round.links ?? []).find((l) => l.group.id === group.id);
        if (link?.response) {
          latestResponse = link.response;
          break;
        }
      }
      if (!latestResponse) {
        map.set(group.id, { status: "pending", guestStatuses: new Map() });
        continue;
      }
      if (latestResponse.status === "DECLINED") {
        const gs = new Map<string, boolean>();
        group.guests.forEach((g) => gs.set(g.id, false));
        map.set(group.id, { status: "declined", guestStatuses: gs });
        continue;
      }
      // ACCEPTED → check individual guests
      const gs = new Map<string, boolean>();
      for (const gr of latestResponse.guestResponses) {
        gs.set(gr.guestId, gr.attending);
      }
      const allAttending = group.guests.length > 0 && group.guests.every((g) => gs.get(g.id) === true);
      const noneAttending = group.guests.length > 0 && group.guests.every((g) => gs.get(g.id) === false);
      const status: GroupStatus = noneAttending ? "declined" : allAttending ? "confirmed" : "partial";
      map.set(group.id, { status, guestStatuses: gs });
    }
    return map;
  }, [groups, rounds]);

  // ── Collect additional ticket requests ──
  const additionalRequests = useMemo(() => {
    const reqs: AdditionalRequestItem[] = [];
    for (const round of rounds) {
      for (const link of round.links ?? []) {
        if (link.response?.additionalGuestRequests) {
          for (const req of link.response.additionalGuestRequests) {
            reqs.push({
              ...req,
              groupName: link.group.name,
              groupId: link.group.id,
              roundName: round.name,
            });
          }
        }
      }
    }
    return reqs;
  }, [rounds]);

  // ── Split groups into active / declined ──
  const activeGroups = groups.filter((g) => {
    const info = groupResponseMap.get(g.id);
    return !info || info.status !== "declined";
  });
  const declinedGroups = groups.filter((g) => {
    const info = groupResponseMap.get(g.id);
    return info?.status === "declined";
  });

  const activeGuestCount = activeGroups.reduce((sum, g) => {
    const info = groupResponseMap.get(g.id);
    if (!info || info.status === "pending") return sum + g.guests.length;
    return sum + g.guests.filter((guest) => info.guestStatuses.get(guest.id) !== false).length;
  }, 0);

  const pendingAdditional = additionalRequests.filter((r) => !r.approved);

  // ── CRUD helpers ──
  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, name: newGroupName.trim(), notes: newGroupNotes.trim() || undefined }),
      });
      setNewGroupName("");
      setNewGroupNotes("");
      setShowNewGroup(false);
      toast.success("Grupo creado exitosamente");
      onRefresh();
    } catch { toast.error("Error al crear el grupo"); }
    finally { setSaving(false); }
  };

  const deleteGroup = async (groupId: string) => {
    const ok = await confirm({ title: "Eliminar grupo", message: "¿Eliminar este grupo y todos sus invitados? Esta acción no se puede deshacer.", confirmLabel: "Sí, eliminar", variant: "danger" });
    if (!ok) return;
    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    toast.success("Grupo eliminado");
    onRefresh();
  };

  const addGuest = async (groupId: string) => {
    if (!newGuestName.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, name: newGuestName.trim(), category: newGuestCategory }),
      });
      setNewGuestName("");
      setNewGuestCategory("ADULT");
      toast.success("Invitado agregado");
      onRefresh();
    } catch { toast.error("Error al añadir invitado"); }
    finally { setSaving(false); }
  };

  const deleteGuest = async (guestId: string) => {
    const ok = await confirm({ title: "Eliminar invitado", message: "¿Estás seguro de que deseas eliminar este invitado?", confirmLabel: "Sí, eliminar", variant: "danger" });
    if (!ok) return;
    await fetch(`/api/guests/${guestId}`, { method: "DELETE" });
    toast.success("Invitado eliminado");
    onRefresh();
  };

  const startEditGuest = (guest: Guest) => {
    setEditingGuestId(guest.id);
    setEditingGuestName(guest.name);
  };

  const cancelEditGuest = () => {
    setEditingGuestId(null);
    setEditingGuestName("");
  };

  const saveGuest = async (guest: Guest) => {
    const name = editingGuestName.trim();
    if (!name) {
      toast.error("El nombre del invitado no puede estar vacio");
      return;
    }

    setEditingGuestSaving(true);
    try {
      const res = await fetch(`/api/guests/${guest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: guest.groupId,
          name,
          category: guest.category,
          order: guest.order,
        }),
      });

      if (res.ok) {
        toast.success("Invitado actualizado");
        cancelEditGuest();
        onRefresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al actualizar invitado");
      }
    } catch {
      toast.error("Error de conexion");
    } finally {
      setEditingGuestSaving(false);
    }
  };

  const startEditGroup = (group: Group) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
    setEditingGroupNotes(group.notes ?? "");
  };

  const cancelEditGroup = () => {
    setEditingGroupId(null);
    setEditingGroupName("");
    setEditingGroupNotes("");
  };

  const saveGroup = async (group: Group) => {
    const name = editingGroupName.trim();
    if (!name) {
      toast.error("El nombre del grupo no puede estar vacío");
      return;
    }
    setEditingGroupSaving(true);
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, name, notes: editingGroupNotes.trim() || undefined }),
      });
      if (res.ok) {
        toast.success("Grupo actualizado");
        cancelEditGroup();
        onRefresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al actualizar grupo");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setEditingGroupSaving(false);
    }
  };

  const approveAdditional = async (reqId: string) => {
    setApprovingId(reqId);
    try {
      const res = await fetch(`/api/additional-requests/${reqId}/approve`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || "Solicitud aprobada");
        onRefresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al aprobar");
      }
    } catch { toast.error("Error de conexión"); }
    finally { setApprovingId(null); }
  };

  // ── Status badge helpers ──
  const groupStatusBadge = (status: GroupStatus) => {
    const cfg: Record<GroupStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
      confirmed: { label: "Confirmado", color: "bg-green-100 text-green-700", icon: CheckCircle },
      partial: { label: "Parcial", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
      pending: { label: "Pendiente", color: "bg-gray-100 text-gray-500", icon: Clock },
      declined: { label: "Declinado", color: "bg-red-100 text-red-700", icon: XCircle },
    };
    const { label, color, icon: Icon } = cfg[status];
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
        <Icon className="w-3 h-3" /> {label}
      </span>
    );
  };

  const guestStatusDot = (guestId: string, groupId: string) => {
    const info = groupResponseMap.get(groupId);
    if (!info || info.status === "pending") {
      return <span className="w-2 h-2 rounded-full bg-gray-300" title="Pendiente" />;
    }
    const attending = info.guestStatuses.get(guestId);
    if (attending === true) return <span className="w-2 h-2 rounded-full bg-green-500" title="Asistirá" />;
    if (attending === false) return <span className="w-2 h-2 rounded-full bg-red-400" title="No asistirá" />;
    return <span className="w-2 h-2 rounded-full bg-gray-300" title="Sin respuesta" />;
  };

  // ── Render a group card (reusable for both sections) ──
  const renderGroupCard = (group: Group, dimmed = false) => {
    const isExpanded = expandedGroup === group.id;
    const info = groupResponseMap.get(group.id);
    const status = info?.status ?? "pending";
    const adults = group.guests.filter((g) => g.category === "ADULT");
    const children = group.guests.filter((g) => g.category === "CHILD");

    return (
      <div key={group.id} className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${dimmed ? "opacity-70" : ""}`}>
        {/* Group header */}
        {editingGroupId === group.id ? (
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre del grupo</label>
              <input
                value={editingGroupName}
                onChange={(e) => setEditingGroupName(e.target.value)}
                className="input-field"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); saveGroup(group); }
                  if (e.key === "Escape") { e.preventDefault(); cancelEditGroup(); }
                }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notas internas <span className="text-gray-400">(opcional)</span></label>
              <textarea
                value={editingGroupNotes}
                onChange={(e) => setEditingGroupNotes(e.target.value)}
                className="input-field min-h-15"
                placeholder="Ej: Mesa 5, amigos cercanos, etc."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={cancelEditGroup} disabled={editingGroupSaving} className="btn-secondary text-sm flex items-center gap-1">
                <X className="w-4 h-4" /> Cancelar
              </button>
              <button onClick={() => saveGroup(group)} disabled={editingGroupSaving || !editingGroupName.trim()} className="btn-primary text-sm flex items-center gap-1">
                <Save className="w-4 h-4" /> {editingGroupSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        ) : (
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">{group.name}</h3>
                {groupStatusBadge(status)}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {group.guests.length} invitado(s)
                {adults.length > 0 && ` · ${adults.length} adulto(s)`}
                {children.length > 0 && ` · ${children.length} menor(es)`}
              </p>
            </div>
            {group.notes && <StickyNote className="w-4 h-4 text-amber-400 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); startEditGroup(group); }} className="text-gray-400 hover:text-primary p-1" title="Editar grupo">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }} className="text-gray-400 hover:text-red-500 p-1" title="Eliminar grupo">
              <Trash2 className="w-4 h-4" />
            </button>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>
        )}

        {/* Expanded content */}
        {isExpanded && editingGroupId !== group.id && (
          <div className="border-t border-gray-100 p-4 space-y-4">
            {group.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>Notas:</strong> {group.notes}
              </div>
            )}

            {/* Guest list with status */}
            {group.guests.length > 0 && (
              <div className="space-y-2">
                {group.guests.map((guest) => (
                  <div key={guest.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {guestStatusDot(guest.id, group.id)}
                      {editingGuestId === guest.id ? (
                        <input
                          value={editingGuestName}
                          onChange={(e) => setEditingGuestName(e.target.value)}
                          className="input-field h-8 text-sm py-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveGuest(guest);
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              cancelEditGuest();
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-medium truncate">{guest.name}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${guest.category === "CHILD" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"}`}>
                        {guest.category === "CHILD" ? "Menor" : "Adulto"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {editingGuestId === guest.id ? (
                        <>
                          <button
                            onClick={() => saveGuest(guest)}
                            disabled={editingGuestSaving}
                            className="text-gray-400 hover:text-green-600 disabled:opacity-50"
                            title="Guardar nombre"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditGuest}
                            disabled={editingGuestSaving}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            title="Cancelar edición"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditGuest(guest)}
                            className="text-gray-400 hover:text-primary"
                            title="Editar nombre"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteGuest(guest.id)} className="text-gray-400 hover:text-red-500" title="Eliminar invitado">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add guest form */}
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Agregar invitado</p>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Nombre completo</label>
                  <input
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="input-field"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGuest(group.id); } }}
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs text-gray-500 mb-1">Categoría</label>
                  <select value={newGuestCategory} onChange={(e) => setNewGuestCategory(e.target.value as "ADULT" | "CHILD")} className="input-field">
                    <option value="ADULT">Adulto</option>
                    <option value="CHILD">Menor</option>
                  </select>
                </div>
                <button onClick={() => addGuest(group.id)} disabled={saving || !newGuestName.trim()} className="btn-primary text-sm px-4 py-2.5 flex items-center gap-1" title="Agregar invitado">
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
              {!newGuestName.trim() && (
                <p className="text-xs text-gray-400 mt-1">Escribe el nombre del invitado para habilitarlo</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Main render ──
  return (
    <div className="space-y-8">
      {/* ── Active Groups Section ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            Grupos Activos ({activeGroups.length})
            <span className="text-sm font-normal text-gray-500">
              · {activeGuestCount} invitado(s)
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={onRefresh} className="text-sm text-primary hover:underline flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Actualizar
            </button>
            <button onClick={() => setShowNewGroup(!showNewGroup)} className="btn-primary text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nuevo Grupo
            </button>
          </div>
        </div>

        {/* New group form */}
        {showNewGroup && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del grupo o familia</label>
              <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Ej: Familia García, Amigos del trabajo" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas <span className="text-gray-400 font-normal">(opcional)</span></label>
              <textarea value={newGroupNotes} onChange={(e) => setNewGroupNotes(e.target.value)} placeholder="Ej: Mesa 5, amigos cercanos, etc." className="input-field min-h-15" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNewGroup(false)} className="btn-secondary text-sm">Cancelar</button>
              <button onClick={createGroup} disabled={saving || !newGroupName.trim()} className="btn-primary text-sm">{saving ? "Guardando..." : "Crear Grupo"}</button>
            </div>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay grupos aún. Crea tu primer grupo para comenzar.</p>
          </div>
        ) : activeGroups.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm">Todos los grupos han declinado la invitación.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeGroups.map((group) => renderGroupCard(group))}
          </div>
        )}
      </div>

      {/* ── Additional Ticket Requests Section ── */}
      {additionalRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Ticket className="w-5 h-5 text-amber-600" />
            Boletos Adicionales Solicitados ({additionalRequests.length})
            {pendingAdditional.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {pendingAdditional.length} pendiente(s)
              </span>
            )}
          </h2>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {additionalRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{req.fullName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${req.category === "CHILD" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-600"}`}>
                      {req.category === "CHILD" ? "Menor" : "Adulto"}
                    </span>
                    {req.approved && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">✓ Aprobado</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Solicitado por <span className="font-medium">{req.groupName}</span>
                    <span className="text-gray-400"> · {req.roundName}</span>
                    <span className="text-gray-400"> · Menú {req.menuChoice === "CHILD" ? "infantil" : "adulto"}</span>
                  </p>
                </div>
                {!req.approved && (
                  <button
                    onClick={() => approveAdditional(req.id)}
                    disabled={approvingId === req.id}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 ml-3 flex-shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {approvingId === req.id ? "Aprobando..." : "Aprobar"}
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Al aprobar, el invitado se agrega automáticamente a la lista del grupo correspondiente.
          </p>
        </div>
      )}

      {/* ── Declined Groups Section ── */}
      {declinedGroups.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Ban className="w-5 h-5 text-red-500" />
            Invitados que Declinaron ({declinedGroups.length} grupo(s))
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Estos grupos no son contados en los totales activos. Puedes enviarles una nueva ronda de invitación si deseas reconsiderarlos.
          </p>
          <div className="space-y-3">
            {declinedGroups.map((group) => renderGroupCard(group, true))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rounds Tab ───────────────────────────────────────────────
function RoundsTab({
  eventId,
  rounds,
  onRefresh,
  copiedToken,
  onCopyLink,
}: {
  eventId: string;
  rounds: Round[];
  onRefresh: () => void;
  copiedToken: string | null;
  onCopyLink: (token: string) => void;
}) {
  const [showNewRound, setShowNewRound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedRound, setExpandedRound] = useState<string | null>(null);
  const [defaultOpensAt, setDefaultOpensAt] = useState("");
  const [defaultClosesAt, setDefaultClosesAt] = useState("");
  const toast = useToast();
  const confirm = useConfirm();

  // Helper to calculate round statistics for report
  const calculateRoundStats = (round: Round) => {
    const confirmedGroups = (round.links ?? []).filter(l => l.response?.status === "ACCEPTED") || [];
    const declinedGroups = (round.links ?? []).filter(l => l.response?.status === "DECLINED") || [];
    const pendingGroups = (round.links ?? []).filter(l => !l.response) || [];
    const respondedGroups = confirmedGroups.length + declinedGroups.length;
    
    let totalAttendingGuests = 0;
    let totalDeclinedGuests = 0;
    let totalMenusAdult = 0;
    let totalMenusChild = 0;
    let additionalApprovedCount = 0;
    let additionalPendingCount = 0;
    
    confirmedGroups.forEach(link => {
      if (link.response) {
        totalAttendingGuests += link.response.guestResponses.filter(gr => gr.attending).length;
        totalDeclinedGuests += link.response.guestResponses.filter(gr => !gr.attending).length;
        link.response.guestResponses.forEach(gr => {
          if (gr.attending) {
            if (gr.menuChoice === "CHILD") totalMenusChild++;
            else totalMenusAdult++;
          }
        });
        additionalApprovedCount += link.response.additionalGuestRequests.filter(ag => ag.approved).length;
        additionalPendingCount += link.response.additionalGuestRequests.filter(ag => !ag.approved).length;
      }
    });
    
    return {
      confirmedGroups,
      declinedGroups,
      pendingGroups,
      respondedGroups,
      respondedPercentage: respondedGroups > 0 ? Math.round((respondedGroups / (round.links?.length || 1)) * 100) : 0,
      totalAttendingGuests,
      totalDeclinedGuests,
      totalMenusAdult,
      totalMenusChild,
      additionalApprovedCount,
      additionalPendingCount,
    };
  };

  // Calculate default dates when component mounts or showNewRound changes
  useEffect(() => {
    if (showNewRound) {
      const now = new Date();
      // Format as datetime-local (YYYY-MM-DDTHH:mm)
      const opensAt = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      
      // Add 14 days (2 weeks)
      const closesDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const closesAt = new Date(closesDate.getTime() - closesDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      
      setDefaultOpensAt(opensAt);
      setDefaultClosesAt(closesAt);
    }
  }, [showNewRound]);

  const createRound = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const roundId = (Math.random() + 1).toString(36).substring(7);
    const data = {
      eventId,
      name: formData.get("name") as string,
      opensAt: formData.get("opensAt") as string,
      closesAt: formData.get("closesAt") as string,
      allowAdditionalTickets: formData.get("allowAdditionalTickets") === "on",
      status: "OPEN",
    };

    try {
      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setShowNewRound(false);
        toast.success("Ronda creada y abierta automáticamente");
        onRefresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al crear la ronda");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const updateRoundStatus = async (
    roundId: string,
    status: "DRAFT" | "OPEN" | "CLOSED"
  ) => {
    const labels: Record<string, string> = {
      OPEN: "abrir",
      CLOSED: "cerrar",
      DRAFT: "regresar a borrador",
    };
    const ok = await confirm({
      title: "Cambiar estado de ronda",
      message: `¿Estás seguro de que deseas ${labels[status]} esta ronda?`,
      confirmLabel: "Sí, continuar",
      variant: "warning",
    });
    if (!ok) return;

    await fetch(`/api/rounds/${roundId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast.success(`Ronda actualizada`);
    onRefresh();
  };

  const deleteRound = async (roundId: string) => {
    const ok = await confirm({
      title: "Eliminar ronda",
      message:
        "¿Eliminar esta ronda? Se eliminarán todos los enlaces y respuestas asociadas.",
      confirmLabel: "Sí, eliminar",
      variant: "danger",
    });
    if (!ok) return;
    await fetch(`/api/rounds/${roundId}`, { method: "DELETE" });
    toast.success("Ronda eliminada");
    onRefresh();
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Borrador", color: "bg-gray-100 text-gray-600" },
    OPEN: { label: "Abierta", color: "bg-green-100 text-green-700" },
    CLOSED: { label: "Cerrada", color: "bg-red-100 text-red-700" },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Rondas de Invitación ({rounds.length})
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="text-sm text-primary hover:underline"
          >
            Actualizar
          </button>
          <button
            onClick={() => setShowNewRound(!showNewRound)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Ronda
          </button>
        </div>
      </div>

      {showNewRound && (
        <form
          onSubmit={createRound}
          className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la ronda
            </label>
            <input
              name="name"
              placeholder="Ej: Primera ronda, Ronda familiar"
              className="input-field"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Fecha apertura
              </label>
              <input
                name="opensAt"
                type="datetime-local"
                className="input-field"
                defaultValue={defaultOpensAt}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Fecha cierre
              </label>
              <input
                name="closesAt"
                type="datetime-local"
                className="input-field"
                defaultValue={defaultClosesAt}
                required
              />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              name="allowAdditionalTickets"
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-primary accent-primary"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                Permitir solicitud de boletos adicionales
              </span>
              <p className="text-xs text-gray-400">
                Los invitados podrán solicitar boletos extra al confirmar asistencia
              </p>
            </div>
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewRound(false)}
              className="btn-secondary text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm"
            >
              {saving ? "Creando..." : "Crear Ronda"}
            </button>
          </div>
        </form>
      )}

      {rounds.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <Send className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            No hay rondas creadas. Asegúrate de haber definido grupos e
            invitados antes de crear una ronda.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rounds.map((round) => {
            const isExpanded = expandedRound === round.id;
            const { label: statusLabel, color: statusColor } =
              statusLabels[round.status];
            const respondedCount = (round.links ?? []).filter(
              (l) => l.response
            ).length;
            const totalLinks = (round.links ?? []).length;

            return (
              <div
                key={round.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    setExpandedRound(isExpanded ? null : round.id)
                  }
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {round.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(round.opensAt)} → {formatDate(round.closesAt)}{" "}
                      · {respondedCount}/{totalLinks} respuestas
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {round.status === "DRAFT" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateRoundStatus(round.id, "OPEN");
                        }}
                        className="text-green-600 hover:text-green-700 text-sm font-medium px-3 py-1 border border-green-200 rounded-lg"
                      >
                        Abrir
                      </button>
                    )}
                    {round.status === "OPEN" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateRoundStatus(round.id, "CLOSED");
                        }}
                        className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 border border-red-200 rounded-lg"
                      >
                        Cerrar
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRound(round.id);
                      }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Enlaces de invitación
                    </h4>
                    <div className="space-y-2">
                      {(round.links ?? []).map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-sm font-medium truncate">
                              {link.group.name}
                            </span>
                            {link.response ? (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  link.response.status === "ACCEPTED"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {link.response.status === "ACCEPTED"
                                  ? "Confirmado"
                                  : "Declinado"}
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                Pendiente
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onCopyLink(link.token)}
                              className="text-gray-500 hover:text-primary p-1"
                              title="Copiar enlace"
                            >
                              {copiedToken === link.token ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <a
                              href={`/invite/${link.token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-primary p-1"
                              title="Abrir enlace"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Response details */}
                    {(round.links ?? []).some((l) => l.response) && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Detalle de respuestas
                        </h4>
                        <div className="space-y-3">
                          {(round.links ?? [])
                            .filter((l) => l.response)
                            .map((link) => (
                              <div
                                key={link.id}
                                className="border border-gray-200 rounded-lg p-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm">
                                    {link.group.name}
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      link.response!.status === "ACCEPTED"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {link.response!.status === "ACCEPTED"
                                      ? "Asistirá"
                                      : "No asistirá"}
                                  </span>
                                </div>
                                {link.response!.status === "ACCEPTED" && (
                                  <>
                                    <div className="space-y-1">
                                      {link.response!.guestResponses.map(
                                        (gr, i) => (
                                          <div
                                            key={i}
                                            className="text-sm flex items-center gap-2"
                                          >
                                            <span
                                              className={`w-2 h-2 rounded-full ${
                                                gr.attending
                                                  ? "bg-green-500"
                                                  : "bg-red-400"
                                              }`}
                                            />
                                            <span>
                                              {gr.updatedName ||
                                                gr.guest.name}
                                            </span>
                                            <span className="text-gray-400">
                                              ·
                                            </span>
                                            <span className="text-gray-500 text-xs">
                                              {gr.attending
                                                ? `Asiste · Menú ${
                                                    gr.menuChoice ===
                                                    "CHILD"
                                                      ? "infantil"
                                                      : "adulto"
                                                  }`
                                                : "No asiste"}
                                            </span>
                                            {gr.dietaryNotes && (
                                              <span className="text-xs text-amber-600">
                                                ⚠ {gr.dietaryNotes}
                                              </span>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                    {link.response!.additionalGuestRequests
                                      .length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-gray-100">
                                        <p className="text-xs text-amber-600 font-medium mb-1">
                                          Boletos adicionales solicitados:
                                        </p>
                                        {link.response!.additionalGuestRequests.map(
                                          (ag, i) => (
                                            <div
                                              key={i}
                                              className="text-sm text-gray-600"
                                            >
                                              {ag.fullName} ({ag.category === "CHILD" ? "Menor" : "Adulto"} · Menú{" "}
                                              {ag.menuChoice === "CHILD"
                                                ? "infantil"
                                                : "adulto"}
                                              )
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Round Report (only for CLOSED rounds with responses) */}
                {round.status === "CLOSED" && (round.links ?? []).some(l => l.response) && (
                  <div className="border-t border-gray-100 p-4 bg-blue-50/50">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      Reporte de Ronda
                    </h4>
                    {(() => {
                      const stats = calculateRoundStats(round);
                      return (
                        <div className="space-y-4">
                          {/* Summary cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Respuestas</p>
                              <p className="text-xl font-bold text-gray-900">{stats.respondedGroups}/{round.links?.length || 0}</p>
                              <p className="text-xs text-gray-500 mt-1">{stats.respondedPercentage}%</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Confirmados</p>
                              <p className="text-xl font-bold text-green-600">{stats.confirmedGroups.length}</p>
                              <p className="text-xs text-gray-500 mt-1">grupo(s)</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Asistentes</p>
                              <p className="text-xl font-bold text-green-600">{stats.totalAttendingGuests}</p>
                              <p className="text-xs text-gray-500 mt-1">confirmado(s)</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Menús</p>
                              <p className="text-xl font-bold text-gray-900">{stats.totalMenusAdult + stats.totalMenusChild}</p>
                              <p className="text-xs text-gray-500 mt-1">{stats.totalMenusAdult}A / {stats.totalMenusChild}N</p>
                            </div>
                          </div>

                          {/* Group breakdown */}
                          {stats.confirmedGroups.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Grupos que asistirán</p>
                              <div className="space-y-2">
                                {stats.confirmedGroups.map(link => (
                                  <div key={link.id} className="bg-white border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-sm">{link.group.name}</span>
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Confirmado</span>
                                    </div>
                                    {link.response && (
                                      <div className="text-xs text-gray-600 space-y-1">
                                        <p>{link.response.guestResponses.filter(gr => gr.attending).length} asistente(s):</p>
                                        <ul className="ml-3 space-y-0.5">
                                          {link.response.guestResponses.filter(gr => gr.attending).map((gr, i) => (
                                            <li key={i}>• {gr.updatedName || gr.guest.name} ({gr.menuChoice === "CHILD" ? "menú infantil" : "menú adulto"})</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Pending groups */}
                          {stats.pendingGroups.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Grupos sin respuesta</p>
                              <div className="space-y-2">
                                {stats.pendingGroups.map(link => (
                                  <div key={link.id} className="bg-white border border-yellow-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-sm">{link.group.name}</span>
                                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pendiente</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Declined groups */}
                          {stats.declinedGroups.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Grupos que declinaron</p>
                              <div className="space-y-2">
                                {stats.declinedGroups.map(link => (
                                  <div key={link.id} className="bg-white border border-red-200 rounded-lg p-3">
                                    <span className="text-sm font-medium text-gray-900">{link.group.name}</span>
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-2">Declinado</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Additional tickets */}
                          {(stats.additionalApprovedCount > 0 || stats.additionalPendingCount > 0) && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase">Boletos adicionales</p>
                              <p className="text-xs text-gray-600">
                                <span className="text-green-600 font-medium">{stats.additionalApprovedCount}</span> aprobado(s) · <span className="text-amber-600 font-medium">{stats.additionalPendingCount}</span> pendiente(s)
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Stats Tab ───────────────────────────────────────────────
function StatsTab({
  stats,
  onRefresh,
}: {
  stats: Stats | null;
  onRefresh: () => void;
}) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-gray-500">Cargando estadísticas...</div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Invitados",
      value: stats.totalGuests,
      sub: `${stats.totalAdults} adulto(s) · ${stats.totalChildren} menor(es) · ${stats.totalGroups} grupo(s)`,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Confirmados",
      value: stats.confirmedGuests,
      sub: `${stats.confirmedGroups} grupo(s)`,
      color: "bg-green-50 text-green-700 border-green-200",
    },
    {
      label: "Declinados",
      value: stats.declinedGuests,
      sub: `${stats.declinedGroups} grupo(s)`,
      color: "bg-red-50 text-red-700 border-red-200",
    },
    {
      label: "Pendientes",
      value: stats.pendingGuests,
      sub: `${stats.pendingGroups} grupo(s)`,
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
  ];

  const menuCards = [
    {
      label: "Menú Adulto",
      value: stats.adultMenus,
      color: "bg-gray-50 text-gray-700 border-gray-200",
    },
    {
      label: "Menú Infantil",
      value: stats.childMenus,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Boletos Adicionales",
      value: stats.totalAdditionalRequested,
      sub: `${stats.additionalMenusAdult} adulto(s) · ${stats.additionalMenusChild} menor(es)`,
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Resumen del Evento
        </h2>
        <button
          onClick={onRefresh}
          className="text-sm text-primary hover:underline"
        >
          Actualizar
        </button>
      </div>

      {/* Capacity bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Capacidad del evento
          </span>
          <span className="text-sm text-gray-500">
            {stats.confirmedGuests + stats.totalAdditionalRequested} /{" "}
            {stats.maxGuests}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-primary rounded-full h-3 transition-all"
            style={{
              width: `${Math.min(
                100,
                ((stats.confirmedGuests + stats.totalAdditionalRequested) /
                  stats.maxGuests) *
                  100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-4 ${card.color}`}
          >
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm font-medium mt-1">{card.label}</p>
            {card.sub && (
              <p className="text-xs opacity-70 mt-0.5">{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Menu breakdown */}
      <h3 className="text-md font-semibold text-gray-900 mb-3">
        Desglose de Menús
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {menuCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border p-4 ${card.color}`}
          >
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm font-medium mt-1">{card.label}</p>
            {card.sub && (
              <p className="text-xs opacity-70 mt-0.5">{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Dietary notes / allergies */}
      <h3 className="text-md font-semibold text-gray-900 mb-3 mt-6">
        Alergias y Restricciones Alimentarias
      </h3>
      {stats.dietaryNotes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400">
            Ningún invitado ha registrado alergias o restricciones alimentarias.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-100">
            {stats.dietaryNotes.map((dn, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span className="text-amber-500 mt-0.5">⚠</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {dn.guestName}{" "}
                    <span className="text-xs text-gray-400 font-normal">
                      ({dn.groupName})
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">{dn.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
