
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Cloud, Folder, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  setAdminPassword, 
  getAdminPassword, 
  getGoogleDriveConfig, 
  saveGoogleDriveConfig, 
  GoogleDriveConfig,
  getStoragePreference,
  setStoragePreference,
  StoragePreference
} from "@/lib/utils/storage";

interface AdminSettingsProps {
  onSettingsUpdated: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onSettingsUpdated }) => {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [folderName, setFolderName] = useState("Speech_Recordings");
  const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [storageType, setStorageType] = useState<"local" | "google-drive">("local");
  const [autoSync, setAutoSync] = useState(false);
  
  useEffect(() => {
    // Load storage preference
    const prefs = getStoragePreference();
    setStorageType(prefs.type);
    setAutoSync(prefs.autoSync);
    
    // Load Google Drive config
    const config = getGoogleDriveConfig();
    setDriveConfig(config);
    if (config.email) {
      setGoogleEmail(config.email);
    }
    if (config.folderName) {
      setFolderName(config.folderName);
    }
  }, []);
  
  const handleChangePassword = () => {
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical",
        variant: "destructive"
      });
      return;
    }
    
    if (password.length < 4) {
      toast({
        title: "Password too short",
        description: "Password should be at least 4 characters long",
        variant: "destructive"
      });
      return;
    }
    
    setAdminPassword(password);
    
    toast({
      title: "Password updated",
      description: "The administrator password has been changed"
    });
    
    setPassword("");
    setConfirmPassword("");
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
    
    if (!folderName.trim()) {
      toast({
        title: "Folder name required",
        description: "Please enter a name for your Google Drive folder",
        variant: "destructive"
      });
      return;
    }
    
    // Show connecting status
    toast({
      title: "Google Drive Connection",
      description: "Connecting to Google Drive..."
    });
    
    // Simulate Google OAuth login with a delay
    setIsLoading(true);
    setTimeout(() => {
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
      
      setIsLoading(false);
      
      toast({
        title: "Connection successful",
        description: `Connected to Google Drive with ${googleEmail} and created folder "${folderName}"`
      });
      
      // Notify parent component of settings update
      onSettingsUpdated();
    }, 2000);
  };
  
  const handleDisconnectGoogleDrive = () => {
    const updatedConfig: GoogleDriveConfig = {
      email: "",
      folderId: "",
      connected: false,
      folderName: ""
    };
    
    saveGoogleDriveConfig(updatedConfig);
    setDriveConfig(updatedConfig);
    
    // If we're using Google Drive storage, switch back to local
    if (storageType === "google-drive") {
      setStorageType("local");
      setStoragePreference({ type: "local", autoSync: false });
    }
    
    toast({
      title: "Disconnected",
      description: "You have disconnected from Google Drive"
    });
    
    // Notify parent component of settings update
    onSettingsUpdated();
  };
  
  const handleStoragePreferenceChange = () => {
    // If switching to Google Drive but it's not connected
    if (storageType === "google-drive" && (!driveConfig || !driveConfig.connected)) {
      toast({
        title: "Google Drive not connected",
        description: "Please connect to Google Drive first",
        variant: "destructive"
      });
      setStorageType("local");
      return;
    }
    
    // Save storage preferences
    setStoragePreference({
      type: storageType,
      autoSync: autoSync
    });
    
    toast({
      title: "Storage settings updated",
      description: `Using ${storageType === "local" ? "local storage" : "Google Drive"} for recordings`
    });
    
    // Notify parent component of settings update
    onSettingsUpdated();
  };
  
  return (
    <Tabs defaultValue="security" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="storage">Storage</TabsTrigger>
        <TabsTrigger value="backup">Backup & Sync</TabsTrigger>
      </TabsList>
      
      <TabsContent value="security" className="space-y-4 mt-4">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Change Admin Password</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input 
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            
            <Button onClick={handleChangePassword}>Update Password</Button>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Default password is "admin"
          </p>
        </Card>
      </TabsContent>
      
      <TabsContent value="storage" className="space-y-4 mt-4">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Storage Preferences</h3>
          
          <div className="space-y-6">
            <RadioGroup 
              value={storageType} 
              onValueChange={(value: "local" | "google-drive") => setStorageType(value)}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="local" id="local-storage" />
                <Label htmlFor="local-storage" className="flex items-center cursor-pointer">
                  <Folder className="h-5 w-5 mr-2 text-blue-500" />
                  <div>
                    <div className="font-medium">Local Storage</div>
                    <div className="text-sm text-gray-500">Store recordings in browser's local storage</div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="google-drive" 
                  id="google-drive-storage" 
                  disabled={!driveConfig?.connected}
                />
                <Label htmlFor="google-drive-storage" className={`flex items-center ${!driveConfig?.connected ? 'opacity-50' : 'cursor-pointer'}`}>
                  <Cloud className="h-5 w-5 mr-2 text-green-500" />
                  <div>
                    <div className="font-medium">Google Drive</div>
                    <div className="text-sm text-gray-500">
                      {driveConfig?.connected 
                        ? `Connected as ${driveConfig.email}`
                        : "Not connected yet"}
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
            
            {storageType === "google-drive" && driveConfig?.connected && (
              <div className="flex items-center space-x-2">
                <Switch 
                  id="auto-sync"
                  checked={autoSync}
                  onCheckedChange={setAutoSync}
                />
                <Label htmlFor="auto-sync">Auto-sync existing recordings</Label>
              </div>
            )}
            
            <Button onClick={handleStoragePreferenceChange}>Save Storage Settings</Button>
          </div>
        </Card>
      </TabsContent>
      
      <TabsContent value="backup" className="space-y-4 mt-4">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Google Drive Integration</h3>
          
          {!driveConfig?.connected ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google-email">Google Email</Label>
                <Input 
                  id="google-email"
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="folder-name">Drive Folder Name</Label>
                <Input 
                  id="folder-name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Speech_Recordings"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This folder will be created in your Google Drive to store all recordings
                </p>
              </div>
              
              <Button 
                onClick={handleConnectGoogleDrive} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Cloud size={16} />
                {isLoading ? "Connecting..." : "Connect to Google Drive"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  <Cloud className="h-5 w-5 text-green-600 mr-2" />
                  <div className="flex-1">
                    <p className="text-green-800 font-medium">Connected to Google Drive</p>
                    <p className="text-green-700 text-sm">{driveConfig.email}</p>
                    <p className="text-green-700 text-sm">Folder: {driveConfig.folderName}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleDisconnectGoogleDrive}
                >
                  Disconnect
                </Button>
                
                <Button className="flex items-center gap-2">
                  <Archive size={16} />
                  Backup All Recordings
                </Button>
              </div>
            </div>
          )}
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default AdminSettings;
