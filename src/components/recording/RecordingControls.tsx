
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Save } from "lucide-react";

interface RecordingControlsProps {
  isRecording: boolean;
  recordingStatus: "idle" | "recording" | "stopped";
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayRecording: () => void;
  onSaveRecording: () => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  recordingStatus,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  onSaveRecording
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 justify-center w-full">
      <Button
        onClick={onStartRecording}
        disabled={isRecording}
        className="bg-black text-white hover:bg-gray-800 px-6 py-3 flex items-center justify-center"
      >
        <Mic className="mr-2" /> {isRecording ? "Recording..." : "Start Recording"}
      </Button>

      <Button
        onClick={onStopRecording}
        disabled={!isRecording && recordingStatus !== "recording"}
        className="bg-black text-white hover:bg-gray-800 px-6 py-3 flex items-center justify-center"
      >
        <Square className="mr-2" /> Stop Recording
      </Button>

      <Button 
        onClick={onPlayRecording} 
        className="bg-black text-white hover:bg-gray-800 px-6 py-3 flex items-center justify-center"
        disabled={recordingStatus === "recording"}
      >
        <Play className="mr-2" /> Play Recording
      </Button>

      <Button 
        onClick={onSaveRecording} 
        className="bg-black text-white hover:bg-gray-800 px-6 py-3 flex items-center justify-center"
        disabled={recordingStatus === "recording" || recordingStatus === "idle"}
      >
        <Save className="mr-2" /> Save Recording
      </Button>
    </div>
  );
};

export default RecordingControls;
