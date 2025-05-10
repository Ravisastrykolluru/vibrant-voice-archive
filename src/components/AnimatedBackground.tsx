
import React, { useEffect, useState } from "react";

interface AnimatedCharacter {
  id: number;
  char: string;
  top: string;
  left: string;
  animationDelay: string;
}

interface ColorSplash {
  id: number;
  top: string;
  left: string;
  size: string;
  color: string;
  animationDelay: string;
}

const AnimatedBackground: React.FC = () => {
  // Focus only on Telugu, Hindi and English language characters
  const languageCharacters = [
    // Hindi characters
    "अ", "आ", "इ", "ई", "उ", "ऊ", "ए", "ऐ", "ओ", "औ", "क", "ख", "ग", "घ", "ङ",
    // Telugu characters
    "అ", "ఆ", "ఇ", "ఈ", "ఉ", "ఊ", "ఎ", "ఏ", "ఐ", "ఒ", "ఓ", "ఔ", "క", "ఖ", "గ",
    // English characters
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"
  ];
  
  // Enhanced color palette for splash effects
  const colorClasses = [
    "bg-purple-500",
    "bg-blue-400",
    "bg-pink-500",
    "bg-orange-500",
    "bg-green-500",
    "bg-red-400",
    "bg-yellow-400",
    "bg-indigo-500"
  ];
  
  const [characters, setCharacters] = useState<AnimatedCharacter[]>([]);
  const [splashes, setSplashes] = useState<ColorSplash[]>([]);
  
  useEffect(() => {
    // Create animated language characters
    const characterCount = 20; // Increased character count
    const newCharacters: AnimatedCharacter[] = [];
    
    for (let i = 0; i < characterCount; i++) {
      newCharacters.push({
        id: i,
        char: languageCharacters[Math.floor(Math.random() * languageCharacters.length)],
        top: `${Math.random() * 90}%`,
        left: `${Math.random() * 95}%`,
        animationDelay: `${Math.random() * 5}s`
      });
    }
    
    setCharacters(newCharacters);
    
    // Create enhanced color splashes - more splashes and larger sizes
    const splashCount = 12; // Increased splash count
    const newSplashes: ColorSplash[] = [];
    
    for (let i = 0; i < splashCount; i++) {
      newSplashes.push({
        id: i,
        top: `${Math.random() * 90}%`,
        left: `${Math.random() * 95}%`,
        size: `${Math.random() * 150 + 100}px`, // Larger splash sizes
        color: colorClasses[Math.floor(Math.random() * colorClasses.length)],
        animationDelay: `${Math.random() * 10}s`
      });
    }
    
    setSplashes(newSplashes);
  }, []);
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Render color splashes first (behind characters) */}
      {splashes.map(splash => (
        <div
          key={splash.id}
          className={`color-splash ${splash.color} opacity-30 rounded-full animate-pulse`}
          style={{
            top: splash.top,
            left: splash.left,
            width: splash.size,
            height: splash.size,
            animationDelay: splash.animationDelay,
            filter: 'blur(40px)',
            transform: 'scale(1)',
            animation: 'pulse 8s infinite',
          }}
        />
      ))}
      
      {/* Render language characters on top */}
      {characters.map(char => (
        <div
          key={char.id}
          className="language-character absolute text-2xl md:text-3xl animate-float"
          style={{
            top: char.top,
            left: char.left,
            animationDelay: char.animationDelay,
            opacity: 0.8,
            textShadow: '0 0 5px rgba(255,255,255,0.8)',
            animation: 'float 15s infinite ease-in-out'
          }}
        >
          {char.char}
        </div>
      ))}
    </div>
  );
};

export default AnimatedBackground;
