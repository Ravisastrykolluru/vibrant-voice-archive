
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Cloud, LogIn } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getAdminPassword, getGoogleDriveConfig, saveGoogleDriveConfig, GoogleDriveConfig } from "@/lib/utils/storage";

const AdminLogin: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleDriveDialog, setShowGoogleDriveDialog] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [folderName, setFolderName] = useState("Speech_Recordings");
  const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig | null>(null);

  // Check if Google Drive is connected
  useEffect(() => {
    const config = getGoogleDriveConfig();
    setDriveConfig(config);
    if (config.email) {
      setGoogleEmail(config.email);
    }
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate password
    const correctPassword = getAdminPassword();
    
    if (password === correctPassword) {
      const driveConfig = getGoogleDriveConfig();
      
      // If Google Drive is not connected, show the dialog
      if (!driveConfig.connected) {
        toast({
          title: "Google Drive Required",
          description: "Please connect to Google Drive to proceed",
        });
        setShowGoogleDriveDialog(true);
        setIsLoading(false);
        return;
      }
      
      toast({
        title: "Login successful",
        description: "Welcome, Administrator!"
      });
      
      setTimeout(() => {
        navigate("/admin/dashboard");
        setIsLoading(false);
      }, 1000);
    } else {
      toast({
        title: "Invalid password",
        description: "Please try again",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleConnectGoogleDrive = () => {
    if (!googleEmail) {
      toast({
        title: "Email required",
        description: "Please enter your Google email address",
        variant: "destructive"
      });
      return;
    }
    
    // Simulated OAuth2 flow
    toast({
      title: "Google Drive Connection",
      description: "Connecting to Google Drive..."
    });
    
    // Simulate a successful connection after a delay
    setTimeout(() => {
      // Create folder in Google Drive
      if (!folderName.trim()) {
        toast({
          title: "Folder name required",
          description: "Please enter a name for your Google Drive folder",
          variant: "destructive"
        });
        return;
      }
      
      // Update configuration with new folder ID and connection status
      const updatedConfig: GoogleDriveConfig = {
        email: googleEmail,
        folderId: "folder_" + Date.now(), // In a real app, this would be the actual folder ID
        connected: true,
        folderName: folderName
      };
      
      // Save the updated configuration
      saveGoogleDriveConfig(updatedConfig);
      setDriveConfig(updatedConfig);
      
      // Close the dialog
      setShowGoogleDriveDialog(false);
      
      toast({
        title: "Connection successful",
        description: `Connected to Google Drive with ${googleEmail} and created folder "${folderName}"`
      });
      
      // Auto-login after connecting
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1000);
    }, 2000);
  };
  
  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md p-6 shadow-lg animate-fade-in">
          <div className="mb-6 flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2" 
              onClick={() => navigate("/")}
            >
              <ArrowLeft size={20} />
            </Button>
            <h2 className="text-2xl font-bold">Admin Login</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input 
                id="password" 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter admin password" 
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Google Drive Status</h3>
              {driveConfig?.connected ? (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Connected</span>
              ) : (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Required</span>
              )}
            </div>
            
            {driveConfig?.connected ? (
              <p className="text-sm text-gray-600">
                Connected as {driveConfig.email} to folder "{driveConfig.folderName}"
              </p>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => setShowGoogleDriveDialog(true)}
              >
                <Cloud size={16} /> Connect Google Drive
              </Button>
            )}
          </div>
          
          <p className="text-sm mt-6 text-center text-gray-500">
            Default password is "admin"
          </p>
        </Card>

        {/* Google Drive Connection Dialog */}
        <Dialog open={showGoogleDriveDialog} onOpenChange={setShowGoogleDriveDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect to Google Drive</DialogTitle>
              <DialogDescription>
                Admin access requires Google Drive connection for storing and managing speech recordings.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleEmail">Google Email</Label>
                <Input 
                  id="googleEmail"
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="folderName">Storage Folder Name</Label>
                <Input
                  id="folderName"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Speech_Recordings"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This folder will be created in your Google Drive to store all recordings
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGoogleDriveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConnectGoogleDrive} className="flex items-center gap-2">
                <LogIn size={16} /> Connect & Login
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminLogin;
