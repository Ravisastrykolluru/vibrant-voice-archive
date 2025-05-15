
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Download, Trash2, ArrowLeft } from "lucide-react";
import { getUserRecordings, getUserLanguage, deleteUserRecordings } from "@/lib/utils/supabase-utils";
import { supabase } from "@/integrations/supabase/client";

interface AdminUserDetailsProps {
  user: {
    unique_code: string;
    name: string;
    age: number;
    gender: string;
    contact_number: string;
  };
  onBack: () => void;
  onDelete: () => void;
}

const AdminUserDetails: React.FC<AdminUserDetailsProps> = ({ user, onBack, onDelete }) => {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [language, setLanguage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const userLanguage = await getUserLanguage(user.unique_code);
        const userRecordings = await getUserRecordings(user.unique_code);
        
        setLanguage(userLanguage || "Unknown");
        setRecordings(userRecordings);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Create audio element
    const audio = new Audio();
    setAudioElement(audio);
    
    return () => {
      // Clean up audio
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
    };
  }, [user.unique_code]);

  const handlePlay = async (filePath: string) => {
    if (!audioElement) return;
    
    if (currentAudio === filePath) {
      if (audioElement.paused) {
        audioElement.play();
      } else {
        audioElement.pause();
      }
    } else {
      try {
        const { data } = await supabase.storage
          .from('recordings')
          .createSignedUrl(filePath, 60);
          
        if (data?.signedUrl) {
          audioElement.src = data.signedUrl;
          audioElement.play();
          setCurrentAudio(filePath);
        }
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
  };

  const handleDownload = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('recordings')
        .createSignedUrl(filePath, 60);
        
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleExportAll = async () => {
    // Implement the export functionality
    alert("Export functionality will be implemented");
  };

  const handleDeleteRecordings = async () => {
    if (window.confirm("Are you sure you want to delete all recordings for this user? This action cannot be undone.")) {
      setIsDeleting(true);
      try {
        const success = await deleteUserRecordings(user.unique_code);
        if (success) {
          setRecordings([]);
          alert("All recordings have been deleted.");
        } else {
          alert("Failed to delete recordings.");
        }
      } catch (error) {
        console.error("Error deleting recordings:", error);
        alert("An error occurred while deleting recordings.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteUser = async () => {
    if (window.confirm("Are you sure you want to permanently delete this user and all their data? This action cannot be undone.")) {
      onDelete();
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={onBack} className="mr-2">
            <ArrowLeft size={16} />
          </Button>
          <h2 className="text-2xl font-bold">User Details</h2>
        </div>
        
        <div>
          <Button 
            variant="destructive" 
            onClick={handleDeleteUser} 
            className="flex items-center gap-1"
          >
            <Trash2 size={16} /> Delete User
          </Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <Label className="text-sm text-gray-500">Name</Label>
          <p className="font-medium">{user.name}</p>
        </div>
        
        <div>
          <Label className="text-sm text-gray-500">Unique Code</Label>
          <p className="font-medium">{user.unique_code}</p>
        </div>
        
        <div>
          <Label className="text-sm text-gray-500">Age</Label>
          <p className="font-medium">{user.age}</p>
        </div>
        
        <div>
          <Label className="text-sm text-gray-500">Gender</Label>
          <p className="font-medium">{user.gender}</p>
        </div>
        
        <div>
          <Label className="text-sm text-gray-500">Contact Number</Label>
          <p className="font-medium">{user.contact_number}</p>
        </div>
        
        <div>
          <Label className="text-sm text-gray-500">Language</Label>
          <p className="font-medium">{language}</p>
        </div>
      </div>
      
      <Tabs defaultValue="recordings">
        <TabsList className="mb-4">
          <TabsTrigger value="recordings">Recordings ({recordings.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recordings">
          <div className="mb-4 flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleExportAll}
            >
              <Download size={16} className="mr-2" /> Export All Recordings
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleDeleteRecordings}
              disabled={isDeleting || recordings.length === 0}
            >
              <Trash2 size={16} className="mr-2" /> Delete All Recordings
            </Button>
          </div>
          
          {isLoading ? (
            <p>Loading recordings...</p>
          ) : recordings.length === 0 ? (
            <p>No recordings found for this user.</p>
          ) : (
            <div className="space-y-4">
              {recordings.map((recording, index) => (
                <div 
                  key={recording.id} 
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div>
                    <p className="font-medium">Sentence {recording.sentence_index + 1}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{recording.sentence_text}</p>
                    <p className="text-xs text-gray-500">
                      Recorded: {new Date(recording.recording_date).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handlePlay(recording.file_path)}
                    >
                      <Play size={16} />
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleDownload(recording.file_path)}
                    >
                      <Download size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AdminUserDetails;
