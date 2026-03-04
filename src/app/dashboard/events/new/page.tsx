"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import RichTextEditor, { ColorPickerField } from "@/components/RichTextEditor";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: description || undefined,
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      location: formData.get("location") as string,
      mapUrl: (formData.get("mapUrl") as string) || undefined,
      dressCode: formData.get("dressCode") as string,
      maxGuests: parseInt(formData.get("maxGuests") as string) || 200,
      primaryColor: (formData.get("primaryColor") as string) || undefined,
      secondaryColor: (formData.get("secondaryColor") as string) || undefined,
      bgImageUrl: (formData.get("bgImageUrl") as string) || undefined,
    };

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const event = await res.json();
        router.push(`/dashboard/events/${event.id}`);
      } else {
        const err = await res.json();
        setError(err.error || "Error al crear el evento");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Evento</h1>
        <p className="text-gray-500 mt-1">
          Configura los detalles de tu evento
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nombre del evento *
          </label>
          <input
            name="name"
            className="input-field"
            placeholder="Ej: Fiesta de Cumpleaños"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Descripción
          </label>
          <RichTextEditor
            content=""
            onChange={setDescription}
            placeholder="Escribe la descripción de tu evento..."
          />
          <p className="text-xs text-gray-500 mt-1">Usa las herramientas de formato para personalizar el texto. Se mostrará en la invitación tal como lo definas aquí.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fecha *
            </label>
            <input name="date" type="date" className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Hora *
            </label>
            <input
              name="time"
              type="time"
              className="input-field"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ubicación *
          </label>
          <input
            name="location"
            className="input-field"
            placeholder="Ej: Salón de Eventos Las Palmas"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ubicación en Google Maps
          </label>
          <input
            name="mapUrl"
            type="url"
            className="input-field"
            placeholder="https://maps.google.com/..."
          />
          <p className="text-xs text-gray-500 mt-1">Opcional. Pega el enlace de Google Maps para que los invitados lleguen fácilmente.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Código de vestimenta
            </label>
            <input
              name="dressCode"
              className="input-field"
              placeholder="Ej: Formal, Casual elegante"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Máximo de invitados
            </label>
            <input
              name="maxGuests"
              type="number"
              className="input-field"
              defaultValue={200}
              min={1}
            />
          </div>
        </div>

        {/* Theme customization */}
        <div className="border-t border-gray-200 pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Personalización del formulario de invitación</h3>
          <p className="text-xs text-gray-500 mb-4">Estos colores e imagen se aplicarán al formulario que verán tus invitados.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorPickerField
              name="primaryColor"
              label="Color primario"
              defaultValue="#8B5E3C"
              description="Botones y acentos principales"
            />
            <ColorPickerField
              name="secondaryColor"
              label="Color secundario"
              defaultValue="#D4AF37"
              description="Decoraciones y detalles"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Imagen de fondo (Google Drive)
            </label>
            <input
              name="bgImageUrl"
              type="url"
              className="input-field"
              placeholder="https://drive.google.com/file/d/.../view?usp=drive_link"
            />
            <p className="text-xs text-gray-500 mt-1">Pega el enlace para compartir de Google Drive. La imagen debe ser pública ("Cualquier persona con el enlace").</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/dashboard" className="btn-secondary text-sm">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-sm"
          >
            {loading ? "Creando..." : "Crear Evento"}
          </button>
        </div>
      </form>
    </div>
  );
}
