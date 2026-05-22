"use client";

import React, { useEffect, useState } from "react";

export type RadarDataPoint = {
  dimension: string;
  value: number;
  previous?: number;
  fullMark: number;
};

type Props = {
  data: RadarDataPoint[];
  showPrevious?: boolean;
  height?: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function getPolygonPoints(
  cx: number,
  cy: number,
  values: number[],
  maxVal: number,
  maxR: number,
  startAngle: number
): string {
  return values
    .map((v, i) => {
      const angle = startAngle + (2 * Math.PI * i) / values.length;
      const r = (v / maxVal) * maxR;
      const { x, y } = polarToCartesian(cx, cy, r, angle);
      return `${x},${y}`;
    })
    .join(" ");
}

// ─── Color helpers ───────────────────────────────────────────────────────────

function getValueColor(v: number): string {
  if (v >= 7) return "#C1D82F";
  if (v >= 5) return "#eab308";
  return "#ef4444";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RadarChart({ data, showPrevious = false, height = 380 }: Props) {
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 800;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimProgress(eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [data]);

  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const levels = 5;
  const n = data.length;
  const startAngle = -Math.PI / 2; // Start from top

  const animatedValues = data.map((d) => d.value * animProgress);
  const previousValues = data.map((d) => (d.previous ?? 0) * animProgress);

  return (
    <div className="flex flex-col items-center" style={{ height }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[380px]"
        style={{ height: height - 30 }}
      >
        <defs>
          {/* Glow filter */}
          <filter id="radar-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Main area gradient */}
          <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C1D82F" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#C1D82F" stopOpacity="0.08" />
          </radialGradient>
          {/* Previous area gradient */}
          <radialGradient id="radar-prev-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.03" />
          </radialGradient>
          {/* Center glow */}
          <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C1D82F" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#C1D82F" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background glow */}
        <circle cx={cx} cy={cy} r={maxR * 1.1} fill="url(#center-glow)" />

        {/* Grid levels (pentagons/polygons) */}
        {Array.from({ length: levels }, (_, lvl) => {
          const r = ((lvl + 1) / levels) * maxR;
          const points = Array.from({ length: n }, (_, i) => {
            const angle = startAngle + (2 * Math.PI * i) / n;
            const { x, y } = polarToCartesian(cx, cy, r, angle);
            return `${x},${y}`;
          }).join(" ");
          return (
            <polygon
              key={lvl}
              points={points}
              fill="none"
              stroke="white"
              strokeOpacity={lvl === levels - 1 ? 0.15 : 0.06}
              strokeWidth={lvl === levels - 1 ? 1.5 : 0.8}
            />
          );
        })}

        {/* Axis lines */}
        {data.map((_, i) => {
          const angle = startAngle + (2 * Math.PI * i) / n;
          const { x, y } = polarToCartesian(cx, cy, maxR, angle);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="white"
              strokeOpacity={0.08}
              strokeWidth={0.8}
            />
          );
        })}

        {/* Level value labels (2, 4, 6, 8, 10) */}
        {Array.from({ length: levels }, (_, lvl) => {
          const val = ((lvl + 1) / levels) * 10;
          const r = ((lvl + 1) / levels) * maxR;
          const { x, y } = polarToCartesian(cx, cy, r, startAngle);
          return (
            <text
              key={lvl}
              x={x + 8}
              y={y + 4}
              fill="white"
              fillOpacity={0.2}
              fontSize={9}
              fontFamily="monospace"
            >
              {val}
            </text>
          );
        })}

        {/* Previous data polygon */}
        {showPrevious && (
          <polygon
            points={getPolygonPoints(cx, cy, previousValues, 10, maxR, startAngle)}
            fill="url(#radar-prev-fill)"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            strokeOpacity={0.5}
          />
        )}

        {/* Main data polygon with glow */}
        <polygon
          points={getPolygonPoints(cx, cy, animatedValues, 10, maxR, startAngle)}
          fill="url(#radar-fill)"
          stroke="#C1D82F"
          strokeWidth={2.5}
          strokeLinejoin="round"
          filter="url(#radar-glow)"
        />

        {/* Data points with value-based colors */}
        {data.map((d, i) => {
          const angle = startAngle + (2 * Math.PI * i) / n;
          const r = (animatedValues[i] / 10) * maxR;
          const { x, y } = polarToCartesian(cx, cy, r, angle);
          const color = getValueColor(d.value);
          return (
            <g key={i}>
              {/* Outer glow ring */}
              <circle cx={x} cy={y} r={8} fill={color} fillOpacity={0.15} />
              {/* Point */}
              <circle
                cx={x}
                cy={y}
                r={5}
                fill={color}
                stroke="#0d1117"
                strokeWidth={2}
              />
              {/* Value label on point */}
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#0d1117"
                fontSize={7}
                fontWeight={700}
              >
                {d.value.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Dimension labels */}
        {data.map((d, i) => {
          const angle = startAngle + (2 * Math.PI * i) / n;
          const labelR = maxR + 28;
          const { x, y } = polarToCartesian(cx, cy, labelR, angle);
          const color = getValueColor(d.value);
          return (
            <g key={`label-${i}`}>
              <text
                x={x}
                y={y - 6}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fillOpacity={0.8}
                fontSize={12}
                fontWeight={600}
              >
                {d.dimension}
              </text>
              <text
                x={x}
                y={y + 10}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color}
                fontSize={14}
                fontWeight={700}
                fontFamily="monospace"
              >
                {d.value.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      {showPrevious && (
        <div className="flex items-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-[#C1D82F] rounded-full" />
            <span className="text-xs text-white/60">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 bg-white/40 rounded-full" style={{ backgroundImage: "repeating-linear-gradient(90deg, #94a3b8 0, #94a3b8 4px, transparent 4px, transparent 7px)" }} />
            <span className="text-xs text-white/40">Anterior</span>
          </div>
        </div>
      )}
    </div>
  );
}
