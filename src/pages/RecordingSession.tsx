import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mic, Square, Play, Save, ArrowLeftCircle, ArrowRightCircle, Trophy, AlertCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import CelebrationCard from "@/components/CelebrationCard";
import FeedbackForm from "@/components/FeedbackForm";
import {
  getUserRecordings,
  getLanguages,
  saveRecordingMetadata,
  saveRecordingBlob,
  getRerecordingCount,
  getUserLanguage
} from "@/lib/utils/supabase-utils";
import { 
  startRecording, 
  stopRecording, 
  playAudio, 
  calculateSNR 
} from "@/lib/utils/audio";

const RecordingSession: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userId, languageName } = useParams<{ userId: string; languageName: string }>();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'rerecording' ? 'rerecording' : 'regular';
  
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [user, setUser] = useState<any>(null);
  const [language, setLanguage] = useState<any>(null);
  const [savedRecordings, setSavedRecordings] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [rerecordingSentences, setRerecordingSentences] = useState<number[]>([]);
  const [showThankYouDialog, setShowThankYouDialog] = useState(false);
  const [recordingMode, setRecordingMode] = useState<'regular' | 'rerecording'>(initialMode);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
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
    
    const loadData = async () => {
      try {
        // Get language data
        const languages = await getLanguages();
        const languageData = languages.find((lang: any) => lang.name === languageName);
        
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
        
        // Load existing recordings for this user/language
        const userRecordings = await getUserRecordings(userId);
        const languageRecordings = userRecordings.filter(rec => rec.language === languageName);
        
        // Get the indices of saved recordings
        const savedIndices = languageRecordings.map(rec => rec.sentence_index);
        setSavedRecordings(savedIndices);
        
        // Set re-recording sentences - sentences flagged by admin for re-recording
        const rerecordingIndices = languageRecordings
          .filter(rec => rec.needs_rerecording)
          .map(rec => rec.sentence_index);
        setRerecordingSentences(rerecordingIndices);
        
        // Determine recording mode
        const allSentencesRecorded = languageData.sentences.every((_: any, index: number) => savedIndices.includes(index));
        
        if (recordingMode === 'rerecording' && rerecordingIndices.length > 0) {
          // If in re-recording mode, start with the first sentence that needs re-recording
          setCurrentSentenceIndex(rerecordingIndices[0]);
        } else if (allSentencesRecorded && rerecordingIndices.length > 0) {
          // If all regular sentences done but there are re-recordings, go to re-recording mode
          setRecordingMode('rerecording');
          setCurrentSentenceIndex(rerecordingIndices[0]);
        } else if (allSentencesRecorded && rerecordingIndices.length === 0) {
          // If everything is done, show thank you dialog
          setShowThankYouDialog(true);
        } else {
          // Otherwise set the starting index - start from where user left off
          setRecordingMode('regular');
          
          if (savedIndices.length > 0) {
            // Find the first unrecorded sentence
            let nextIndex = 0;
            while (savedIndices.includes(nextIndex)) {
              nextIndex++;
            }
            
            // Set to the first unrecorded sentence
            if (nextIndex < languageData.sentences.length) {
              setCurrentSentenceIndex(nextIndex);
            }
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error loading session data",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    };
    
    loadData();
    
    // Check if user has permission to record
    navigator.mediaDevices.getUserMedia({ audio: true })
      .catch(error => {
        toast({
          title: "Microphone access denied",
          description: "Please allow access to your microphone to record",
          variant: "destructive"
        });
      });
      
  }, [userId, languageName, navigate, toast, initialMode, recordingMode]);
  
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
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setIsPlaying(true);
    
    const audio = playAudio(recordingBlob);
    audioRef.current = audio;
    
    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };
    
    toast({ title: "Playing recording" });
  };
  
  const handleSaveRecording = async () => {
    if (!recordingBlob || !language) return;
    
    setIsSaving(true);
    
    try {
      // Calculate SNR value for quality assessment
      const snr = await calculateSNR(recordingBlob);
      
      // Save the recording to Supabase Storage
      const filePath = await saveRecordingBlob(
        recordingBlob, 
        userId!, 
        language.name, 
        currentSentenceIndex
      );
      
      // Save metadata
      await saveRecordingMetadata({
        userId: userId!,
        language: language.name,
        sentenceIndex: currentSentenceIndex,
        sentenceText: language.sentences[currentSentenceIndex],
        filePath: filePath,
        snr: snr
      });
      
      // Mark as saved and remove from re-recording list if it was there
      setSavedRecordings(prev => {
        // Filter out current sentence if it exists, then add it back
        const filteredList = prev.filter(idx => idx !== currentSentenceIndex);
        return [...filteredList, currentSentenceIndex];
      });
      
      // Remove from re-recordings list
      setRerecordingSentences(prev => prev.filter(idx => idx !== currentSentenceIndex));
      
      toast({
        title: "Recording saved",
        description: "Successfully saved to Supabase"
      });

      // Check if all sentences are recorded
      checkSessionCompletion();
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Failed to save recording",
        description: "An error occurred while saving",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const checkSessionCompletion = () => {
    if (!language) return;

    // Check if all regular sentences are recorded
    const allSentencesRecorded = language.sentences.every((_: any, index: number) => 
      savedRecordings.includes(index)
    );
    
    // Check if all re-recordings are done
    const allRerecordingsDone = rerecordingSentences.every(index => 
      !savedRecordings.includes(index) || // Not requiring re-recording anymore
      (savedRecordings.includes(index))   // Or has been re-recorded
    );
    
    if (allSentencesRecorded && rerecordingSentences.length === 0) {
      // If all sentences recorded and no re-recordings needed, show celebration
      setShowCompletionDialog(true);
    } else if (allSentencesRecorded && !allRerecordingsDone && recordingMode === 'regular') {
      // Switch to re-recording mode
      setRecordingMode('rerecording');
      // Find next sentence that needs re-recording
      const nextRerecording = rerecordingSentences.find(idx => true);
      if (nextRerecording !== undefined) {
        setCurrentSentenceIndex(nextRerecording);
        setRecordingBlob(null);
        
        toast({
          title: "Switching to Re-recording Mode",
          description: "You have some sentences that need to be re-recorded"
        });
      }
    }
  };
  
  const handlePreviousSentence = () => {
    if (recordingMode === 'regular') {
      // In regular mode, just go to the previous index
      if (currentSentenceIndex > 0) {
        setCurrentSentenceIndex(prev => prev - 1);
        setRecordingBlob(null);
      }
    } else {
      // In re-recording mode, go to previous re-recording sentence
      const currentRerecordingIndex = rerecordingSentences.indexOf(currentSentenceIndex);
      if (currentRerecordingIndex > 0) {
        setCurrentSentenceIndex(rerecordingSentences[currentRerecordingIndex - 1]);
        setRecordingBlob(null);
      }
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
    
    if (recordingMode === 'regular') {
      // Regular recording mode - move to next unrecorded sentence
      let nextIndex = currentSentenceIndex + 1;
      
      // Skip already recorded sentences
      while (nextIndex < language.sentences.length && savedRecordings.includes(nextIndex)) {
        nextIndex++;
      }
      
      if (nextIndex < language.sentences.length) {
        // Go to next unrecorded sentence
        setCurrentSentenceIndex(nextIndex);
        setRecordingBlob(null);
      } else {
        // If we're at the end of regular sentences, check if there are re-recordings to do
        checkSessionCompletion();
      }
    } else {
      // Re-recording mode - go to next sentence that needs re-recording
      const currentRerecordingIndex = rerecordingSentences.indexOf(currentSentenceIndex);
      
      // If there are more re-recordings to do
      if (currentRerecordingIndex < rerecordingSentences.length - 1) {
        setCurrentSentenceIndex(rerecordingSentences[currentRerecordingIndex + 1]);
        setRecordingBlob(null);
      } else {
        // No more re-recordings, we're done!
        checkSessionCompletion();
      }
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

  const handleFeedbackComplete = () => {
    setShowFeedbackForm(false);
    navigate("/");
  };
  
  if (!language) {
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
  const completedSentences = savedRecordings.filter(idx => idx < totalSentences).length;
  const remainingSentences = totalSentences - completedSentences;
  const rerecordingsRemaining = rerecordingSentences.filter(idx => !savedRecordings.includes(idx)).length;
  
  return (
    <Layout showBackground={false}>
      <div className="min-h-screen flex flex-col">
        {/* Celebration dialog */}
        <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
          <DialogContent className="sm:max-w-md">
            <CelebrationCard
              title={`Thank you, ${user?.name || ""}!`}
              message="You've completed all recordings! Thank you for helping us build a better speech system."
            >
              <Button onClick={() => {
                setShowCompletionDialog(false);
                setShowFeedbackForm(true);
              }} className="mt-4">
                Continue
              </Button>
            </CelebrationCard>
          </DialogContent>
        </Dialog>

        {/* Feedback form dialog */}
        <Dialog open={showFeedbackForm} onOpenChange={setShowFeedbackForm}>
          <DialogContent className="sm:max-w-md">
            <FeedbackForm 
              userId={userId || ""} 
              onComplete={handleFeedbackComplete} 
            />
          </DialogContent>
        </Dialog>
        
        {/* Thank you dialog for already completed recordings */}
        <Dialog open={showThankYouDialog} onOpenChange={setShowThankYouDialog}>
          <DialogContent className="sm:max-w-md">
            <CelebrationCard
              title={`Thank you, ${user?.name || ""}!`}
              message={`You've already completed all recordings for ${language.name}!`}
            >
              <Button onClick={() => {
                setShowThankYouDialog(false);
                navigate('/');
              }} className="mt-4">
                Return to Home
              </Button>
            </CelebrationCard>
          </DialogContent>
        </Dialog>

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
              {recordingMode === 'rerecording' && (
                <span className="ml-2 bg-red-100 text-red-800 px-2 py-0.5 rounded text-sm">
                  Re-recording Mode
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-gray-500">Language: {language.name}</p>
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
                  <h2 className="text-lg font-medium mb-2">
                    Sentence to Record:
                    {rerecordingSentences.includes(currentSentenceIndex) && (
                      <span className="ml-2 text-red-500 text-sm flex items-center">
                        <AlertCircle size={16} className="mr-1" />
                        (Needs re-recording)
                      </span>
                    )}
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-6 min-h-[200px] flex items-center justify-center text-center text-xl">
                    {language.sentences[currentSentenceIndex]}
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousSentence}
                      disabled={
                        (recordingMode === 'regular' && currentSentenceIndex === 0) ||
                        (recordingMode === 'rerecording' && rerecordingSentences.indexOf(currentSentenceIndex) === 0)
                      }
                      className="flex items-center"
                    >
                      <ArrowLeftCircle size={18} className="mr-1" /> Previous
                    </Button>
                    
                    <div className="text-sm text-gray-500">
                      {recordingMode === 'regular' ? (
                        <span>Sentence {currentSentenceIndex + 1} of {language.sentences.length}</span>
                      ) : (
                        <span>
                          Re-recording {rerecordingSentences.indexOf(currentSentenceIndex) + 1} of {rerecordingSentences.length}
                          {' '}(Sentence #{currentSentenceIndex + 1})
                        </span>
                      )}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleNextSentence}
                      disabled={!savedRecordings.includes(currentSentenceIndex)}
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
                      <div className="text-center">
                        <Button 
                          className="record-button bg-black text-white h-16 w-16 rounded-full mb-2"
                          onClick={handleStartRecording}
                        >
                          <Mic size={24} />
                        </Button>
                        <p className="text-xs text-gray-600">Record</p>
                      </div>
                    )}
                    
                    {isRecording && (
                      <div className="text-center">
                        <Button 
                          className="record-button bg-red-500 text-white h-16 w-16 rounded-full mb-2"
                          onClick={handleStopRecording}
                        >
                          <Square size={24} />
                        </Button>
                        <p className="text-xs text-gray-600">Stop</p>
                      </div>
                    )}
                    
                    {recordingBlob && !isRecording && (
                      <>
                        <div className="text-center">
                          <Button 
                            className="record-button bg-black text-white h-16 w-16 rounded-full mb-2"
                            onClick={handlePlayRecording}
                            disabled={isPlaying}
                          >
                            <Play size={24} />
                          </Button>
                          <p className="text-xs text-gray-600">Play</p>
                        </div>
                        
                        <div className="text-center">
                          <Button 
                            className="record-button bg-black text-white h-16 w-16 rounded-full mb-2"
                            onClick={handleStartRecording}
                          >
                            <Mic size={24} />
                          </Button>
                          <p className="text-xs text-gray-600">Re-record</p>
                        </div>
                        
                        <div className="text-center">
                          <Button 
                            className="record-button bg-green-600 text-white h-16 w-16 rounded-full mb-2"
                            onClick={handleSaveRecording}
                            disabled={isSaving}
                          >
                            <Save size={24} />
                          </Button>
                          <p className="text-xs text-gray-600">Save</p>
                        </div>
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
                  <p className="text-gray-500">Needs Re-recording</p>
                  <p className="text-2xl font-bold text-red-600">{rerecordingsRemaining}</p>
                  {rerecordingsRemaining > 0 && recordingMode === 'regular' && (
                    <p className="text-xs text-red-500 mt-1">
                      These will be available after completing regular recordings
                    </p>
                  )}
                </div>
                
                <div className="info-card col-span-1 md:col-span-4">
                  <div className="flex justify-between mb-1">
                    <p className="text-gray-500">Progress</p>
                    <p className="text-gray-500">{Math.round((completedSentences / totalSentences) * 100)}%</p>
                  </div>
                  <Progress value={(completedSentences / totalSentences) * 100} className="mt-2" />
                  {rerecordingsRemaining > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between mb-1">
                        <p className="text-gray-500">Re-recording Progress</p>
                        <p className="text-gray-500">
                          {rerecordingSentences.length > 0 
                            ? Math.round(((rerecordingSentences.length - rerecordingsRemaining) / rerecordingSentences.length) * 100)
                            : 0}%
                        </p>
                      </div>
                      <Progress 
                        value={rerecordingSentences.length > 0 
                          ? ((rerecordingSentences.length - rerecordingsRemaining) / rerecordingSentences.length) * 100
                          : 0} 
                        className="mt-2 bg-red-100" 
                      />
                    </div>
                  )}
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
