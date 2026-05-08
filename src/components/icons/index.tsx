import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const baseIconProps: IconProps = {
  width: 14,
  height: 14,
  viewBox: "0 0 14 14",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
};

export function DrawIcon(props: IconProps) {
  return (
    <svg {...baseIconProps} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8.5 2.5l3 3-7.5 7.5H1v-3l7.5-7.5z" />
      <path d="M7 4l3 3" />
    </svg>
  );
}

export function EraseIcon(props: IconProps) {
  return (
    <svg {...baseIconProps} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3.5 13h7M5 10.5L1.5 7a1.5 1.5 0 010-2.12l5-5a1.5 1.5 0 012.12 0L12.5 3.75a1.5 1.5 0 010 2.12L9 9.5" />
      <path d="M5 10.5l4-1" />
    </svg>
  );
}

export function LineIcon(props: IconProps) {
  return (
    <svg {...baseIconProps} strokeWidth={1.3} strokeLinecap="round" {...props}>
      <line x1="2" y1="12" x2="12" y2="2" />
    </svg>
  );
}

export function RectangleIcon(props: IconProps) {
  return (
    <svg {...baseIconProps} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="10" height="10" rx="0.5" />
    </svg>
  );
}

export function EllipseIcon(props: IconProps) {
  return (
    <svg {...baseIconProps} strokeWidth={1.3} {...props}>
      <ellipse cx="7" cy="7" rx="5" ry="5" />
    </svg>
  );
}

export function FillIcon(props: IconProps) {
  return (
    <svg {...baseIconProps} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1.5 9.5l5-8 5 8a5 5 0 01-10 0z" />
      <path d="M12 10.5c0 .83.67 1.5 1 2s-.17 1.5-1 1.5-1-.67-1-1.5.67-1.5 1-2z" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...baseIconProps} {...props}>
      <circle cx="7" cy="7" r="2.5" />
      <path d="M7 1v1M7 12v1M1 7h1M12 7h1M2.9 2.9l.7.7M10.4 10.4l.7.7M10.4 3.6l-.7.7M3.6 10.4l-.7.7" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...baseIconProps} {...props}>
      <path d="M11.5 8.5A5 5 0 0 1 5.5 2.5a5 5 0 1 0 6 6z" />
    </svg>
  );
}

export function UndoIcon(props: IconProps) {
  return (
    <svg {...baseIconProps} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 5h5.5a3 3 0 0 1 0 6H8" />
      <path d="M5.5 2.5 3 5l2.5 2.5" />
    </svg>
  );
}

export function RedoIcon(props: IconProps) {
  return (
    <svg {...baseIconProps} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 5H5.5a3 3 0 0 0 0 6H6" />
      <path d="M8.5 2.5 11 5 8.5 7.5" />
    </svg>
  );
}

export function ExpandIcon(props: IconProps) {
  return (
    <svg {...baseIconProps} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5.5 2H2v3.5M8.5 2H12v3.5M12 8.5V12H8.5M2 8.5V12h3.5" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...baseIconProps} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3l8 8M11 3 3 11" />
    </svg>
  );
}

export function ColorPickerIcon(props: IconProps) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8.5 2.5 11.5 5.5 6.5 10.5 3.5 10.5 3.5 7.5 8.5 2.5z" />
      <path d="M9.5 1.5 12.5 4.5" />
      <path d="M2 12h10" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M1.5 7s2-3 5.5-3 5.5 3 5.5 3-2 3-5.5 3-5.5-3-5.5-3z" />
      <circle cx="7" cy="7" r="1.7" />
    </svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 14 14"
      fill="none"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M1.5 1.5 12.5 12.5" />
      <path d="M4.1 4.1C4.96 3.65 5.94 3.4 7 3.4c3.5 0 5.5 3 5.5 3a10.03 10.03 0 0 1-2.03 2.41" />
      <path d="M9.15 9.15A2.4 2.4 0 0 1 5.75 5.75" />
      <path d="M3.53 7a9.84 9.84 0 0 0 1.31 1.74" />
    </svg>
  );
}

export function RotateLeftIcon(props: IconProps) {
  return (
    <svg {...baseIconProps} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4H1.5V1.5" />
      <path d="M2 4a5 5 0 1 1 2 8" />
    </svg>
  );
}

export function RotateRightIcon(props: IconProps) {
  return (
    <svg {...baseIconProps} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 4h2.5V1.5" />
      <path d="M12 4a5 5 0 1 0-2 8" />
    </svg>
  );
}
