import type { HeroImagePlacement } from "@/lib/hero-image-placement";

export type HeroSection = "primary" | "secondary" | "tertiary";
export type HeroSlideKind = "product" | "offer" | "collection" | "custom";
export type HeroCtaStyle = "light" | "dark" | "outline";
export type HeroImagePosition = "left" | "center" | "right";

export type HeroSlideConfig = {
  id: string;
  section?: HeroSection;
  tickerText?: string;
  imageOpacity?: number;
  secondaryButton?: string;
  secondaryHref?: string;
  kind: HeroSlideKind;
  productId?: string | null;
  label: string;
  brand?: string;
  title: string;
  subtitle: string;
  button: string;
  href: string;
  badge: string;
  discountText?: string;
  imageUrl: string;
  imagePublicId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  showCountdown?: boolean;
  ctaStyle?: HeroCtaStyle;
  imagePlacement?: HeroImagePlacement;
  imagePosition?: HeroImagePosition;
  enabled: boolean;
  order: number;
};
