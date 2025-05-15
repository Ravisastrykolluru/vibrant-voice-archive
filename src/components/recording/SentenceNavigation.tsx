
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface SentenceNavigationProps {
  currentIndex: number;
  totalCount: number;
  onPrevious: () => void;
  onNext: () => void;
}

const SentenceNavigation: React.FC<SentenceNavigationProps> = ({
  currentIndex,
  totalCount,
  onPrevious,
  onNext
}) => {
  return (
    <div className="flex justify-between w-full mt-6">
      <Button 
        onClick={onPrevious} 
        disabled={currentIndex === 0}
        variant="outline"
        className="flex items-center"
      >
        <ArrowLeft className="mr-2" size={16} /> Previous Sentence
      </Button>
      
      <Button 
        onClick={onNext}
        disabled={currentIndex === totalCount - 1}
        variant="outline"
        className="flex items-center"
      >
        Next Sentence <ArrowRight className="ml-2" size={16} />
      </Button>
    </div>
  );
};

export default SentenceNavigation;
