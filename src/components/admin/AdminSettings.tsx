
import React, { useState, useEffect } from "react";
import { LogIn, FolderPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getAdminPassword, setAdminPassword, getGoogleDriveConfig, saveGoogleDriveConfig, GoogleDriveConfig } from "@/lib/utils/storage";

interface AdminSettingsProps {
  onSettingsUpdated: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onSettingsUpdated }) => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig | null>(null);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderName, setFolderName] = useState("HoliBoli_Recordings");
  
  useEffect(() => {
    // Load existing Google Drive settings
    const config = getGoogleDriveConfig();
    setDriveConfig(config);
    if (config.email) {
      setGoogleEmail(config.email);
    }
  }, []);
  
  const handleChangePassword = () => {
    const adminPassword = getAdminPassword();
    
    if (currentPassword !== adminPassword) {
      toast({
        title: "Incorrect password",
        description: "The current password you entered is incorrect",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "The new password and confirmation don't match",
        variant: "destructive"
      });
      return;
    }
    
    if (newPassword.length < 4) {
      toast({
        title: "Password too short",
        description: "The new password must be at least 4 characters long",
        variant: "destructive"
      });
      return;
    }
    
    // Update the password
    setAdminPassword(newPassword);
    
    toast({
      title: "Password changed",
      description: "Your admin password has been updated successfully"
    });
    
    // Reset form
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onSettingsUpdated();
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
    
    // Simulated OAuth2 flow (in a real app, this would redirect to Google)
    toast({
      title: "Google Drive Connection",
      description: "Simulating OAuth2 connection..."
    });
    
    // Simulate a successful connection after a delay
    setTimeout(() => {
      // Create initial configuration without folder
      const config: GoogleDriveConfig = {
        email: googleEmail,
        folderId: "",
        connected: true
      };
      
      // Save the configuration
      saveGoogleDriveConfig(config);
      setDriveConfig(config);
      
      toast({
        title: "Connection successful",
        description: "Connected to Google Drive with " + googleEmail
      });
      
      // Show folder creation dialog
      setShowFolderDialog(true);
      
      onSettingsUpdated();
    }, 2000);
  };
  
  const handleCreateFolder = () => {
    if (!folderName.trim()) {
      toast({
        title: "Folder name required",
        description: "Please enter a name for your Google Drive folder",
        variant: "destructive"
      });
      return;
    }
    
    // Simulate creating a folder in Google Drive
    toast({
      title: "Creating folder",
      description: "Setting up your recordings folder in Google Drive..."
    });
    
    // Simulate successful folder creation after a delay
    setTimeout(() => {
      // Update configuration with new folder ID
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
      setShowFolderDialog(false);
      
      toast({
        title: "Folder created",
        description: `"${folderName}" folder has been created in your Google Drive`
      });
      
      onSettingsUpdated();
    }, 1500);
  };
  
  const handleDisconnectGoogleDrive = () => {
    if (window.confirm("Are you sure you want to disconnect from Google Drive? All automatic backups will stop.")) {
      // Reset the configuration
      const config: GoogleDriveConfig = {
        email: "",
        folderId: "",
        connected: false
      };
      
      saveGoogleDriveConfig(config);
      setDriveConfig(config);
      setGoogleEmail("");
      
      toast({
        title: "Disconnected",
        description: "Google Drive connection has been removed"
      });
      
      onSettingsUpdated();
    }
  };
  
  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Change Admin Password</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input 
              id="currentPassword" 
              type="password"
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              placeholder="Enter current password" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input 
              id="newPassword" 
              type="password"
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              placeholder="Enter new password" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input 
              id="confirmPassword" 
              type="password"
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="Confirm new password" 
            />
          </div>
          
          <Button onClick={handleChangePassword} className="mt-2">
            Change Password
          </Button>
        </div>
      </Card>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Google Drive Integration</h3>
        
        {driveConfig?.connected ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800 flex items-center">
                <LogIn className="mr-2" size={18} /> 
                Connected to Google Drive as <span className="font-semibold ml-1">{driveConfig.email}</span>
              </p>
              {driveConfig.folderName ? (
                <div className="mt-2">
                  <p className="text-sm text-green-700 flex items-center">
                    <FolderPlus size={16} className="mr-2" />
                    Recordings are being synced to folder: <span className="font-semibold ml-1">{driveConfig.folderName}</span>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    All new recordings will automatically be saved to this Google Drive folder
                  </p>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-sm text-yellow-600">
                    No folder selected. Please create a folder for recordings.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2" 
                    onClick={() => setShowFolderDialog(true)}
                  >
                    <FolderPlus size={16} className="mr-2" />
                    Create Folder
                  </Button>
                </div>
              )}
            </div>
            
            <Button 
              variant="destructive" 
              onClick={handleDisconnectGoogleDrive}
            >
              Disconnect Google Drive
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-500 mb-4">
              Connect your Google Drive to automatically back up all recordings.
            </p>
            
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
            
            <Button onClick={handleConnectGoogleDrive} className="mt-2">
              Connect Google Drive
            </Button>
          </div>
        )}
      </Card>

      {/* Folder Creation Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Google Drive Folder</DialogTitle>
            <DialogDescription>
              Create a folder in your Google Drive where all recordings will be automatically saved.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="HoliBoli_Recordings"
              />
              <p className="text-xs text-gray-500 mt-1">
                This folder will be created in your Google Drive and all recordings will be saved here
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSettings;
