
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
  
  // Use the specified format: recordings/YYYY-MM-DD/gender_language_userID/
  return `recordings/${year}-${month}-${day}/${gender}_${language}_${userId}/`;
};

// Function to create a recording file name
export const createRecordingFilename = (
  gender: string,
  language: string,
  userId: string,
  sentenceIndex: number
): string => {
  // Use the specified format: gender_language_userID_<sentence_index>.wav
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

// Calculate signal-to-noise ratio (SNR) - simulated
export const calculateSNR = async (audioBlob: Blob): Promise<number> => {
  // In a real app, this would analyze the audio to calculate actual SNR
  // For this demo, we'll return a random value between 15 and 35 dB
  return Math.random() * 20 + 15;
};

// Generate waveform data from an audio blob
export const generateWaveformData = async (audioBlob: Blob, numPoints = 50): Promise<number[]> => {
  try {
    // In a production app, we would process the actual audio data
    // For this demo, we'll generate random waveform data
    return Array.from({ length: numPoints }, () => Math.random());
  } catch (error) {
    console.error("Error generating waveform data:", error);
    return Array(numPoints).fill(0);
  }
};

// Visualize waveform data
export const visualizeWaveform = (canvas: HTMLCanvasElement, waveformData: number[]): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Set colors
  ctx.fillStyle = '#3B82F6'; // blue-500
  
  // Calculate bar width
  const barWidth = width / waveformData.length;
  const barPadding = Math.max(1, barWidth * 0.2);
  
  // Draw bars
  waveformData.forEach((amplitude, i) => {
    const x = i * barWidth;
    const barHeight = Math.max(2, amplitude * height * 0.8); // Min height of 2px
    
    ctx.fillRect(
      x + barPadding / 2, 
      (height - barHeight) / 2, 
      barWidth - barPadding, 
      barHeight
    );
  });
};
