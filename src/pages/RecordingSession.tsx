
import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  saveRecordingMetadata,
  saveRecordingBlob,
  fetchUserLanguages,
  fetchSentencesForLanguage,
} from "@/lib/utils/supabase-utils";
import FeedbackForm from "@/components/FeedbackForm";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import AudioWaveform from "@/components/AudioWaveform";

interface Sentence {
  id: number;
  text: string;
  language: string;
}

const RecordingSession = () => {
  const { userId, languageName } = useParams<{ userId: string; languageName: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "recording" | "stopped">("idle");
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(languageName || "");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isLoadingSentences, setIsLoadingSentences] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Fetch languages and validate current language
  useEffect(() => {
    if (!userId) {
      toast({
        title: "User ID is required",
        description: "Please login again.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const getLanguages = async () => {
      setIsLoadingLanguages(true);
      try {
        const userLanguages = await fetchUserLanguages(userId);
        setLanguages(userLanguages);
        if (languageName && !userLanguages.includes(languageName)) {
          toast({
            title: "Language not found",
            description: `The language "${languageName}" is not available for this user.`,
            variant: "destructive",
          });
          navigate(`/record/${userId}/${userLanguages[0] || ""}`);
        }
        setSelectedLanguage(languageName || userLanguages[0] || "");
      } catch (error) {
        console.error("Error fetching languages:", error);
        toast({
          title: "Error fetching languages",
          description: "Could not retrieve available languages. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingLanguages(false);
      }
    };

    getLanguages();
  }, [userId, languageName, navigate, toast]);

  // Fetch sentences for the selected language
  useEffect(() => {
    if (!selectedLanguage) return;

    const loadSentences = async () => {
      setIsLoadingSentences(true);
      try {
        const sentencesData = await fetchSentencesForLanguage(selectedLanguage);
        setSentences(sentencesData);
        // Set the first sentence as the current recorded text
        if (sentencesData.length > 0) {
          setRecordedText(sentencesData[0].text);
        }
      } catch (error) {
        console.error("Error fetching sentences:", error);
        toast({
          title: "Error fetching sentences",
          description: "Could not retrieve sentences for recording. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSentences(false);
      }
    };

    loadSentences();
  }, [selectedLanguage, toast]);

  // Initialize media recorder
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Recording not supported",
        description: "Your browser doesn't support recording. Please try a different browser.",
        variant: "destructive",
      });
      return;
    }

    const initializeRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          setAudioChunks((prev) => [...prev, event.data]);
        };

        recorder.onstop = () => {
          setRecordingStatus("stopped");
        };

        setMediaRecorder(recorder);
      } catch (error) {
        console.error("Error initializing media recorder:", error);
        toast({
          title: "Error initializing recorder",
          description: "Failed to access microphone. Please check your permissions.",
          variant: "destructive",
        });
      }
    };

    initializeRecorder();
  }, [toast]);

  const startRecording = () => {
    if (!mediaRecorder) {
      toast({
        title: "Recorder not initialized",
        description: "Please wait for the recorder to initialize or refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setAudioChunks([]);
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingStatus("recording");
    toast({
      title: "Recording started",
      description: "Speak clearly into the microphone.",
    });
  };

  const stopRecording = async () => {
    if (recordingStatus !== "recording" || !mediaRecorder) {
      return;
    }

    mediaRecorder.stop();
    setIsRecording(false);
    setRecordingStatus("stopped");
    toast({
      title: "Recording stopped",
      description: "Processing your recording...",
    });

    try {
      const sentenceIndex = currentSentenceIndex;
      const sentenceText = sentences[sentenceIndex]?.text || recordedText;
      
      await saveRecordingMetadata(
        userId || "", 
        selectedLanguage || "",
        sentenceIndex,
        `recording_${userId}_${selectedLanguage}_${sentenceIndex}_${Date.now()}.webm`,
        sentenceText
      );
    } catch (error) {
      console.error("Error saving recording metadata:", error);
      toast({
        title: "Error saving metadata",
        description: "Failed to save recording metadata. Please try again.",
        variant: "destructive",
      });
    }
  };

  const playRecording = () => {
    if (audioChunks.length === 0 || !audioRef.current) {
      toast({
        title: "No recording available",
        description: "Please record something first.",
        variant: "destructive",
      });
      return;
    }

    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    setAudioBlob(audioBlob);
    const audioUrl = URL.createObjectURL(audioBlob);
    audioRef.current.src = audioUrl;
    audioRef.current.play();
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    setCurrentSentenceIndex(0);
    navigate(`/record/${userId}/${newLanguage}`);
  };

  const handleSave = async () => {
    if (audioChunks.length === 0) {
      toast({
        title: "No recording available",
        description: "Please record something first.",
        variant: "destructive",
      });
      return;
    }

    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    const filePath = `recordings/${userId}/${selectedLanguage}/${currentSentenceIndex}_${Date.now()}.webm`;

    try {
      await saveRecordingBlob(audioBlob, filePath);
      toast({
        title: "Recording saved",
        description: "Your recording has been successfully saved.",
      });
      
      // Move to the next sentence if available
      if (currentSentenceIndex < sentences.length - 1) {
        setCurrentSentenceIndex(prevIndex => {
          const newIndex = prevIndex + 1;
          setRecordedText(sentences[newIndex].text);
          return newIndex;
        });
        setAudioChunks([]);
        setAudioBlob(null);
        setRecordingStatus("idle");
      } else {
        // If this was the last sentence, show the feedback form
        setShowFeedbackForm(true);
      }
    } catch (error) {
      console.error("Error saving recording:", error);
      toast({
        title: "Error saving recording",
        description: "Failed to save recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreviousSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(prevIndex => {
        const newIndex = prevIndex - 1;
        setRecordedText(sentences[newIndex].text);
        return newIndex;
      });
      setAudioChunks([]);
      setAudioBlob(null);
      setRecordingStatus("idle");
    }
  };

  const handleNextSentence = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(prevIndex => {
        const newIndex = prevIndex + 1;
        setRecordedText(sentences[newIndex].text);
        return newIndex;
      });
      setAudioChunks([]);
      setAudioBlob(null);
      setRecordingStatus("idle");
    }
  };

  const handleFeedbackComplete = () => {
    setShowFeedbackForm(false);
    navigate("/");
  };

  if (isLoadingLanguages) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-lg">Loading languages...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center p-6 relative">
        <div className="w-full max-w-4xl text-center space-y-6 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold animate-fade-in">
            Recording Session
          </h1>

          <div className="flex items-center justify-center space-x-4 animate-fade-in">
            <Label htmlFor="language" className="text-sm font-medium">
              Select Language:
            </Label>
            <select
              id="language"
              className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedLanguage}
              onChange={handleLanguageChange}
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {isLoadingSentences ? (
            <div className="text-center py-8">
              <p className="text-lg">Loading sentences...</p>
            </div>
          ) : sentences.length === 0 ? (
            <div className="text-center py-8">
              <Card className="p-6">
                <p className="text-xl font-medium mb-4">No sentences found</p>
                <p>There are no sentences available for recording in this language.</p>
              </Card>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200 mb-4">
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Sentence {currentSentenceIndex + 1} of {sentences.length}:
                </Label>
                <p className="text-xl font-medium">{recordedText}</p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center pt-4 animate-fade-in">
                <Button
                  onClick={startRecording}
                  disabled={isRecording}
                  className="px-6 py-3"
                >
                  {isRecording ? "Recording..." : "Start Recording"}
                </Button>

                <Button
                  onClick={stopRecording}
                  disabled={!isRecording && recordingStatus !== "recording"}
                  className="px-6 py-3"
                >
                  Stop Recording
                </Button>

                <Button onClick={playRecording} className="px-6 py-3">
                  Play Recording
                </Button>

                <Button onClick={handleSave} className="px-6 py-3">
                  Save Recording
                </Button>
              </div>

              {audioBlob && (
                <div className="w-full mt-4 animate-fade-in">
                  <AudioWaveform audioBlob={audioBlob} playing={false} />
                </div>
              )}
              
              <audio ref={audioRef} controls className="w-full mt-4 animate-fade-in hidden" />

              <div className="flex justify-between mt-6">
                <Button 
                  onClick={handlePreviousSentence} 
                  disabled={currentSentenceIndex === 0}
                  variant="outline"
                >
                  Previous Sentence
                </Button>
                <Button 
                  onClick={handleNextSentence}
                  disabled={currentSentenceIndex === sentences.length - 1}
                  variant="outline"
                >
                  Next Sentence
                </Button>
              </div>

              <div className="w-full animate-fade-in mt-6">
                <Label htmlFor="recordedText" className="block text-left text-sm font-medium">
                  Edit Text (if needed):
                </Label>
                <Textarea
                  id="recordedText"
                  value={recordedText}
                  onChange={(e) => setRecordedText(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </>
          )}
        </div>

        {showFeedbackForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <FeedbackForm userId={userId} onComplete={handleFeedbackComplete} />
          </div>
        )}

        <footer className="absolute bottom-6 text-center w-full opacity-70 z-10">
          <p>© 2025 Speech Processing Lab IIIT Hyderabad. All rights reserved.</p>
        </footer>
      </div>
    </Layout>
  );
};

export default RecordingSession;
