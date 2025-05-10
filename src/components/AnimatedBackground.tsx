
import React, { useEffect, useState } from "react";

const languageCharacters = [
  "あ", "ん", "क", "ण", "字", "王", "ñ", "ą", 
  "ß", "ç", "é", "ж", "ш", "ث", "ر", "अ", 
  "न", "म", "ह", "ᚠ", "ᛒ", "ᚢ", "א", "ב"
];

const colorClasses = [
  "bg-holi-purple",
  "bg-holi-blue",
  "bg-holi-pink",
  "bg-holi-orange",
  "bg-holi-green"
];

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
  const [characters, setCharacters] = useState<AnimatedCharacter[]>([]);
  const [splashes, setSplashes] = useState<ColorSplash[]>([]);
  
  useEffect(() => {
    // Create animated language characters
    const characterCount = 12;
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
    
    // Create color splashes
    const splashCount = 8;
    const newSplashes: ColorSplash[] = [];
    
    for (let i = 0; i < splashCount; i++) {
      newSplashes.push({
        id: i,
        top: `${Math.random() * 90}%`,
        left: `${Math.random() * 95}%`,
        size: `${Math.random() * 100 + 50}px`,
        color: colorClasses[Math.floor(Math.random() * colorClasses.length)],
        animationDelay: `${Math.random() * 8}s`
      });
    }
    
    setSplashes(newSplashes);
  }, []);
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {characters.map(char => (
        <div
          key={char.id}
          className="language-character"
          style={{
            top: char.top,
            left: char.left,
            animationDelay: char.animationDelay
          }}
        >
          {char.char}
        </div>
      ))}
      
      {splashes.map(splash => (
        <div
          key={splash.id}
          className={`color-splash ${splash.color}`}
          style={{
            top: splash.top,
            left: splash.left,
            width: splash.size,
            height: splash.size,
            animationDelay: splash.animationDelay
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
