import React from 'react';
import { Sparkles } from 'lucide-react';

export default function SparkleBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`
          }}
        >
          <Sparkles className="text-pink-300 w-4 h-4 opacity-60" />
        </div>
      ))}
    </div>
  );
}