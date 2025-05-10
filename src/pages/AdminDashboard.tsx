
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Users, HardDrive, Upload, Plus, Download } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  getUsers, 
  getLanguages, 
  getTotalStorageUsed, 
  deleteLanguage, 
  Language, 
  getGoogleDriveConfig, 
  getRecordings,
  downloadAllLanguageRecordings,
  canBulkDownloadFromGoogleDrive
} from "@/lib/utils/storage";
import AdminUserList from "@/components/admin/AdminUserList";
import AdminLanguageManager from "@/components/admin/AdminLanguageManager";
import AdminSettings from "@/components/admin/AdminSettings";

// Color splash component with more dynamic animation
const ColorSplash = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-red-500 opacity-10 rounded-full blur-3xl animate-pulse" 
           style={{ transform: 'translate(-30%, -30%)' }}></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500 opacity-10 rounded-full blur-3xl animate-pulse" 
           style={{ transform: 'translate(30%, -30%)', animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-green-500 opacity-10 rounded-full blur-3xl animate-pulse" 
           style={{ transform: 'translate(-30%, 30%)', animationDelay: '1s' }}></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 opacity-10 rounded-full blur-3xl animate-pulse" 
           style={{ transform: 'translate(20%, 20%)', animationDelay: '1.5s' }}></div>
      <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-yellow-500 opacity-10 rounded-full blur-3xl animate-pulse" 
           style={{ transform: 'translate(-50%, -50%)', animationDelay: '0.7s' }}></div>
      <div className="absolute top-1/3 right-1/4 w-56 h-56 bg-pink-500 opacity-10 rounded-full blur-3xl animate-pulse" 
           style={{ transform: 'translate(50%, -50%)', animationDelay: '1.2s' }}></div>
      
      {/* Add more dynamic gradient splashes */}
      <div className="absolute top-1/4 left-1/2 w-40 h-40 bg-gradient-to-r from-orange-500 to-yellow-500 opacity-10 rounded-full blur-3xl" 
           style={{ transform: 'translate(-50%, -50%)', animation: 'pulse 3s infinite alternate' }}></div>
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-gradient-to-r from-blue-500 to-purple-500 opacity-10 rounded-full blur-3xl" 
           style={{ transform: 'translate(30%, 30%)', animation: 'pulse 4s infinite alternate 1s' }}></div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<any[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [driveConfig, setDriveConfig] = useState<any>(null);
  const [recordingCount, setRecordingCount] = useState(0);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [canBulkDownload, setCanBulkDownload] = useState(false);
  
  useEffect(() => {
    // Load dashboard data
    loadDashboardData();
    
    // Set up a listener for recording updates
    window.addEventListener('recording-updated', loadDashboardData);
    
    return () => {
      window.removeEventListener('recording-updated', loadDashboardData);
    };
  }, []);
  
  const loadDashboardData = () => {
    const userData = getUsers();
    setUsers(userData);
    
    const languageData = getLanguages();
    setLanguages(languageData);
    
    const storage = getTotalStorageUsed();
    setStorageUsed(storage);
    
    const config = getGoogleDriveConfig();
    setDriveConfig(config);
    setCanBulkDownload(canBulkDownloadFromGoogleDrive());
    
    // Count total recordings
    const allRecordings = getRecordings();
    setRecordingCount(allRecordings.length);
    
    // Count flagged recordings
    const flagged = allRecordings.filter(rec => rec.needsRerecording).length;
    setFlaggedCount(flagged);
  };
  
  const handleAddLanguage = () => {
    // Will be implemented in AdminLanguageManager
  };
  
  const handleDeleteLanguage = (id: string) => {
    if (window.confirm("Are you sure you want to delete this language? This action cannot be undone.")) {
      deleteLanguage(id);
      toast({
        title: "Language deleted",
        description: "The language has been removed from the system"
      });
      loadDashboardData();
    }
  };
  
  const handleDownloadLanguageRecordings = async (languageId: string) => {
    const language = languages.find(lang => lang.id === languageId);
    
    if (!language) {
      toast({
        title: "Language not found",
        description: "Could not find the language to download",
        variant: "destructive"
      });
      return;
    }
    
    try {
      toast({ title: `Preparing ${language.name} recordings for download...` });
      
      // Get the recordings and create a downloadable blob
      const blob = await downloadAllLanguageRecordings(language.name);
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${language.name.toLowerCase()}_recordings.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download complete",
        description: `All ${language.name} recordings have been downloaded`
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the recordings",
        variant: "destructive"
      });
    }
  };
  
  const handleLogout = () => {
    navigate("/");
    toast({ title: "Logged out successfully" });
  };
  
  // Convert bytes to GB for display
  const formatStorageSize = (bytes: number): string => {
    const gigabytes = bytes / (1024 * 1024 * 1024);
    return gigabytes.toFixed(2) + " GB";
  };
  
  return (
    <Layout showBackground={false}>
      {/* Colorful dynamic background effect */}
      <ColorSplash />
      
      <div className="min-h-screen flex flex-col relative z-10">
        <header className="bg-black text-white shadow py-4 px-6">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            
            <Button variant="ghost" onClick={handleLogout} className="text-white">
              <LogOut size={18} className="mr-2" /> Logout
            </Button>
          </div>
        </header>
        
        <div className="flex-1 p-4 md:p-8 bg-opacity-90">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Total Users</p>
                    <p className="text-3xl font-bold">{users.length}</p>
                  </div>
                  <Users className="h-10 w-10 text-purple-500 opacity-80" />
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Languages</p>
                    <p className="text-3xl font-bold">{languages.length}</p>
                  </div>
                  <Upload className="h-10 w-10 text-blue-500 opacity-80" />
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Total Recordings</p>
                    <p className="text-3xl font-bold">{recordingCount}</p>
                    <p className="text-xs text-red-600 mt-1">
                      {flaggedCount > 0 && `${flaggedCount} flagged for re-recording`}
                    </p>
                  </div>
                  <HardDrive className="h-10 w-10 text-green-500 opacity-80" />
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Storage Used</p>
                    <p className="text-3xl font-bold">{formatStorageSize(storageUsed)}</p>
                    {driveConfig?.connected && driveConfig?.folderName && (
                      <p className="text-xs text-green-600 mt-1">Backed up to Google Drive: {driveConfig.folderName}</p>
                    )}
                  </div>
                  <HardDrive className="h-10 w-10 text-orange-500 opacity-80" />
                </div>
              </Card>
            </div>
            
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="languages">Languages</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="users" className="mt-6">
                <AdminUserList users={users} />
              </TabsContent>
              
              <TabsContent value="languages" className="mt-6">
                <div className="mb-4">
                  {canBulkDownload && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-4">
                      <p className="text-green-700 flex items-center">
                        <Download size={18} className="mr-2" />
                        Bulk downloads available from Google Drive
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        All recordings are being backed up to: {driveConfig?.folderName}
                      </p>
                    </div>
                  )}
                </div>
                <AdminLanguageManager 
                  languages={languages}
                  onDelete={handleDeleteLanguage}
                  onLanguageAdded={loadDashboardData}
                />
              </TabsContent>
              
              <TabsContent value="settings" className="mt-6">
                <AdminSettings onSettingsUpdated={loadDashboardData} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
