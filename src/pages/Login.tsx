
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  findUserByCodeAndName, 
  getUserLanguage, 
  getRerecordingCount, 
  getUserNotifications,
  markNotificationAsRead
} from "@/lib/utils/supabase-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

const Login: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [uniqueCode, setUniqueCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [rerecordingCount, setRerecordingCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleFindUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate inputs
    if (!name || !uniqueCode) {
      toast({
        title: "Please enter both your name and unique code",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    try {
      // Find user by code and name
      const foundUser = await findUserByCodeAndName(uniqueCode.toUpperCase(), name);
      
      if (!foundUser) {
        toast({
          title: "User not found",
          description: "Please check your name and unique code or register as a new user",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Get user's language
      const language = await getUserLanguage(foundUser.user_id);
      
      // Get re-recording count (if language is available)
      let count = 0;
      if (language) {
        count = await getRerecordingCount(foundUser.user_id, language);
        setRerecordingCount(count);
      }
      
      // Get user notifications
      const userNotifications = await getUserNotifications(foundUser.user_id);
      setNotifications(userNotifications);
      
      // Set user data for session options
      setUser({...foundUser, language});
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${foundUser.name}!`
      });
      
      // Show notifications if there are any unread
      if (userNotifications.filter(n => !n.read).length > 0) {
        setShowNotifications(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleContinueRecording = () => {
    if (!user) return;
    
    if (user.language) {
      navigate(`/record/${user.user_id}/${user.language}`);
    } else {
      // If the user doesn't have a language assigned, redirect to main page
      // and let them know they need to select a language
      toast({
        title: "No language assigned",
        description: "Please contact the administrator to assign a language",
        variant: "destructive"
      });
      navigate("/");
    }
  };

  const handleRerecordSentences = () => {
    if (!user || !user.language) return;
    
    navigate(`/record/${user.user_id}/${user.language}?mode=rerecording`);
  };

  const handleCloseNotifications = async () => {
    // Mark all notifications as read
    if (user && notifications.length > 0) {
      for (const notification of notifications.filter(n => !n.read)) {
        await markNotificationAsRead(notification.id);
      }
    }
    
    setShowNotifications(false);
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
            <h2 className="text-2xl font-bold">Returning User Login</h2>
          </div>
          
          {!user ? (
            <form onSubmit={handleFindUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter your full name" 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="uniqueCode">Unique Code</Label>
                <Input 
                  id="uniqueCode" 
                  value={uniqueCode} 
                  onChange={(e) => setUniqueCode(e.target.value.toUpperCase())} 
                  placeholder="Enter your 5-character code" 
                  maxLength={5}
                  className="uppercase"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify Identity"}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-md">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Welcome, {user.name}</p>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center" 
                      onClick={() => setShowNotifications(true)}
                    >
                      <Bell size={16} className="mr-1 text-red-500" />
                      {notifications.filter(n => !n.read).length} Message{notifications.filter(n => !n.read).length !== 1 && 's'}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">ID: {user.user_id}</p>
                <p className="text-sm text-gray-600">Code: {user.unique_code}</p>
                {user.language && (
                  <p className="text-sm text-gray-600">Language: {user.language}</p>
                )}
                
                {rerecordingCount > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-700">
                      You have {rerecordingCount} sentence(s) that need to be re-recorded.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={handleContinueRecording}
                >
                  Continue Recording Session
                </Button>
                
                {rerecordingCount > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleRerecordSentences}
                  >
                    Re-record Flagged Sentences ({rerecordingCount})
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <p className="text-sm text-center mt-6 text-gray-500">
            Don't have a unique code?{" "}
            <Button variant="link" className="p-0" onClick={() => navigate("/register")}>
              Register here
            </Button>
          </p>
        </Card>
      </div>

      <Dialog open={showNotifications} onOpenChange={handleCloseNotifications}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>
              Messages from the administrator
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4 max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 border rounded-md ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
                >
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No notifications</p>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCloseNotifications}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Login;
