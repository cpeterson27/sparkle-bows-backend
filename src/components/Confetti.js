import React, { useState, useEffect } from "react";

export default function Confetti({ show }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (show) {
      const newPieces = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: ["#FF69B4", "#FFB6C1", "#DDA0DD", "#87CEEB", "#FFD700"][Math.floor(Math.random() * 5)],
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => setPieces([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!pieces.length) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute w-4 h-4"
          style={{
            left: `${p.left}%`,
            top: "-20px",
            backgroundColor: p.color,
            transform: "rotate(45deg)",
            boxShadow: `0 0 10px ${p.color}80`,
            animation: `confetti 3s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}

      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
