"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { AlertTriangle, Trash2, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ─── Context ──────────────────────────────────────────────────
const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx)
    throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx.confirm;
}

// ─── Provider ─────────────────────────────────────────────────
interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    pending?.resolve(result);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {pending && (
        <ConfirmModal
          options={pending.options}
          onConfirm={() => handleClose(true)}
          onCancel={() => handleClose(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

// ─── Modal ────────────────────────────────────────────────────
const variantConfig: Record<
  ConfirmVariant,
  {
    icon: typeof AlertTriangle;
    iconBg: string;
    iconColor: string;
    btnClass: string;
  }
> = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    btnClass: "btn-danger",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    btnClass:
      "bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    btnClass: "btn-primary",
  },
};

function ConfirmModal({
  options,
  onConfirm,
  onCancel,
}: {
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const variant = options.variant ?? "danger";
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-9998 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-fade-in" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div
            className={`w-14 h-14 rounded-full ${config.iconBg} flex items-center justify-center mb-4`}
          >
            <Icon className={`w-7 h-7 ${config.iconColor}`} />
          </div>

          {/* Text */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {options.title}
          </h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            {options.message}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onCancel}
              className="btn-secondary flex-1 text-sm py-2.5"
            >
              {options.cancelLabel ?? "Cancelar"}
            </button>
            <button
              onClick={onConfirm}
              className={`${config.btnClass} flex-1 text-sm py-2.5`}
            >
              {options.confirmLabel ?? "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
