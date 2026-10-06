"use client";

import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import {
  createCustomInvitationSection,
  INVITATION_SECTION_LABELS,
  type InvitationSection,
} from "@/lib/invitationSections";

export default function InvitationSectionEditor({
  sections,
  onChange,
}: {
  sections: InvitationSection[];
  onChange: (sections: InvitationSection[]) => void;
}) {
  const moveSection = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= sections.length) return;

    const next = [...sections];
    [next[index], next[destination]] = [next[destination], next[index]];
    onChange(next);
  };

  const updateSection = (
    id: string,
    updates: Partial<InvitationSection>
  ) => {
    onChange(
      sections.map((section) =>
        section.id === id ? { ...section, ...updates } : section
      )
    );
  };

  const removeSection = (id: string) => {
    onChange(sections.filter((section) => section.id !== id));
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          Orden de las secciones
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Usa las flechas para ordenar la invitación. Las secciones de invitados
          y confirmación no se mostrarán en el enlace informativo.
        </p>
      </div>

      {sections.map((section, index) => (
        <div
          key={section.id}
          className="border border-gray-200 rounded-lg bg-gray-50 p-3"
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm font-medium text-gray-800 flex-1">
              {INVITATION_SECTION_LABELS[section.type]}
            </span>
            <button
              type="button"
              onClick={() => moveSection(index, -1)}
              disabled={index === 0}
              className="p-1 text-gray-500 hover:text-primary disabled:opacity-30"
              title="Mover arriba"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => moveSection(index, 1)}
              disabled={index === sections.length - 1}
              className="p-1 text-gray-500 hover:text-primary disabled:opacity-30"
              title="Mover abajo"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            {section.type === "CUSTOM" && (
              <button
                type="button"
                onClick={() => removeSection(section.id)}
                className="p-1 text-gray-400 hover:text-red-500"
                title="Eliminar sección"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {section.type === "CUSTOM" && (
            <div className="mt-3 space-y-3">
              <input
                value={section.title ?? ""}
                onChange={(event) =>
                  updateSection(section.id, { title: event.target.value })
                }
                className="input-field"
                placeholder="Título, por ejemplo: Mis padrinos"
              />
              <RichTextEditor
                content={section.content ?? ""}
                onChange={(content) =>
                  updateSection(section.id, { content })
                }
                placeholder="Contenido de esta sección..."
              />
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          onChange([...sections, createCustomInvitationSection()])
        }
        className="text-sm text-primary hover:text-primary-dark inline-flex items-center gap-1"
      >
        <Plus className="w-4 h-4" />
        Agregar sección personalizada
      </button>
    </div>
  );
}
