export const FIXED_INVITATION_SECTION_IDS = {
  introduction: "introduction",
  ceremony: "ceremony",
  reception: "reception",
  guests: "guests",
  actions: "actions",
} as const;

export type InvitationSectionType =
  | "INTRODUCTION"
  | "CEREMONY"
  | "RECEPTION"
  | "GUESTS"
  | "ACTIONS"
  | "CUSTOM";

export interface InvitationSection {
  id: string;
  type: InvitationSectionType;
  title?: string;
  content?: string;
}

export const DEFAULT_INVITATION_SECTIONS: InvitationSection[] = [
  {
    id: FIXED_INVITATION_SECTION_IDS.introduction,
    type: "INTRODUCTION",
  },
  {
    id: FIXED_INVITATION_SECTION_IDS.ceremony,
    type: "CEREMONY",
  },
  {
    id: FIXED_INVITATION_SECTION_IDS.reception,
    type: "RECEPTION",
  },
  {
    id: FIXED_INVITATION_SECTION_IDS.guests,
    type: "GUESTS",
  },
  {
    id: FIXED_INVITATION_SECTION_IDS.actions,
    type: "ACTIONS",
  },
];

const VALID_TYPES = new Set<InvitationSectionType>([
  "INTRODUCTION",
  "CEREMONY",
  "RECEPTION",
  "GUESTS",
  "ACTIONS",
  "CUSTOM",
]);

export function normalizeInvitationSections(
  value: unknown
): InvitationSection[] {
  if (!Array.isArray(value)) return DEFAULT_INVITATION_SECTIONS;

  const sections = value.filter((section): section is InvitationSection => {
    if (!section || typeof section !== "object") return false;
    const candidate = section as Partial<InvitationSection>;
    return (
      typeof candidate.id === "string" &&
      typeof candidate.type === "string" &&
      VALID_TYPES.has(candidate.type as InvitationSectionType)
    );
  });

  return sections.length > 0 ? sections : DEFAULT_INVITATION_SECTIONS;
}

export function createCustomInvitationSection(): InvitationSection {
  return {
    id: `custom-${crypto.randomUUID()}`,
    type: "CUSTOM",
    title: "",
    content: "",
  };
}

export const INVITATION_SECTION_LABELS: Record<
  InvitationSectionType,
  string
> = {
  INTRODUCTION: "Introducción",
  CEREMONY: "Ceremonia religiosa",
  RECEPTION: "Recepción",
  GUESTS: "Invitados y lugares asignados",
  ACTIONS: "Confirmación y acciones",
  CUSTOM: "Sección personalizada",
};
