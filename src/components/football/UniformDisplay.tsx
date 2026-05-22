"use client";

import { Card } from "@/components/ui/card";

interface UniformProps {
  primaryColor: string | null;
  secondaryColor: string | null;
  description: string | null;
  imageUrl: string | null;
  label: string;
}

function JerseySvg({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <svg viewBox="0 0 120 140" className="w-full h-auto max-w-[100px]" aria-hidden="true">
      {/* Jersey body */}
      <path
        d="M30 35 L15 50 L15 70 L25 65 L25 130 L95 130 L95 65 L105 70 L105 50 L90 35 L75 25 L70 30 C65 35 55 35 50 30 L45 25 Z"
        fill={primary}
        stroke={secondary}
        strokeWidth="2"
      />
      {/* Collar */}
      <path
        d="M45 25 L50 30 C55 35 65 35 70 30 L75 25"
        fill="none"
        stroke={secondary}
        strokeWidth="2.5"
      />
      {/* Sleeve stripes */}
      <line x1="20" y1="55" x2="25" y2="52" stroke={secondary} strokeWidth="2" />
      <line x1="100" y1="55" x2="95" y2="52" stroke={secondary} strokeWidth="2" />
      {/* Bottom stripe */}
      <rect x="25" y="122" width="70" height="8" rx="1" fill={secondary} opacity="0.6" />
    </svg>
  );
}

function UniformCard({ primaryColor, secondaryColor, description, imageUrl, label }: UniformProps) {
  const primary = primaryColor || "#cccccc";
  const secondary = secondaryColor || "#999999";

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Uniforme ${label}`}
            className="w-24 h-auto rounded-md object-contain"
          />
        ) : (
          <JerseySvg primary={primary} secondary={secondary} />
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="inline-block size-5 rounded-full border border-border shadow-sm"
          style={{ backgroundColor: primary }}
          title={`Primario: ${primary}`}
        />
        <span
          className="inline-block size-5 rounded-full border border-border shadow-sm"
          style={{ backgroundColor: secondary }}
          title={`Secundario: ${secondary}`}
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground text-center max-w-[140px]">{description}</p>
      )}
    </div>
  );
}

export interface UniformDisplayProps {
  homeUniformPrimary: string | null;
  homeUniformSecondary: string | null;
  homeUniformDescription: string | null;
  homeUniformImageUrl: string | null;
  awayUniformPrimary: string | null;
  awayUniformSecondary: string | null;
  awayUniformDescription: string | null;
  awayUniformImageUrl: string | null;
}

export default function UniformDisplay(props: UniformDisplayProps) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-4 text-center">Uniformes</h3>
      <div className="flex justify-center gap-8">
        <UniformCard
          label="Local"
          primaryColor={props.homeUniformPrimary}
          secondaryColor={props.homeUniformSecondary}
          description={props.homeUniformDescription}
          imageUrl={props.homeUniformImageUrl}
        />
        <div className="w-px bg-border" />
        <UniformCard
          label="Visitante"
          primaryColor={props.awayUniformPrimary}
          secondaryColor={props.awayUniformSecondary}
          description={props.awayUniformDescription}
          imageUrl={props.awayUniformImageUrl}
        />
      </div>
    </Card>
  );
}
