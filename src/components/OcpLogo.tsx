/**
 * @license
 * Process Flow & Instrument Simulator
 * Official OCP Vector Brand Mark & Typography (New Logo 2024+)
 * Faithfully matches the uploaded OCP brand mark (Star & Wreath Emblem + OCP Logotype)
 */

import React from 'react';

interface OcpLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'symbol';
  showSubtitle?: boolean;
  themeMode?: 'dark' | 'light';
}

export const OcpLogo: React.FC<OcpLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  showSubtitle = true,
  themeMode,
}) => {
  const sizeMap = {
    sm: { height: 28, logoHeight: 26 },
    md: { height: 36, logoHeight: 34 },
    lg: { height: 48, logoHeight: 44 },
  };

  const { height, logoHeight } = sizeMap[size];

  // Official OCP Emerald Brand Green
  const ocpGreen = '#009E49';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official New OCP Vector Logo */}
      <svg
        height={logoHeight}
        viewBox={variant === 'symbol' ? '0 0 100 100' : '0 0 295 100'}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm"
        style={{ width: 'auto' }}
      >
        {/* ========================================================= */}
        {/* PART 1: LEFT EMBLEM (Wreath + 5-Pointed Faceted Star)      */}
        {/* ========================================================= */}
        <g id="ocp-emblem">
          {/* Central 5-Pointed Star (Center at 50, 48) */}
          <g id="central-star" fill={ocpGreen} stroke={ocpGreen} strokeLinejoin="round">
            {/* 1. Top Point (0 deg / -90 deg from center) */}
            {/* Left facet */}
            <path d="M50 17 L44 38 L48 36 L50 44 Z" />
            {/* Right facet */}
            <path d="M50 17 L56 38 L52 36 L50 44 Z" />

            {/* 2. Top-Right Point (+72 deg) */}
            <g transform="rotate(72 50 48)">
              <path d="M50 17 L44 38 L48 36 L50 44 Z" />
              <path d="M50 17 L56 38 L52 36 L50 44 Z" />
            </g>

            {/* 3. Bottom-Right Point (+144 deg) */}
            <g transform="rotate(144 50 48)">
              <path d="M50 17 L44 38 L48 36 L50 44 Z" />
              <path d="M50 17 L56 38 L52 36 L50 44 Z" />
            </g>

            {/* 4. Bottom-Left Point (+216 deg) */}
            <g transform="rotate(216 50 48)">
              <path d="M50 17 L44 38 L48 36 L50 44 Z" />
              <path d="M50 17 L56 38 L52 36 L50 44 Z" />
            </g>

            {/* 5. Top-Left Point (+288 deg) */}
            <g transform="rotate(288 50 48)">
              <path d="M50 17 L44 38 L48 36 L50 44 Z" />
              <path d="M50 17 L56 38 L52 36 L50 44 Z" />
            </g>
          </g>

          {/* Left Wreath Branch (Curving from bottom to top left) */}
          <g id="left-wreath" fill={ocpGreen}>
            {/* Main stem curve */}
            <path
              d="M48 94 C26 92 8 74 6 48 C4 32 12 18 24 10 C21 16 16 29 16 46 C16 68 30 84 48 88 Z"
              opacity="0.95"
            />

            {/* Pairs of stylized grain/olive leaves along left stem */}
            {/* Leaf 1 (bottom) */}
            <path d="M36 86 C28 82 23 75 22 71 C25 72 32 75 39 80 Z" />
            <path d="M26 80 C18 73 15 65 14 60 C18 62 26 67 31 73 Z" />

            {/* Leaf 2 (mid-lower) */}
            <path d="M19 66 C13 58 12 50 11 44 C15 47 21 54 24 61 Z" />
            <path d="M26 56 C20 49 19 41 18 36 C22 39 28 45 30 52 Z" />

            {/* Leaf 3 (mid) */}
            <path d="M16 46 C12 37 13 29 14 24 C17 28 22 36 23 42 Z" />
            <path d="M27 38 C22 30 23 23 24 18 C28 22 32 29 33 35 Z" />

            {/* Leaf 4 (upper) */}
            <path d="M21 28 C18 20 21 14 23 10 C26 14 29 21 29 27 Z" />
            <path d="M33 24 C29 17 32 11 34 8 C37 12 40 18 39 23 Z" />

            {/* Tip leaf seeds at top */}
            <path d="M38 12 C35 7 38 3 41 1 C43 5 44 9 43 13 Z" />
            <path d="M47 8 C44 4 47 1 50 0 C51 4 51 7 49 10 Z" />
          </g>

          {/* Right Wreath Branch (Symmetric mirrored curve) */}
          <g id="right-wreath" fill={ocpGreen}>
            {/* Main stem curve */}
            <path
              d="M52 94 C74 92 92 74 94 48 C96 32 88 18 76 10 C79 16 84 29 84 46 C84 68 70 84 52 88 Z"
              opacity="0.95"
            />

            {/* Leaf 1 (bottom) */}
            <path d="M64 86 C72 82 77 75 78 71 C75 72 68 75 61 80 Z" />
            <path d="M74 80 C82 73 85 65 86 60 C82 62 74 67 69 73 Z" />

            {/* Leaf 2 (mid-lower) */}
            <path d="M81 66 C87 58 88 50 89 44 C85 47 79 54 76 61 Z" />
            <path d="M74 56 C80 49 81 41 82 36 C78 39 72 45 70 52 Z" />

            {/* Leaf 3 (mid) */}
            <path d="M84 46 C88 37 87 29 86 24 C83 28 78 36 77 42 Z" />
            <path d="M73 38 C78 30 77 23 76 18 C72 22 68 29 67 35 Z" />

            {/* Leaf 4 (upper) */}
            <path d="M79 28 C82 20 79 14 77 10 C74 14 71 21 71 27 Z" />
            <path d="M67 24 C71 17 68 11 66 8 C63 12 60 18 61 23 Z" />

            {/* Tip leaf seeds at top */}
            <path d="M62 12 C65 7 62 3 59 1 C57 5 56 9 57 13 Z" />
            <path d="M53 8 C56 4 53 1 50 0 C49 4 49 7 51 10 Z" />
          </g>
        </g>

        {/* ========================================================= */}
        {/* PART 2: RIGHT BOLD LOGOTYPE ("OCP")                       */}
        {/* ========================================================= */}
        {variant === 'full' && (
          <g id="ocp-letters" fill={ocpGreen}>
            {/* Letter 'O' */}
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M148 23 C166 23 178 35 178 51 C178 67 166 79 148 79 C130 79 118 67 118 51 C118 35 130 23 148 23 Z M148 37 C140 37 134 42 134 51 C134 60 140 65 148 65 C156 65 162 60 162 51 C162 42 156 37 148 37 Z"
            />

            {/* Letter 'C' */}
            <path
              d="M232 35 L220 44 C216 38 210 36 202 36 C191 36 183 42 183 51 C183 60 191 66 202 66 C210 66 216 63 221 57 L233 66 C226 75 215 79 201 79 C181 79 167 67 167 51 C167 35 181 23 201 23 C214 23 225 28 232 35 Z"
            />

            {/* Letter 'P' */}
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M238 24 L270 24 C284 24 293 32 293 43 C293 54 284 62 270 62 L254 62 L254 78 L238 78 L238 24 Z M254 36 L254 50 L269 50 C274 50 277 47 277 43 C277 39 274 36 269 36 L254 36 Z"
            />
          </g>
        )}
      </svg>

      {/* Subtitle / Department identifier */}
      {variant === 'full' && showSubtitle && (
        <div className="flex flex-col justify-center leading-none pl-1 border-l border-slate-700/60">
          <span className="text-[11px] font-extrabold tracking-wider text-emerald-500 uppercase font-['Plus_Jakarta_Sans']">
            PROCESS SIMULATOR
          </span>
          <span className="text-[9px] font-medium tracking-tight text-slate-400 whitespace-nowrap">
            Circuits & Instrumentation
          </span>
        </div>
      )}
    </div>
  );
};
