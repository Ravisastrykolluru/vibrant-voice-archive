
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { findUserByCodeAndName, getUserLanguage, getRerecordingCount } from "@/lib/utils/supabase-utils";

const Login: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [uniqueCode, setUniqueCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [rerecordingCount, setRerecordingCount] = useState(0);

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
      const foundUser = await findUserByCodeAndName(uniqueCode, name);
      
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
      
      if (!language) {
        toast({
          title: "No language assigned",
          description: "Please contact the administrator",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Get re-recording count
      const count = await getRerecordingCount(foundUser.user_id, language);
      setRerecordingCount(count);
      
      // Set user data for session options
      setUser({...foundUser, language});
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${foundUser.name}!`
      });
      
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
    if (!user || !user.language) return;
    
    navigate(`/record/${user.user_id}/${user.language}`);
  };

  const handleRerecordSentences = () => {
    if (!user || !user.language) return;
    
    navigate(`/record/${user.user_id}/${user.language}?mode=rerecording`);
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
                <p className="font-medium">Welcome, {user.name}</p>
                <p className="text-sm text-gray-600 mt-1">Language: {user.language}</p>
                
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
    </Layout>
  );
};

export default Login;
