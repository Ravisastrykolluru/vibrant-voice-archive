
import React from "react";
import Confetti from "./Confetti";
import { Trophy } from "lucide-react";

interface CelebrationCardProps {
  title: string;
  message: string;
  onClose?: () => void;
  children?: React.ReactNode;
}

const CelebrationCard: React.FC<CelebrationCardProps> = ({
  title,
  message,
  onClose,
  children
}) => {
  return (
    <div className="relative bg-white rounded-xl shadow-lg p-8 text-center max-w-md mx-auto overflow-hidden">
      {/* Contained confetti that only shows within card boundaries */}
      <Confetti contained={true} />
      
      <div className="relative z-10">
        <div className="flex justify-center mb-4">
          <Trophy size={64} className="text-yellow-500" />
        </div>
        
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="mb-6">{message}</p>
        
        {children}
      </div>
    </div>
  );
};

export default CelebrationCard;
