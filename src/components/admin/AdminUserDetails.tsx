
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, AlertCircle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserRecordings, getUserLanguage, markForRerecording, getRecordingBlob } from "@/lib/utils/supabase-utils";
import JSZip from "jszip";

interface AdminUserDetailsProps {
  user: any;
  onBack: () => void;
}

const AdminUserDetails: React.FC<AdminUserDetailsProps> = ({ user, onBack }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [userLanguages, setUserLanguages] = useState<any[]>([]);
  const [downloadingRecordings, setDownloadingRecordings] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioRefs, setAudioRefs] = useState<Record<string, HTMLAudioElement | null>>({});
  const [flag, setFlag] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState("");

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  const loadUserData = async () => {
    setLoading(true);
    
    try {
      // Load user recordings
      const userRecordings = await getUserRecordings(user.user_id);
      setRecordings(userRecordings);
      
      // Get assigned languages for the user
      const { data: userLangs } = await supabase
        .from('user_languages')
        .select('language')
        .eq('user_id', user.user_id);
      
      setUserLanguages(userLangs || []);
      
      // Load all available languages
      const { data: langs } = await supabase
        .from('languages')
        .select('*');
      
      setLanguages(langs || []);
      
      // Initialize flagging state
      const flagState: Record<string, boolean> = {};
      userRecordings.forEach(rec => {
        flagState[`${rec.language}_${rec.sentence_index}`] = rec.needs_rerecording || false;
      });
      setFlag(flagState);
      
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlayRecording = async (recording: any) => {
    try {
      // If we're already playing this recording, stop it
      if (playingAudio === `${recording.language}_${recording.sentence_index}`) {
        const audio = audioRefs[playingAudio];
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        setPlayingAudio(null);
        return;
      }
      
      // Stop any currently playing audio
      if (playingAudio && audioRefs[playingAudio]) {
        audioRefs[playingAudio].pause();
        audioRefs[playingAudio].currentTime = 0;
      }
      
      // Download the recording if we don't have it yet
      if (!audioRefs[`${recording.language}_${recording.sentence_index}`]) {
        const blob = await getRecordingBlob(recording.file_path);
        
        if (!blob) {
          toast({
            title: "Error",
            description: "Failed to load recording",
            variant: "destructive"
          });
          return;
        }
        
        // Create audio element and play
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onended = () => {
          setPlayingAudio(null);
        };
        
        // Store the audio element for future use
        setAudioRefs(prev => ({
          ...prev,
          [`${recording.language}_${recording.sentence_index}`]: audio
        }));
        
        audio.play();
        setPlayingAudio(`${recording.language}_${recording.sentence_index}`);
      } else {
        // Play existing audio
        const audio = audioRefs[`${recording.language}_${recording.sentence_index}`];
        audio!.play();
        setPlayingAudio(`${recording.language}_${recording.sentence_index}`);
      }
    } catch (error) {
      console.error("Error playing recording:", error);
      toast({
        title: "Error",
        description: "Failed to play recording",
        variant: "destructive"
      });
    }
  };

  const handleFlagForRerecording = async (recording: any, shouldFlag: boolean) => {
    try {
      if (shouldFlag) {
        // Mark for re-recording
        await markForRerecording(user.user_id, recording.language, recording.sentence_index);
        
        toast({
          title: "Recording flagged",
          description: "User will need to re-record this sentence"
        });
      } else {
        // Remove flag
        await supabase
          .from('recordings')
          .update({ needs_rerecording: false })
          .eq('user_id', user.user_id)
          .eq('language', recording.language)
          .eq('sentence_index', recording.sentence_index);
        
        toast({
          title: "Flag removed",
          description: "Re-recording no longer required"
        });
      }
      
      // Update local state
      setFlag(prev => ({
        ...prev,
        [`${recording.language}_${recording.sentence_index}`]: shouldFlag
      }));
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('recording-updated'));
      
    } catch (error) {
      console.error("Error updating recording flag:", error);
      toast({
        title: "Error",
        description: "Failed to update recording status",
        variant: "destructive"
      });
    }
  };

  const handleDownloadRecordings = async () => {
    if (recordings.length === 0) {
      toast({
        title: "No recordings",
        description: "This user has no recordings to download",
        variant: "destructive"
      });
      return;
    }
    
    setDownloadingRecordings(true);
    
    try {
      const zip = new JSZip();
      
      // Group recordings by date, language
      const recordingsByDate: Record<string, any[]> = {};
      
      recordings.forEach(recording => {
        const date = new Date(recording.recording_date).toISOString().split('T')[0];
        if (!recordingsByDate[date]) {
          recordingsByDate[date] = [];
        }
        recordingsByDate[date].push(recording);
      });
      
      // Add each recording to the ZIP file with organized folder structure
      for (const [date, dateRecordings] of Object.entries(recordingsByDate)) {
        // Group by language within each date
        const recordingsByLanguage: Record<string, any[]> = {};
        
        dateRecordings.forEach(recording => {
          if (!recordingsByLanguage[recording.language]) {
            recordingsByLanguage[recording.language] = [];
          }
          recordingsByLanguage[recording.language].push(recording);
        });
        
        // Create folders for each language and add recordings
        for (const [language, langRecordings] of Object.entries(recordingsByLanguage)) {
          const folderPath = `recordings/${date}/${user.gender}_${language}_${user.user_id}/`;
          
          // Add recordings to this folder
          for (const recording of langRecordings) {
            const blob = await getRecordingBlob(recording.file_path);
            if (blob) {
              const fileName = `${user.gender}_${language}_${user.user_id}_${recording.sentence_index}.wav`;
              zip.file(folderPath + fileName, blob);
            }
          }
          
          // Add metadata JSON file
          const metadata = {
            user_id: user.user_id,
            name: user.name,
            gender: user.gender,
            age: user.age,
            language,
            contact_number: user.contact_number,
            recording_count: langRecordings.length,
            unique_code: user.unique_code
          };
          
          zip.file(folderPath + "metadata.json", JSON.stringify(metadata, null, 2));
        }
      }
      
      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      // Create download link
      const downloadUrl = URL.createObjectURL(zipBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = `recordings_${user.name}_${user.user_id}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Download complete",
        description: "Recordings have been downloaded"
      });
      
    } catch (error) {
      console.error("Error downloading recordings:", error);
      toast({
        title: "Download failed",
        description: "Failed to download recordings",
        variant: "destructive"
      });
    } finally {
      setDownloadingRecordings(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notification.trim()) {
      toast({
        title: "Empty notification",
        description: "Please enter a notification message",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Use custom RPC function to add notification to avoid type errors
      const { error } = await supabase.rpc('add_notification', {
        p_user_id: user.user_id,
        p_message: notification
      });
      
      if (error) throw error;
      
      toast({
        title: "Notification sent",
        description: "The user will see this notification on their next login"
      });
      
      setNotification("");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async () => {
    const confirmReset = window.confirm("Are you sure you want to reset this user's password? This will generate a new password for the user.");
    
    if (!confirmReset) return;
    
    try {
      const newPassword = Math.random().toString(36).slice(2, 10);
      
      // Use custom RPC function to update password
      const { error } = await supabase.rpc('update_user_password', {
        p_user_id: user.user_id,
        p_password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: "Password reset",
        description: `New password: ${newPassword}`
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive"
      });
    }
  };

  const groupRecordingsByLanguage = () => {
    const groups: Record<string, any[]> = {};
    
    recordings.forEach(recording => {
      if (!groups[recording.language]) {
        groups[recording.language] = [];
      }
      groups[recording.language].push(recording);
    });
    
    return groups;
  };

  const recordingsByLanguage = groupRecordingsByLanguage();

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2" 
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold">User Details</h2>
      </div>
      
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-4">User Information</h3>
            <dl className="space-y-2">
              <div className="flex">
                <dt className="font-semibold w-32">User ID:</dt>
                <dd>{user.user_id}</dd>
              </div>
              <div className="flex">
                <dt className="font-semibold w-32">Name:</dt>
                <dd>{user.name}</dd>
              </div>
              <div className="flex">
                <dt className="font-semibold w-32">Age:</dt>
                <dd>{user.age}</dd>
              </div>
              <div className="flex">
                <dt className="font-semibold w-32">Gender:</dt>
                <dd className="capitalize">{user.gender}</dd>
              </div>
              <div className="flex">
                <dt className="font-semibold w-32">Contact:</dt>
                <dd>{user.contact_number}</dd>
              </div>
              <div className="flex">
                <dt className="font-semibold w-32">Unique Code:</dt>
                <dd>{user.unique_code}</dd>
              </div>
              <div className="flex">
                <dt className="font-semibold w-32">Joined:</dt>
                <dd>{new Date(user.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Languages & Recordings</h3>
            {userLanguages.length > 0 ? (
              <div className="space-y-2">
                {userLanguages.map((lang, index) => {
                  const langRecordings = recordings.filter(rec => rec.language === lang.language);
                  const flaggedCount = langRecordings.filter(rec => rec.needs_rerecording).length;
                  
                  return (
                    <div key={index} className="flex justify-between items-center">
                      <span className="font-medium">{lang.language}</span>
                      <div>
                        <Badge variant="outline" className="mr-2">
                          {langRecordings.length} recordings
                        </Badge>
                        {flaggedCount > 0 && (
                          <Badge variant="destructive">
                            {flaggedCount} flagged
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No languages assigned</p>
            )}
            
            <div className="mt-8 space-x-2">
              <Button
                onClick={handleDownloadRecordings}
                className="flex items-center"
                disabled={downloadingRecordings || recordings.length === 0}
              >
                <Download size={16} className="mr-1" />
                {downloadingRecordings ? "Downloading..." : "Download Recordings"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Send Notification</h3>
        <div className="flex items-center gap-4">
          <Input 
            value={notification}
            onChange={e => setNotification(e.target.value)}
            placeholder="Enter notification message for user..."
            className="flex-1"
          />
          <Button onClick={handleSendNotification}>Send</Button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          This will be shown to the user on their next login.
        </p>
      </Card>
      
      {Object.keys(recordingsByLanguage).length > 0 ? (
        <Tabs defaultValue={Object.keys(recordingsByLanguage)[0]} className="mt-8">
          <TabsList className="flex-wrap">
            {Object.keys(recordingsByLanguage).map(language => (
              <TabsTrigger key={language} value={language}>
                {language}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(recordingsByLanguage).map(([language, languageRecordings]) => (
            <TabsContent key={language} value={language} className="mt-4">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sentence #</TableHead>
                      <TableHead className="w-full">Text</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Flag for Re-recording</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {languageRecordings
                      .sort((a, b) => a.sentence_index - b.sentence_index)
                      .map((recording) => (
                        <TableRow key={`${recording.language}_${recording.sentence_index}`}>
                          <TableCell>{recording.sentence_index + 1}</TableCell>
                          <TableCell className="font-mono text-sm max-w-md truncate">
                            {recording.sentence_text}
                          </TableCell>
                          <TableCell>
                            {new Date(recording.recording_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {recording.snr ? (
                              <Badge variant={recording.snr > 15 ? "default" : "outline"}>
                                {recording.snr.toFixed(1)} dB
                              </Badge>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={flag[`${recording.language}_${recording.sentence_index}`]}
                              onCheckedChange={(checked) => 
                                handleFlagForRerecording(recording, checked)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePlayRecording(recording)}
                            >
                              {playingAudio === `${recording.language}_${recording.sentence_index}` ? 
                                "Stop" : "Play"}
                            </Button>
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-gray-500">This user has no recordings yet</p>
        </Card>
      )}
    </div>
  );
};

export default AdminUserDetails;
