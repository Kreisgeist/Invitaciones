"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable features we don't need
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
        heading: false,
        listItem: false,
        bulletList: false,
        orderedList: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["paragraph"],
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "min-h-[160px] px-3 py-2 text-sm leading-relaxed focus:outline-none prose prose-sm max-w-none [&_p]:my-1",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `p-1.5 rounded transition-colors ${
      active
        ? "bg-gray-200 text-gray-900"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    }`;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-gray-500 focus-within:ring-1 focus-within:ring-gray-300 bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive("bold"))}
          title="Negrita"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive("italic"))}
          title="Cursiva"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive("underline"))}
          title="Subrayado"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={btnClass(editor.isActive({ textAlign: "left" }))}
          title="Alinear a la izquierda"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={btnClass(editor.isActive({ textAlign: "center" }))}
          title="Centrar"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={btnClass(editor.isActive({ textAlign: "right" }))}
          title="Alinear a la derecha"
        >
          <AlignRight className="w-4 h-4" />
        </button>
      </div>

      {/* Editor area */}
      <div className="relative">
        <EditorContent editor={editor} />
        {!content && placeholder && editor.isEmpty && (
          <div className="absolute top-2 left-3 text-gray-400 text-sm pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ColorPickerField — a color picker + hex input combo that works well on mobile.
 * On mobile the native color picker is hard to use, so we also show a text input for hex codes.
 */
export function ColorPickerField({
  name,
  label,
  description,
  defaultValue,
}: {
  name: string;
  label: string;
  description: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          defaultValue={defaultValue}
          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5 shrink-0"
          onChange={(e) => {
            const hex = e.target.nextElementSibling as HTMLInputElement;
            if (hex) hex.value = e.target.value;
          }}
        />
        <input
          name={name}
          type="text"
          defaultValue={defaultValue}
          pattern="^#[0-9A-Fa-f]{6}$"
          maxLength={7}
          className="input-field w-28 font-mono text-sm"
          placeholder="#000000"
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
              const picker = e.target.previousElementSibling as HTMLInputElement;
              if (picker) picker.value = val;
            }
          }}
        />
        <span className="text-xs text-gray-400 hidden sm:inline">{description}</span>
      </div>
      <span className="text-xs text-gray-400 sm:hidden mt-0.5 block">{description}</span>
    </div>
  );
}
