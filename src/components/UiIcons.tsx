import type { SVGProps } from "react";

// First-party, dependency-free icons: no icon font, emoji or external asset requests.
type IconProps = SVGProps<SVGSVGElement>;
const base = {
  viewBox: "0 0 24 24",
  width: 20,
  height: 20,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
  focusable: "false" as const,
};

export function ArrowUpRightIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="M5 19 19 5M7 5h12v12" /></svg>;
}

export function ArrowLeftIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m14 5-7 7 7 7M7 12h13" /></svg>;
}

export function ArrowRightIcon(props: IconProps) {
  return <svg {...base} {...props}><path d="m10 5 7 7-7 7M4 12h13" /></svg>;
}

export function ShoppingBagIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8h16l-1.5 12h-13L4 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

export function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg {...base} width={24} height={24}>
      {open ? <path d="M5 5 19 19M19 5 5 19" /> : <path d="M4 8h16M4 16h16" />}
    </svg>
  );
}
