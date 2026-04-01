import { z } from "zod";

// ── Event ──
export const eventSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  date: z.string().min(1, "La fecha es requerida"),
  time: z.string().min(1, "La hora es requerida"),
  location: z.string().min(1, "La ubicación es requerida"),
  mapUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  dressCode: z.string().optional(),
  maxGuests: z.coerce.number().int().positive().default(200),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido").optional().or(z.literal("")),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido").optional().or(z.literal("")),
  bgImageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

export type EventInput = z.infer<typeof eventSchema>;

// ── Group ──
export const groupSchema = z.object({
  name: z.string().min(1, "El nombre del grupo es requerido"),
  notes: z.string().optional(),
  eventId: z.string().min(1),
});

export type GroupInput = z.infer<typeof groupSchema>;

// ── Guest ──
export const guestSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  category: z.enum(["ADULT", "CHILD"]).default("ADULT"),
  groupId: z.string().min(1),
  order: z.coerce.number().int().default(0),
});

export type GuestInput = z.infer<typeof guestSchema>;

// ── Round ──
export const roundSchema = z.object({
  name: z.string().min(1, "El nombre de la ronda es requerido"),
  eventId: z.string().min(1),
  opensAt: z.string().min(1, "La fecha de apertura es requerida"),
  closesAt: z.string().min(1, "La fecha de cierre es requerida"),
  allowAdditionalTickets: z.boolean().default(false),
  status: z.enum(["DRAFT", "OPEN", "CLOSED"]).default("DRAFT").optional(),
});

export type RoundInput = z.infer<typeof roundSchema>;

// ── Invitation Response ──
export const guestResponseSchema = z.object({
  guestId: z.string().min(1),
  attending: z.boolean(),
  updatedName: z.string().optional(),
  menuChoice: z.enum(["ADULT", "CHILD"]).default("ADULT"),
  dietaryNotes: z.string().optional(),
});

export const additionalGuestSchema = z.object({
  fullName: z.string().min(1, "El nombre es requerido"),
  category: z.enum(["ADULT", "CHILD"]).default("ADULT"),
  menuChoice: z.enum(["ADULT", "CHILD"]).default("ADULT"),
});

export const invitationResponseSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"]),
  guestResponses: z.array(guestResponseSchema),
  wantsAdditionalTickets: z.boolean().default(false),
  additionalGuests: z.array(additionalGuestSchema).default([]),
});

export type InvitationResponseInput = z.infer<typeof invitationResponseSchema>;

// ── Login ──
export const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginInput = z.infer<typeof loginSchema>;
