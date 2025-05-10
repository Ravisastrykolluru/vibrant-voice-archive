
// Function to create a recording file path
export const createRecordingPath = (
  date: Date,
  gender: string,
  language: string,
  userId: string
): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  return `recordings/${year}-${month}-${day}/${gender}_${language}_${userId}/`;
};

// Function to create a recording file name
export const createRecordingFilename = (
  gender: string,
  language: string,
  userId: string,
  sentenceIndex: number
): string => {
  return `${gender}_${language}_${userId}_${sentenceIndex}.wav`;
};

// Mock function to simulate recording audio (in a real app, this would use the Web Audio API)
export const startRecording = async (): Promise<MediaRecorder | null> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    console.log("Recording started");
    return mediaRecorder;
  } catch (error) {
    console.error("Error accessing microphone:", error);
    return null;
  }
};

// Mock function to stop recording
export const stopRecording = (
  mediaRecorder: MediaRecorder | null,
  onDataAvailable: (blob: Blob) => void
): void => {
  if (!mediaRecorder) return;
  
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      onDataAvailable(event.data);
    }
  };
  
  mediaRecorder.stop();
  console.log("Recording stopped");
};

// Function to play audio from a blob
export const playAudio = (audioBlob: Blob): HTMLAudioElement => {
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
  return audio;
};
