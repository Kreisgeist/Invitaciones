import type { CSSProperties } from "react";
import { getDirectImageUrl } from "@/lib/utils";

interface InvitationTheme {
  primaryColor: string | null;
  secondaryColor: string | null;
  bgImageUrl: string | null;
}

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ] as [number, number, number];
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((color) =>
      Math.max(0, Math.min(255, Math.round(color)))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;

const mix = (
  hex: string,
  target: [number, number, number],
  percentage: number
) => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    r + (target[0] - r) * percentage,
    g + (target[1] - g) * percentage,
    b + (target[2] - b) * percentage
  );
};

export function getInvitationThemeStyle(theme: InvitationTheme): CSSProperties {
  const primary = theme.primaryColor || "#8B5E3C";
  const accent = theme.secondaryColor || "#D4AF37";
  const vars: Record<string, string> = {
    "--color-primary": primary,
    "--color-primary-light": mix(primary, [255, 255, 255], 0.45),
    "--color-primary-dark": mix(primary, [0, 0, 0], 0.35),
    "--color-accent": accent,
    "--color-accent-light": mix(accent, [255, 255, 255], 0.55),
    "--color-bg-warm": mix(primary, [255, 255, 255], 0.93),
    "--color-bg-cream": mix(primary, [255, 255, 255], 0.97),
    "--color-text-main": "#3D2B1F",
    "--color-text-muted": "#8B7355",
    "--color-border": mix(accent, [255, 255, 255], 0.4),
  };

  return vars as CSSProperties;
}

export function getInvitationBackgroundStyle(
  theme: InvitationTheme
): CSSProperties {
  const themeStyle = getInvitationThemeStyle(theme);
  if (!theme.bgImageUrl) return themeStyle;

  const directUrl = getDirectImageUrl(theme.bgImageUrl);
  return {
    ...themeStyle,
    backgroundImage: `linear-gradient(rgba(255,255,255,0.65), rgba(255,255,255,0.65)), url(${directUrl})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  };
}
