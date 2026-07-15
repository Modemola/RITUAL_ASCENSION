"use client";

import { GraduationCap, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import type { MascotId } from "@/lib/data";
import { mascots } from "@/lib/data";

const MASCOT_ICONS: Record<MascotId, typeof Sparkles> = {
  siggy: GraduationCap,
  ploplo: Sparkles,
  initiate: Target
};

// The source portraits are full scenes, not clean cutouts — these tune the
// crop so each mascot's face fills the circular badge instead of the backdrop.
const MASCOT_CROP: Record<MascotId, { position: string; scale: number }> = {
  siggy: { position: "49% 34%", scale: 1.7 },
  ploplo: { position: "51% 28%", scale: 1.3 },
  initiate: { position: "56% 28%", scale: 1.6 }
};

const SIZE_CLASSES = {
  sm: "size-7",
  md: "size-11",
  lg: "size-16",
  xl: "size-28"
} as const;

export function MascotAvatar({
  mascotId,
  size = "md",
  className = ""
}: {
  mascotId: MascotId;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const mascot = mascots.find((m) => m.id === mascotId);
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = MASCOT_ICONS[mascotId];

  if (!mascot) return null;

  return (
    <span
      className={`relative grid ${SIZE_CLASSES[size]} shrink-0 place-items-center overflow-hidden rounded-full border ${className}`}
      style={{
        borderColor: `${mascot.accentColor}55`,
        background: `linear-gradient(135deg, ${mascot.accentColor}33, ${mascot.accentColor}0d)`,
        boxShadow: `0 0 18px ${mascot.accentColor}2e`
      }}
    >
      {!imageFailed ? (
        <img
          src={`/mascots/${mascot.id}.png`}
          alt={mascot.name}
          className="h-full w-full object-cover"
          style={{
            objectPosition: MASCOT_CROP[mascotId].position,
            transform: `scale(${MASCOT_CROP[mascotId].scale})`,
            transformOrigin: MASCOT_CROP[mascotId].position
          }}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Icon className="size-1/2" style={{ color: mascot.accentColor }} />
      )}
    </span>
  );
}
