
import React, { useEffect, useRef, useState } from "react";
import { generateWaveformData, visualizeWaveform } from "@/lib/utils/audio";

interface AudioWaveformProps {
  audioBlob?: Blob | null;
  playing?: boolean;
  color?: string;
  height?: number;
  className?: string;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioBlob,
  playing = false,
  color = "#4a90e2",
  height = 80,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const requestRef = useRef<number>();
  const animationOffset = useRef(0);
  
  // Generate waveform data when audioBlob changes
  useEffect(() => {
    if (!audioBlob) {
      // If no audio blob, generate empty waveform
      setWaveformData(Array(50).fill(0.05));
      return;
    }
    
    // Generate waveform data from audio blob
    const generateData = async () => {
      const data = await generateWaveformData(audioBlob);
      setWaveformData(data);
    };
    
    generateData();
  }, [audioBlob]);
  
  // Draw waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;
    
    if (!playing) {
      // Static waveform
      visualizeWaveform(canvasRef.current, waveformData);
    } else {
      // Animated waveform
      const animate = () => {
        if (!canvasRef.current) return;
        
        // Create animated waveform by shifting the data
        const animatedData = [...waveformData];
        for (let i = 0; i < animatedData.length; i++) {
          const originalValue = animatedData[i];
          // Add a sine wave animation to make it look like it's playing
          animatedData[i] = originalValue * (0.8 + 0.2 * Math.sin(i * 0.2 + animationOffset.current));
        }
        
        visualizeWaveform(canvasRef.current, animatedData);
        animationOffset.current += 0.2;
        requestRef.current = requestAnimationFrame(animate);
      };
      
      requestRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [waveformData, playing, color]);
  
  // Initialize with silent waveform if no blob
  useEffect(() => {
    if (!audioBlob && canvasRef.current) {
      const silentWaveform = Array(50).fill(0.05);
      visualizeWaveform(canvasRef.current, silentWaveform);
    }
  }, [audioBlob, color]);
  
  return (
    <div className={`w-full rounded-md overflow-hidden bg-gray-100 ${className}`}>
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={height}
        className="w-full h-auto"
      />
    </div>
  );
};

export default AudioWaveform;
