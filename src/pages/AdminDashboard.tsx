import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Users, HardDrive, Download, Trash2, Database } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import AdminUserList from "@/components/admin/AdminUserList";
import AdminLanguageManager from "@/components/admin/AdminLanguageManager";
import AdminSettings from "@/components/admin/AdminSettings";
import { supabase } from "@/integrations/supabase/client"; // Add this import
import { 
  getAllUsers,
  deleteUserRecordings
} from "@/lib/utils/supabase-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

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
  const [languages, setLanguages] = useState<any[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [recordingCount, setRecordingCount] = useState(0);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [showUserCleanDialog, setShowUserCleanDialog] = useState(false);
  const [selectedUserForClean, setSelectedUserForClean] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    // Load dashboard data
    loadDashboardData();
    
    // Set up a listener for recording updates
    const subscription = supabase
      .channel('public:recordings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recordings' }, () => {
        loadDashboardData();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  const loadDashboardData = async () => {
    try {
      // Load users
      const userData = await getAllUsers();
      setUsers(userData || []);
      
      // Load languages
      const { data: languageData } = await supabase
        .from('languages')
        .select('*');
      setLanguages(languageData || []);
      
      // Load recordings
      const { data: recordings } = await supabase
        .from('recordings')
        .select('*');
      setRecordingCount(recordings?.length || 0);
      
      // Count flagged recordings
      const flagged = recordings?.filter(rec => rec.needs_rerecording).length || 0;
      setFlaggedCount(flagged);
      
      // Get storage info - fix the type issue
      try {
        // Instead of trying to get the bucket size (which may not be available),
        // get the total size by estimating from recordings
        const estimatedSize = recordings?.reduce((total, rec) => {
          // Estimate average recording size as 100KB
          return total + 100000;
        }, 0) || 0;
        
        setStorageUsed(estimatedSize);
      } catch (error) {
        console.error("Error estimating storage size:", error);
        setStorageUsed(0); // Default value if we can't estimate the size
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error loading data",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteLanguage = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this language? This action cannot be undone.")) {
      try {
        const { error } = await supabase
          .from('languages')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        toast({
          title: "Language deleted",
          description: "The language has been removed from the system"
        });
        loadDashboardData();
      } catch (error) {
        console.error("Error deleting language:", error);
        toast({
          title: "Error deleting language",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    }
  };
  
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Get all users
      const { data: users } = await supabase
        .from('users')
        .select('*');
      
      // Get all recordings metadata
      const { data: recordings } = await supabase
        .from('recordings')
        .select('*');
      
      // Get all languages
      const { data: languages } = await supabase
        .from('languages')
        .select('*');
      
      // Get all feedback
      const { data: feedback } = await supabase
        .from('feedback')
        .select('*');
      
      // Package data
      const exportData = {
        users,
        recordings,
        languages,
        feedback,
        exportDate: new Date().toISOString()
      };
      
      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `speech-recording-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      toast({
        title: "Data exported successfully",
        description: "All data has been exported to a JSON file"
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleOpenCleanDialog = () => {
    setShowUserCleanDialog(true);
    setSelectedUserForClean(null);
  };
  
  const handleSelectUserForClean = (userId: string) => {
    setSelectedUserForClean(userId);
  };
  
  const handleConfirmClean = async () => {
    if (!selectedUserForClean) {
      toast({
        title: "No user selected",
        description: "Please select a user whose recordings you want to delete",
        variant: "destructive"
      });
      return;
    }
    
    setIsDeleting(true);
    try {
      const success = await deleteUserRecordings(selectedUserForClean);
      
      if (success) {
        toast({
          title: "Recordings deleted",
          description: "All recordings for the selected user have been deleted"
        });
        
        loadDashboardData();
        setShowUserCleanDialog(false);
        setSelectedUserForClean(null);
      } else {
        throw new Error("Failed to delete recordings");
      }
    } catch (error) {
      console.error("Clean data error:", error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the recordings",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleLogout = () => {
    navigate("/");
    toast({ title: "Logged out successfully" });
  };
  
  // Convert bytes to MB for display
  const formatStorageSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
                  <Database className="h-10 w-10 text-blue-500 opacity-80" />
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
                    <div className="flex items-center text-xs mt-1">
                      <Database size={12} className="mr-1 text-blue-600" /> Supabase Storage
                    </div>
                  </div>
                  <HardDrive className="h-10 w-10 text-orange-500 opacity-80" />
                </div>
              </Card>
            </div>
            
            {/* Data management buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                onClick={handleExportData} 
                disabled={isExporting} 
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Download size={18} /> 
                {isExporting ? "Exporting..." : "Download All Data"}
              </Button>
              
              <Button 
                onClick={handleOpenCleanDialog} 
                variant="outline" 
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> 
                Clean Recording Data
              </Button>
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
      
      {/* User Clean Dialog */}
      <Dialog open={showUserCleanDialog} onOpenChange={setShowUserCleanDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clean User Recordings</DialogTitle>
            <DialogDescription>
              Select a user whose recording data you want to delete. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-6 max-h-80 overflow-y-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Code</th>
                  <th className="text-right py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.user_id} className="border-b">
                    <td className="py-2">{user.name}</td>
                    <td className="py-2">{user.unique_code}</td>
                    <td className="py-2 text-right">
                      <Button
                        variant={selectedUserForClean === user.user_id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSelectUserForClean(user.user_id)}
                      >
                        {selectedUserForClean === user.user_id ? "Selected" : "Select"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserCleanDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmClean}
              disabled={isDeleting || !selectedUserForClean}
            >
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminDashboard;
