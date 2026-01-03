import React, { useState, useEffect } from 'react';

export default function Confetti({ show }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (show) {
      const newPieces = [...Array(50)].map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        animationDelay: Math.random() * 0.5,
        color: ['#FF69B4', '#FFB6C1', '#DDA0DD', '#87CEEB', '#FFD700'][Math.floor(Math.random() * 5)]
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 99999 }}>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-4 h-4"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            backgroundColor: piece.color,
            animation: `confetti 3s ease-out ${piece.animationDelay}s forwards`,
            transform: 'rotate(45deg)',
            boxShadow: '0 0 10px rgba(255, 105, 180, 0.5)'
          }}
        />
      ))}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}