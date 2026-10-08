export type AnimationBarDirection = "left" | "right";
export type AnimationBarPlacement = "before-hero" | "after-hero";
export type AnimationBarTheme = "dark" | "light" | "blue";

export type AnimationBarItem = {
  id: string;
  text: string;
  href?: string;
};

export type AnimationBarConfig = {
  id: string;
  name: string;
  items: AnimationBarItem[];
  enabled: boolean;
  autoScroll: boolean;
  allowManualScroll: boolean;
  pauseOnHover: boolean;
  direction: AnimationBarDirection;
  speed: number;
  gap: number;
  separator: string;
  theme: AnimationBarTheme;
  startsAt?: string | null;
  endsAt?: string | null;
  placement: AnimationBarPlacement;
  order: number;
};
