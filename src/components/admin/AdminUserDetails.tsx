import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, X, RefreshCw, Download, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getUserRecordings, getUserLanguage, deleteUserRecordings } from "@/lib/utils/supabase-utils";
import { supabase } from "@/integrations/supabase/client";

interface RecordingData {
  id: string;
  sentence_index: number;
  sentence_text: string;
  recording_date: string;
  language: string;
  needs_rerecording: boolean;
  snr: number | null;
  file_path: string;
  unique_code: string;
}

interface UserDetailsProps {
  user: {
    id: string;
    name: string;
    age: number;
    gender: string;
    contact_number: string;
    created_at: string;
    unique_code: string;
    languagePreference?: string;
  };
  onBack: () => void;
  onUserUpdated: () => void;
}

const AdminUserDetails: React.FC<UserDetailsProps> = ({ user, onBack, onUserUpdated }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [recordings, setRecordings] = useState<RecordingData[]>([]);
  const [language, setLanguage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<RecordingData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadUserData();
  }, [user.unique_code]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // Load user's language preference
      const lang = await getUserLanguage(user.unique_code);
      if (lang) {
        setLanguage(lang);
      }
      
      // Load user's recordings
      const recs = await getUserRecordings(user.unique_code);
      setRecordings(recs as RecordingData[]);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteUserRecordings(user.unique_code);
      if (success) {
        toast({
          title: "Success",
          description: "User recordings deleted successfully"
        });
        setRecordings([]);
      } else {
        throw new Error("Failed to delete recordings");
      }
    } catch (error) {
      console.error("Error deleting recordings:", error);
      toast({
        title: "Error",
        description: "Failed to delete user recordings",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handlePlayRecording = async (recording: RecordingData) => {
    // Stop current audio if playing
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setAudio(null);
    }
    
    setSelectedRecording(recording);
    setIsPlaying(true);
    
    try {
      // Get the file URL from Supabase storage
      const { data } = await supabase
        .storage
        .from('recordings')
        .createSignedUrl(recording.file_path, 60);
        
      if (data?.signedUrl) {
        const audioElement = new Audio(data.signedUrl);
        setAudio(audioElement);
        
        audioElement.onended = () => {
          setIsPlaying(false);
          setAudio(null);
        };
        
        audioElement.play();
      }
    } catch (error) {
      console.error("Error playing recording:", error);
      toast({
        title: "Error",
        description: "Failed to play recording",
        variant: "destructive"
      });
      setIsPlaying(false);
    }
  };

  const handleMarkForRerecording = async (recording: RecordingData) => {
    try {
      const { error } = await supabase
        .from('recordings')
        .update({ needs_rerecording: !recording.needs_rerecording })
        .eq('id', recording.id);
        
      if (error) throw error;
      
      // Update local state
      setRecordings(prev => 
        prev.map(rec => 
          rec.id === recording.id 
            ? { ...rec, needs_rerecording: !rec.needs_rerecording } 
            : rec
        )
      );
      
      toast({
        title: "Success",
        description: recording.needs_rerecording 
          ? "Recording marked as acceptable" 
          : "Recording marked for re-recording"
      });
    } catch (error) {
      console.error("Error updating recording:", error);
      toast({
        title: "Error",
        description: "Failed to update recording status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold">User Details</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadUserData} 
            disabled={isLoading}
            className="gap-1"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteConfirm(true)}
            disabled={recordings.length === 0 || isDeleting}
            className="gap-1"
          >
            <Trash2 size={16} />
            Delete Recordings
          </Button>
        </div>
      </div>
      
      {/* User info card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact Number</p>
              <p className="font-medium">{user.contact_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Unique Code</p>
              <p className="font-medium">{user.unique_code}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium">{user.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Age</p>
              <p className="font-medium">{user.age} years</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Registered on</p>
              <p className="font-medium">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Language</p>
              <p className="font-medium">{language || user.languagePreference || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Recordings</p>
              <p className="font-medium">{recordings.length}</p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all recordings?</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete all recordings for this user? 
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {/* Overview content */}
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">User Summary</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Recordings</p>
                  <p className="text-2xl font-bold">{recordings.length}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Needs Re-recording</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {recordings.filter(r => r.needs_rerecording).length}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Last Recording</p>
                  <p className="text-xl font-bold">
                    {recordings.length > 0 
                      ? new Date(
                          recordings.reduce((latest, rec) => 
                            new Date(rec.recording_date) > new Date(latest.recording_date) ? rec : latest
                          , recordings[0]).recording_date
                        ).toLocaleDateString() 
                      : "No recordings"}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Recent Activity</h3>
                {recordings.length > 0 ? (
                  <div className="space-y-2">
                    {recordings
                      .sort((a, b) => new Date(b.recording_date).getTime() - new Date(a.recording_date).getTime())
                      .slice(0, 5)
                      .map(rec => (
                        <div key={rec.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">Sentence #{rec.sentence_index + 1}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(rec.recording_date).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            {rec.needs_rerecording && (
                              <Badge variant="destructive">Needs re-recording</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No activity yet</p>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="recordings">
          {/* Recordings content */}
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Recordings</h2>
            
            {recordings.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-3 px-4">#</th>
                        <th className="text-left py-3 px-4">Text</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Quality</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordings
                        .sort((a, b) => a.sentence_index - b.sentence_index)
                        .map(rec => (
                          <tr key={rec.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{rec.sentence_index + 1}</td>
                            <td className="py-3 px-4 max-w-[200px] truncate">{rec.sentence_text}</td>
                            <td className="py-3 px-4">
                              {new Date(rec.recording_date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              {rec.snr !== null ? (
                                rec.snr > 15 ? (
                                  <Badge variant="default" className="bg-green-600">Good</Badge>
                                ) : rec.snr > 5 ? (
                                  <Badge variant="default" className="bg-yellow-600">Average</Badge>
                                ) : (
                                  <Badge variant="destructive">Poor</Badge>
                                )
                              ) : (
                                <Badge variant="outline">Unknown</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {rec.needs_rerecording ? (
                                <Badge variant="destructive">Needs re-recording</Badge>
                              ) : (
                                <Badge variant="default" className="bg-green-600">Approved</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handlePlayRecording(rec)}
                                  disabled={isPlaying && selectedRecording?.id === rec.id}
                                >
                                  {isPlaying && selectedRecording?.id === rec.id ? "Playing..." : "Play"}
                                </Button>
                                <Button 
                                  variant={rec.needs_rerecording ? "default" : "destructive"}
                                  size="sm"
                                  onClick={() => handleMarkForRerecording(rec)}
                                >
                                  {rec.needs_rerecording ? (
                                    <>
                                      <Check size={16} className="mr-1" />
                                      Approve
                                    </>
                                  ) : (
                                    <>
                                      <X size={16} className="mr-1" />
                                      Reject
                                    </>
                                  )}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No recordings found for this user</p>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          {/* Analytics content */}
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Recording Analytics</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Recording Quality Distribution</h3>
                <div className="h-32 flex items-end gap-4">
                  {recordings.length > 0 ? (
                    <>
                      <div className="flex flex-col items-center">
                        <div 
                          className="bg-green-500 w-16" 
                          style={{ 
                            height: `${Math.max(5, (recordings.filter(r => r.snr !== null && r.snr > 15).length / recordings.length) * 100)}%` 
                          }}
                        ></div>
                        <p className="mt-2">Good</p>
                        <p className="text-sm text-gray-500">
                          {recordings.filter(r => r.snr !== null && r.snr > 15).length}
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div 
                          className="bg-yellow-500 w-16" 
                          style={{ 
                            height: `${Math.max(5, (recordings.filter(r => r.snr !== null && r.snr > 5 && r.snr <= 15).length / recordings.length) * 100)}%` 
                          }}
                        ></div>
                        <p className="mt-2">Average</p>
                        <p className="text-sm text-gray-500">
                          {recordings.filter(r => r.snr !== null && r.snr > 5 && r.snr <= 15).length}
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div 
                          className="bg-red-500 w-16" 
                          style={{ 
                            height: `${Math.max(5, (recordings.filter(r => r.snr !== null && r.snr <= 5).length / recordings.length) * 100)}%` 
                          }}
                        ></div>
                        <p className="mt-2">Poor</p>
                        <p className="text-sm text-gray-500">
                          {recordings.filter(r => r.snr !== null && r.snr <= 5).length}
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div 
                          className="bg-gray-300 w-16" 
                          style={{ 
                            height: `${Math.max(5, (recordings.filter(r => r.snr === null).length / recordings.length) * 100)}%` 
                          }}
                        ></div>
                        <p className="mt-2">Unknown</p>
                        <p className="text-sm text-gray-500">
                          {recordings.filter(r => r.snr === null).length}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">No data available</p>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Recording Progress</h3>
                {recordings.length > 0 && language ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round((recordings.length / 50) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${Math.min(100, (recordings.length / 50) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {recordings.length} of approximately 50 sentences recorded
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">No data available</p>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUserDetails;
