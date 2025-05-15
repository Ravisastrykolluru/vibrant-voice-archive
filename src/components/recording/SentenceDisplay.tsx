
import React from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface SentenceDisplayProps {
  currentText: string;
  currentIndex: number;
  totalCount: number;
}

const SentenceDisplay: React.FC<SentenceDisplayProps> = ({
  currentText,
  currentIndex,
  totalCount
}) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200 mb-4 w-full">
      <Label className="block text-sm font-medium text-gray-700 mb-2">
        Sentence {currentIndex + 1} of {totalCount}:
      </Label>
      <p className="text-xl font-medium">{currentText}</p>
    </div>
  );
};

export default SentenceDisplay;
