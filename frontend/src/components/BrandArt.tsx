import React from 'react';

/**
 * A minimal, modern nod to Sidi Bou Said: three arches, the famous blue door
 * with its black studs, and a single zellige star. Drawn as SVG so it scales
 * crisply and costs nothing to load.
 */
export default function BrandArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 560"
      className={className}
      role="img"
      aria-label="Sidi Bou Said arches illustration"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EAF5FF" />
          <stop offset="100%" stopColor="#D3E7F7" />
        </linearGradient>
        <linearGradient id="doorBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0A7BE8" />
          <stop offset="100%" stopColor="#00539C" />
        </linearGradient>
        <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EFF6FB" />
        </linearGradient>
      </defs>

      <rect width="420" height="560" fill="url(#sky)" rx="28" />

      {/* soft light */}
      <circle cx="330" cy="96" r="120" fill="#FFFFFF" opacity="0.5" />
      <circle cx="70" cy="470" r="150" fill="#0073E6" opacity="0.06" />

      {/* main wall block */}
      <path
        d="M60 560V250c0-60 48-108 108-108h84c60 0 108 48 108 108v310z"
        fill="url(#wall)"
        stroke="#CFE3F3"
        strokeWidth="2"
      />

      {/* big arch (the door) */}
      <path
        d="M150 560V330c0-33 27-60 60-60s60 27 60 60v230z"
        fill="url(#doorBlue)"
      />
      {/* arch inner shadow */}
      <path
        d="M150 560V330c0-33 27-60 60-60s60 27 60 60v230"
        fill="none"
        stroke="#003366"
        strokeOpacity="0.35"
        strokeWidth="3"
      />

      {/* the black studs of a Tunisian door */}
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={168 + col * 28}
            cy={360 + row * 40}
            r="3.4"
            fill="#08131C"
            opacity="0.7"
          />
        )),
      )}

      {/* side arches */}
      <path
        d="M78 560V420c0-19 15-34 34-34s34 15 34 34v140z"
        fill="#EAF3FB"
        stroke="#BFD9EC"
        strokeWidth="2"
      />
      <path
        d="M274 560V420c0-19 15-34 34-34s34 15 34 34v140z"
        fill="#EAF3FB"
        stroke="#BFD9EC"
        strokeWidth="2"
      />

      {/* zellige star above the door */}
      <g transform="translate(210 232)" fill="#C9A227" opacity="0.9">
        <path d="M0-26 7-9l18-1-14 12 5 18L0 32-16 12l5-18-14-12 18 1z" />
      </g>

      {/* ground line */}
      <rect x="60" y="552" width="300" height="8" rx="4" fill="#BFD9EC" />
    </svg>
  );
}
