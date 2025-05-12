
import React, { useEffect, useRef, useState } from 'react';

interface Word {
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  opacity: number;
}

const AnimatedWords: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Words to animate
  const wordList = [
    "Speech", "Recording", "System", "English", "Hindi", "Telugu",
    "Tamil", "Kannada", "Malayalam", "Bengali", "Marathi", "Voice",
    "Audio", "Language", "Speak", "Record", "Listen", "Quality",
    "Clarity", "Accent", "Pronunciation", "Fluency", "Collection",
    "Data", "Sound", "Communication"
  ];
  
  const colors = [
    '#3B82F6', // blue-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#F43F5E', // rose-500
    '#10B981', // emerald-500
    '#6366F1', // indigo-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
  ];

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const width = canvasRef.current.parentElement.clientWidth;
        const height = canvasRef.current.parentElement.clientHeight;
        
        setDimensions({ width, height });
        
        // Set canvas dimensions
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };

    // Initialize
    updateDimensions();
    
    // Create words
    const initialWords: Word[] = [];
    for (let i = 0; i < 40; i++) {
      const text = wordList[Math.floor(Math.random() * wordList.length)];
      const size = Math.floor(Math.random() * 16) + 12; // Font size between 12 and 28
      
      initialWords.push({
        text,
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.5, // Slow horizontal movement
        vy: (Math.random() - 0.5) * 0.5, // Slow vertical movement
        opacity: Math.random() * 0.5 + 0.3, // Opacity between 0.3 and 0.8
      });
    }
    setWords(initialWords);
    
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || words.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    
    const render = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      const updatedWords = words.map(word => {
        // Move the word
        let x = word.x + word.vx;
        let y = word.y + word.vy;
        
        // Bounce off edges with a small buffer
        const buffer = 100; // Buffer to ensure words don't go too far offscreen
        
        if (x < -buffer) x = dimensions.width + buffer;
        if (x > dimensions.width + buffer) x = -buffer;
        if (y < -buffer) y = dimensions.height + buffer;
        if (y > dimensions.height + buffer) y = -buffer;
        
        // Draw the word
        ctx.font = `${word.size}px 'Inter', sans-serif`;
        ctx.fillStyle = word.color;
        ctx.globalAlpha = word.opacity;
        ctx.fillText(word.text, x, y);
        
        return { ...word, x, y };
      });
      
      setWords(updatedWords);
      animationFrameId = window.requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [words, dimensions]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 w-full h-full" 
    />
  );
};

export default AnimatedWords;
