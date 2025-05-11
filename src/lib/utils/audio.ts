
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

// Function to start recording using Web Audio API
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

// Function to stop recording
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

// Generate waveform data from audio blob (simplified simulation for demo)
export const generateWaveformData = async (audioBlob: Blob): Promise<number[]> => {
  return new Promise((resolve) => {
    // In a real app, we would analyze the audio data
    // For this demo, we'll generate random waveform data
    setTimeout(() => {
      const waveformPoints = 50;
      const waveformData = Array.from({ length: waveformPoints }, () => 
        Math.random() * 0.8 + 0.2 // Values between 0.2 and 1.0 for visualization
      );
      resolve(waveformData);
    }, 300);
  });
};

// Calculate signal-to-noise ratio (SNR) - simulated
export const calculateSNR = async (audioBlob: Blob): Promise<number> => {
  // In a real app, this would analyze the audio to calculate actual SNR
  // For this demo, we'll return a random value between 15 and 35 dB
  return Math.random() * 20 + 15;
};

// Visualize audio waveform in a canvas element
export const visualizeWaveform = (
  canvasElement: HTMLCanvasElement,
  waveformData: number[],
  color: string = "#4a90e2"
): void => {
  const ctx = canvasElement.getContext("2d");
  if (!ctx) return;

  const { width, height } = canvasElement;
  const barWidth = width / waveformData.length;
  const barSpacing = 1;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw waveform
  ctx.fillStyle = color;
  
  waveformData.forEach((value, index) => {
    const barHeight = value * height * 0.8;
    const x = index * (barWidth + barSpacing);
    const y = (height - barHeight) / 2;
    
    ctx.fillRect(x, y, barWidth, barHeight);
  });
};
