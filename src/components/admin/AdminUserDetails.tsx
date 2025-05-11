
import React, { useState, useEffect } from "react";
import { ArrowLeft, Download, Play, Bell, Archive, RefreshCw, Folder, Cloud } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RecordingMetadata, getRecordingBlob, markForRerecording, downloadAllUserRecordings, isRecordingSyncedToGoogleDrive, getStoragePreference, getUserRecordings } from "@/lib/utils/storage";
import { playAudio } from "@/lib/utils/audio";
import { useToast } from "@/hooks/use-toast";

interface AdminUserDetailsProps {
  user: any;
  recordings: RecordingMetadata[];
  onBack: () => void;
}

const AdminUserDetails: React.FC<AdminUserDetailsProps> = ({ user, onBack }) => {
  const { toast } = useToast();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
  
  // Load recordings when component mounts or when they change
  useEffect(() => {
    loadRecordings();
  }, [user.id]);
  
  const loadRecordings = () => {
    const userRecordings = getUserRecordings(user.id);
    setRecordings(userRecordings);
  };
  
  const handlePlayRecording = async (filePath: string, index: number) => {
    try {
      const blob = await getRecordingBlob(filePath);
      if (blob) {
        const audio = playAudio(blob);
        setPlayingIndex(index);
        
        audio.addEventListener("ended", () => {
          setPlayingIndex(null);
        });
      } else {
        toast({
          title: "Recording not found",
          description: "The audio file could not be located",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Playback error",
        description: "Could not play this recording",
        variant: "destructive"
      });
    }
  };
  
  const handleDownloadRecording = async (filePath: string, fileName: string) => {
    try {
      const blob = await getRecordingBlob(filePath);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        toast({
          title: "Download failed",
          description: "The audio file could not be located",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Download error",
        description: "Could not download this recording",
        variant: "destructive"
      });
    }
  };
  
  const handleDownloadAll = async () => {
    try {
      setDownloadingAll(true);
      toast({
        title: "Preparing download",
        description: "Creating archive of all recordings..."
      });
      
      const archiveBlob = await downloadAllUserRecordings(user.id);
      
      const url = URL.createObjectURL(archiveBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recordings_${user.id}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download complete",
        description: "All recordings have been downloaded as ZIP file"
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download all recordings",
        variant: "destructive"
      });
    } finally {
      setDownloadingAll(false);
    }
  };
  
  const handleRequestRerecording = (recording: RecordingMetadata) => {
    try {
      markForRerecording(recording.userId, recording.language, recording.sentenceIndex);
      
      toast({
        title: "Re-recording requested",
        description: "User will be prompted to re-record this sentence on their next session",
      });
      
      // Refresh the recordings to show the updated state
      loadRecordings();
      
      // Dispatch the recording-updated event to update other components
      const event = new CustomEvent("recording-updated", { 
        detail: { userId: recording.userId, language: recording.language } 
      });
      window.dispatchEvent(event);
    } catch (error) {
      toast({
        title: "Request failed",
        description: "Could not request re-recording",
        variant: "destructive"
      });
    }
  };
  
  // Group recordings by language
  const recordingsByLanguage: { [key: string]: RecordingMetadata[] } = {};
  recordings.forEach(recording => {
    if (!recordingsByLanguage[recording.language]) {
      recordingsByLanguage[recording.language] = [];
    }
    recordingsByLanguage[recording.language].push(recording);
  });
  
  // Get storage details
  const storagePrefs = getStoragePreference();
  const storageIcon = storagePrefs.type === "local" ? <Folder size={18} className="mr-2" /> : <Cloud size={18} className="mr-2" />;
  const storageName = storagePrefs.type === "local" ? "Local Storage" : "Google Drive";
  
  return (
    <Card className="p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-semibold">User Details</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="font-medium mb-4">Personal Information</h3>
          <dl className="space-y-2">
            <div className="flex">
              <dt className="w-32 font-medium text-gray-500">User ID:</dt>
              <dd>{user.id}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 font-medium text-gray-500">Name:</dt>
              <dd>{user.name}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 font-medium text-gray-500">Age:</dt>
              <dd>{user.age}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 font-medium text-gray-500">Gender:</dt>
              <dd className="capitalize">{user.gender}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 font-medium text-gray-500">Contact:</dt>
              <dd>{user.contactNumber}</dd>
            </div>
            <div className="flex">
              <dt className="w-32 font-medium text-gray-500">Registered:</dt>
              <dd>{new Date(user.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>
        
        <div>
          <h3 className="font-medium mb-4">Recording Statistics</h3>
          <dl className="space-y-2">
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Total Recordings:</dt>
              <dd>{recordings.length}</dd>
            </div>
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Languages:</dt>
              <dd>{Object.keys(recordingsByLanguage).length}</dd>
            </div>
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Latest Recording:</dt>
              <dd>
                {recordings.length > 0 
                  ? new Date(Math.max(...recordings.map(r => new Date(r.recordingDate).getTime()))).toLocaleString() 
                  : "N/A"}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Flagged for Re-recording:</dt>
              <dd>
                {recordings.filter(r => r.needsRerecording).length}
              </dd>
            </div>
            <div className="flex">
              <dt className="w-40 font-medium text-gray-500">Storage:</dt>
              <dd className="flex items-center">
                {storageIcon} {storageName}
              </dd>
            </div>
          </dl>
          
          <Button 
            onClick={handleDownloadAll} 
            className="mt-6 flex items-center"
            disabled={downloadingAll}
          >
            <Archive size={18} className="mr-2" /> 
            {downloadingAll ? "Preparing Archive..." : "Download All as ZIP"}
          </Button>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="font-medium mb-4">Recordings</h3>
        
        {Object.keys(recordingsByLanguage).length > 0 ? (
          Object.entries(recordingsByLanguage).map(([language, languageRecordings]) => (
            <div key={language} className="mb-8">
              <h4 className="font-medium mb-4">Language: {language}</h4>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sentence #</TableHead>
                      <TableHead>Sentence Text</TableHead>
                      <TableHead>Date Recorded</TableHead>
                      <TableHead>SNR (dB)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {languageRecordings
                      .sort((a, b) => a.sentenceIndex - b.sentenceIndex)
                      .map((recording, index) => (
                        <TableRow key={recording.filePath}>
                          <TableCell>{recording.sentenceIndex + 1}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {recording.sentenceText}
                          </TableCell>
                          <TableCell>
                            {new Date(recording.recordingDate).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {recording.snr ? (
                              <div>
                                <span className={`font-medium ${
                                  recording.snr > 25 ? "text-green-600" : 
                                  recording.snr > 15 ? "text-yellow-600" : "text-red-600"
                                }`}>
                                  {recording.snr.toFixed(1)}
                                </span>
                                <Progress 
                                  className="h-1 mt-1" 
                                  value={Math.min((recording.snr / 40) * 100, 100)} 
                                />
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {recording.needsRerecording ? (
                                <Badge variant="destructive">Needs re-recording</Badge>
                              ) : (
                                <Badge variant="secondary">
                                  {storagePrefs.type === "google-drive" && isRecordingSyncedToGoogleDrive(recording.filePath) 
                                    ? "Synced to Drive" 
                                    : "Local only"}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center"
                                onClick={() => handlePlayRecording(recording.filePath, index)}
                              >
                                {playingIndex === index ? "Playing..." : <Play size={16} />}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center"
                                onClick={() => handleDownloadRecording(
                                  recording.filePath, 
                                  (recording.filePath.split("/").pop() || "recording") + ".wav"
                                )}
                              >
                                <Download size={16} />
                              </Button>
                              <Button
                                variant={recording.needsRerecording ? "destructive" : "outline"}
                                size="sm"
                                className="flex items-center"
                                onClick={() => handleRequestRerecording(recording)}
                                disabled={recording.needsRerecording}
                              >
                                <Bell size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">
            This user hasn't made any recordings yet
          </p>
        )}
      </div>
    </Card>
  );
};

export default AdminUserDetails;
