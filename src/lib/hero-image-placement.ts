export type ImagePlacement = { scale: number };
export type HeroImagePlacement = { desktop: ImagePlacement; mobile: ImagePlacement };
const defaultPlacement: ImagePlacement = { scale: 100 };
function numeric(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(Math.min(max, Math.max(min, value))) : fallback;
}
function placement(value: unknown, fallback: ImagePlacement): ImagePlacement {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return { scale: numeric(source.scale, fallback.scale, 40, 180) };
}
export function normalizeHeroImagePlacement(value: unknown, fallback?: HeroImagePlacement): HeroImagePlacement {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return { desktop: placement(source.desktop, fallback?.desktop || defaultPlacement), mobile: placement(source.mobile, fallback?.mobile || defaultPlacement) };
}
