import React, { useMemo } from "react";
import { Sparkles } from "lucide-react";

export default function SparkleBackground() {
  const sparkles = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 3,
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-1 overflow-hidden">
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="absolute animate-pulse"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        >
          <Sparkles className="w-4 h-4 text-pink-300 opacity-60" />
        </div>
      ))}
    </div>
  );
}
