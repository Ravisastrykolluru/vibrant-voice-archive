
import React, { useEffect, useState } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  opacity: number;
}

interface ConfettiProps {
  contained?: boolean; // If true, confetti will be contained within parent element
}

const Confetti: React.FC<ConfettiProps> = ({ contained = false }) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const COLORS = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ff8800", "#8800ff"];
  
  useEffect(() => {
    // Generate random confetti pieces - more pieces for a better celebration effect
    const newPieces = Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20, // Start above the screen
      size: Math.random() * 10 + 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 360,
      opacity: 1
    }));
    
    setPieces(newPieces);
    
    // Animate the confetti falling with improved dynamics
    let frame = 0;
    const animateConfetti = () => {
      setPieces(prevPieces => 
        prevPieces.map(piece => ({
          ...piece,
          y: piece.y + (1.5 + Math.random()), // Increased fall speed for better effect
          x: piece.x + Math.sin(frame / 10 + piece.id) * 0.7, // Enhanced swaying
          rotation: piece.rotation + Math.random() * 3, // More rotation
          opacity: piece.y > 90 ? (100 - piece.y) / 10 : 1 // Fade out near bottom
        })).filter(piece => piece.y < 105 && piece.opacity > 0) // Remove pieces that are off-screen
      );
      
      frame++;
      
      if (frame < 200) { // Longer animation duration
        requestAnimationFrame(animateConfetti);
      }
    };
    
    const animation = requestAnimationFrame(animateConfetti);
    
    return () => cancelAnimationFrame(animation);
  }, []);
  
  return (
    <div className={contained ? "absolute inset-0 pointer-events-none overflow-hidden" : "fixed inset-0 pointer-events-none overflow-hidden z-50"}>
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            opacity: piece.opacity,
            transition: 'opacity 0.3s',
            borderRadius: Math.random() > 0.5 ? '50%' : '0' // Mix of circular and square confetti
          }}
        ></div>
      ))}
    </div>
  );
};

export default Confetti;
