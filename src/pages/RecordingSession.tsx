import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mic, Square, Play, Save, ArrowLeftCircle, ArrowRightCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { findUserById, getLanguages, saveRecordingMetadata, saveRecordingBlob } from "@/lib/utils/storage";
import { createRecordingPath, createRecordingFilename, startRecording, stopRecording, playAudio } from "@/lib/utils/audio";

const RecordingSession: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userId, languageName } = useParams<{ userId: string; languageName: string }>();
  
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [user, setUser] = useState<any>(null);
  const [language, setLanguage] = useState<any>(null);
  const [savedRecordings, setSavedRecordings] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  useEffect(() => {
    // Load user and language data
    if (!userId || !languageName) {
      toast({
        title: "Invalid session",
        description: "Missing user ID or language",
        variant: "destructive"
      });
      navigate("/");
      return;
    }
    
    const userData = findUserById(userId);
    if (!userData) {
      toast({
        title: "User not found",
        description: "Please register first",
        variant: "destructive"
      });
      navigate("/register");
      return;
    }
    
    setUser(userData);
    
    const languages = getLanguages();
    const languageData = languages.find(lang => lang.name === languageName);
    if (!languageData) {
      toast({
        title: "Language not found",
        description: "Please select a valid language",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }
    
    setLanguage(languageData);
    
    // Check if user has permission to record
    navigator.mediaDevices.getUserMedia({ audio: true })
      .catch(error => {
        toast({
          title: "Microphone access denied",
          description: "Please allow access to your microphone to record",
          variant: "destructive"
        });
      });
      
  }, [userId, languageName, navigate, toast]);
  
  const handleStartRecording = async () => {
    if (isRecording) return;
    
    const recorder = await startRecording();
    if (recorder) {
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone"
      });
    } else {
      toast({
        title: "Failed to start recording",
        description: "Please check your microphone access",
        variant: "destructive"
      });
    }
  };
  
  const handleStopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    
    stopRecording(mediaRecorderRef.current, (blob) => {
      setRecordingBlob(blob);
    });
    
    setIsRecording(false);
    toast({ title: "Recording stopped" });
  };
  
  const handlePlayRecording = () => {
    if (!recordingBlob) return;
    
    playAudio(recordingBlob);
    toast({ title: "Playing recording" });
  };
  
  const handleSaveRecording = async () => {
    if (!recordingBlob || !user || !language) return;
    
    setIsSaving(true);
    
    try {
      // Create file path and name
      const date = new Date();
      const filePath = createRecordingPath(date, user.gender, language.name, userId!);
      const fileName = createRecordingFilename(user.gender, language.name, userId!, currentSentenceIndex);
      const fullPath = filePath + fileName;
      
      // Save the recording blob
      await saveRecordingBlob(recordingBlob, fullPath);
      
      // Save metadata
      saveRecordingMetadata({
        userId: userId!,
        language: language.name,
        sentenceIndex: currentSentenceIndex,
        sentenceText: language.sentences[currentSentenceIndex],
        recordingDate: date.toISOString(),
        filePath: fullPath
      });
      
      // Mark as saved
      setSavedRecordings(prev => [...prev, currentSentenceIndex]);
      
      toast({
        title: "Recording saved",
        description: "You can now move to the next sentence"
      });
    } catch (error) {
      toast({
        title: "Failed to save recording",
        description: "An error occurred while saving",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePreviousSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(prev => prev - 1);
      setRecordingBlob(null);
    }
  };
  
  const handleNextSentence = () => {
    if (!language) return;
    
    // Check if current sentence is saved before proceeding
    if (!savedRecordings.includes(currentSentenceIndex)) {
      toast({
        title: "Save required",
        description: "Please save your recording before moving to the next sentence",
        variant: "destructive"
      });
      return;
    }
    
    // Move to next sentence if available
    if (currentSentenceIndex < language.sentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
      setRecordingBlob(null);
    } else {
      toast({
        title: "End of sentences",
        description: "You have reached the end of the available sentences"
      });
    }
  };
  
  const handleExitSession = () => {
    // Check if there are unsaved changes
    if (recordingBlob && !savedRecordings.includes(currentSentenceIndex)) {
      if (!window.confirm("You have unsaved recordings. Are you sure you want to exit?")) {
        return;
      }
    }
    
    navigate("/");
    toast({
      title: "Session ended",
      description: "Thank you for your contributions!"
    });
  };
  
  if (!user || !language) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="p-6">
            <p>Loading session data...</p>
          </Card>
        </div>
      </Layout>
    );
  }

  // Calculate statistics
  const totalSentences = language.sentences.length;
  const completedSentences = savedRecordings.length;
  const remainingSentences = totalSentences - completedSentences;
  
  return (
    <Layout showBackground={false}>
      <div className="min-h-screen flex flex-col">
        <header className="bg-white shadow py-4 px-6">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2" 
                onClick={() => navigate("/")}
              >
                <ArrowLeft size={20} />
              </Button>
              <h1 className="text-xl font-semibold">Recording Session</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-500">ID: {userId}</p>
              </div>
              <Button variant="outline" onClick={handleExitSession}>
                Exit Session
              </Button>
            </div>
          </div>
        </header>
        
        <div className="flex-1 p-4 md:p-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Sentence Display */}
                <div className="flex-1">
                  <h2 className="text-lg font-medium mb-2">Sentence to Record:</h2>
                  <div className="bg-gray-50 rounded-lg p-6 min-h-[200px] flex items-center justify-center text-center text-xl">
                    {language.sentences[currentSentenceIndex]}
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousSentence}
                      disabled={currentSentenceIndex === 0}
                      className="flex items-center"
                    >
                      <ArrowLeftCircle size={18} className="mr-1" /> Previous
                    </Button>
                    
                    <div className="text-sm text-gray-500">
                      Sentence {currentSentenceIndex + 1} of {language.sentences.length}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleNextSentence}
                      disabled={
                        currentSentenceIndex === language.sentences.length - 1 ||
                        !savedRecordings.includes(currentSentenceIndex)
                      }
                      className="flex items-center"
                    >
                      Next <ArrowRightCircle size={18} className="ml-1" />
                    </Button>
                  </div>
                </div>
                
                {/* Recording Controls */}
                <div className="md:w-64 space-y-6 flex flex-col items-center">
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-medium mb-2">Recording Controls</h2>
                    <p className="text-sm text-gray-500">
                      {isRecording ? "Recording in progress..." : recordingBlob ? "Recording complete" : "Ready to record"}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4">
                    {!isRecording && !recordingBlob && (
                      <Button 
                        className="record-button bg-black text-white h-16 w-16 rounded-full"
                        onClick={handleStartRecording}
                      >
                        <Mic size={24} />
                      </Button>
                    )}
                    
                    {isRecording && (
                      <Button 
                        className="record-button bg-red-500 text-white h-16 w-16 rounded-full"
                        onClick={handleStopRecording}
                      >
                        <Square size={24} />
                      </Button>
                    )}
                    
                    {recordingBlob && !isRecording && (
                      <>
                        <Button 
                          className="record-button bg-black text-white"
                          onClick={handlePlayRecording}
                        >
                          <Play size={24} />
                        </Button>
                        
                        <Button 
                          className="record-button bg-black text-white"
                          onClick={handleStartRecording}
                        >
                          <Mic size={24} />
                        </Button>
                        
                        <Button 
                          className="record-button bg-green-600 text-white"
                          onClick={handleSaveRecording}
                          disabled={isSaving || savedRecordings.includes(currentSentenceIndex)}
                        >
                          <Save size={24} />
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <div className="w-full mt-4">
                    {savedRecordings.includes(currentSentenceIndex) ? (
                      <p className="text-center text-green-600 text-sm">
                        ✓ This sentence has been saved
                      </p>
                    ) : recordingBlob ? (
                      <p className="text-center text-yellow-600 text-sm">
                        Don't forget to save your recording
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Statistics Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-medium mb-4">Session Statistics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="info-card">
                  <p className="text-gray-500">Total Sentences</p>
                  <p className="text-2xl font-bold">{totalSentences}</p>
                </div>
                
                <div className="info-card">
                  <p className="text-gray-500">Recorded</p>
                  <p className="text-2xl font-bold text-green-600">{completedSentences}</p>
                </div>
                
                <div className="info-card">
                  <p className="text-gray-500">Remaining</p>
                  <p className="text-2xl font-bold text-blue-600">{remainingSentences}</p>
                </div>
                
                <div className="info-card">
                  <p className="text-gray-500">Progress</p>
                  <Progress value={(completedSentences / totalSentences) * 100} className="mt-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RecordingSession;
