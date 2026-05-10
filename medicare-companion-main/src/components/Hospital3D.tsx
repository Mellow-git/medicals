import { Cross, Pill, Heart, Stethoscope, Plus, Activity } from "lucide-react";

/**
 * Pure CSS/SVG 3D hospital scene — no heavy webgl deps.
 * Isometric building + floating medical icons.
 */
export function Hospital3D({ className = "" }: { className?: string }) {
  return (
    <div className={`scene-3d relative ${className}`}>
      {/* Glow halo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-[80%] rounded-full bg-gradient-primary opacity-20 blur-3xl" />
      </div>

      {/* Floating icons orbiting */}
      <div className="absolute inset-0 spin-slow">
        <FloatingIcon className="absolute top-4 left-1/2 -translate-x-1/2 float-fast" icon={<Pill />} />
        <FloatingIcon className="absolute bottom-8 left-6 float-med" icon={<Heart />} />
        <FloatingIcon className="absolute bottom-8 right-6 float-slow" icon={<Stethoscope />} />
        <FloatingIcon className="absolute top-1/2 -left-4 float-fast" icon={<Activity />} />
        <FloatingIcon className="absolute top-1/2 -right-4 float-slow" icon={<Plus />} />
      </div>

      {/* Isometric hospital building */}
      <div className="relative flex h-full w-full items-center justify-center">
        <svg viewBox="0 0 320 320" className="float-slow drop-shadow-2xl size-[85%]">
          <defs>
            <linearGradient id="roof" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.62 0.24 27)" />
              <stop offset="100%" stopColor="oklch(0.45 0.20 27)" />
            </linearGradient>
            <linearGradient id="front" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" />
              <stop offset="100%" stopColor="oklch(0.95 0.012 20)" />
            </linearGradient>
            <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.92 0.015 20)" />
              <stop offset="100%" stopColor="oklch(0.85 0.018 20)" />
            </linearGradient>
            <linearGradient id="cross" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.65 0.24 27)" />
              <stop offset="100%" stopColor="oklch(0.50 0.22 27)" />
            </linearGradient>
            <radialGradient id="floor" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="oklch(0.55 0.22 27 / 0.25)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Floor shadow */}
          <ellipse cx="160" cy="280" rx="120" ry="22" fill="url(#floor)" />

          {/* Building base — isometric */}
          {/* Right side (3D depth) */}
          <polygon points="220,90 280,120 280,250 220,220" fill="url(#side)" />
          {/* Front face */}
          <polygon points="60,90 220,90 220,220 60,220" fill="url(#front)" />
          {/* Roof */}
          <polygon points="60,90 220,90 280,120 120,120" fill="url(#roof)" />

          {/* Windows grid */}
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={75 + col * 35}
                y={110 + row * 35}
                width="20"
                height="22"
                rx="2"
                fill="oklch(0.55 0.22 27 / 0.12)"
                stroke="oklch(0.55 0.22 27 / 0.25)"
                strokeWidth="1"
              />
            ))
          )}

          {/* Door */}
          <rect x="130" y="180" width="30" height="40" rx="3" fill="oklch(0.55 0.22 27)" />
          <rect x="135" y="185" width="20" height="32" rx="2" fill="oklch(0.65 0.24 27 / 0.6)" />

          {/* Big medical cross sign */}
          <g transform="translate(160 65)">
            <circle r="22" fill="white" stroke="oklch(0.55 0.22 27)" strokeWidth="3" />
            <rect x="-4" y="-12" width="8" height="24" rx="1.5" fill="url(#cross)" />
            <rect x="-12" y="-4" width="24" height="8" rx="1.5" fill="url(#cross)" />
          </g>

          {/* Side detail crosses */}
          <g transform="translate(250 170)" opacity="0.9">
            <rect x="-2" y="-7" width="4" height="14" fill="white" opacity="0.7" />
            <rect x="-7" y="-2" width="14" height="4" fill="white" opacity="0.7" />
          </g>
        </svg>

        {/* Pulse rings around the building */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="size-40 rounded-full border-2 border-primary/40 pulse-ring" />
          <div className="absolute size-40 rounded-full border-2 border-primary/40 pulse-ring" style={{ animationDelay: "1s" }} />
        </div>
      </div>
    </div>
  );
}

function FloatingIcon({ icon, className = "" }: { icon: React.ReactNode; className?: string }) {
  return (
    <div className={`size-12 grid place-items-center rounded-2xl bg-white shadow-soft text-primary border border-primary/10 ${className}`}>
      <div className="size-5 [&_svg]:size-5">{icon}</div>
    </div>
  );
}
