
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { findUserById, getLanguages } from "@/lib/utils/storage";

const Login: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [language, setLanguage] = useState("");
  const languages = getLanguages();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validate user ID and language
    if (!userId || !language) {
      toast({
        title: "Please enter both your user ID and select a language",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    // Check if user exists
    const user = findUserById(userId);
    
    if (!user) {
      toast({
        title: "User not found",
        description: "Please check your user ID or register as a new user",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    // Navigate to recording page
    toast({
      title: "Login Successful",
      description: `Welcome back, ${user.name}!`
    });
    
    setTimeout(() => {
      navigate(`/record/${userId}/${language}`);
      setIsLoading(false);
    }, 1000);
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
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input 
                id="userId" 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)} 
                placeholder="Enter your 4-digit user ID" 
                maxLength={4}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Language</Label>
              <Select onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.length > 0 ? (
                    languages.map(lang => (
                      <SelectItem key={lang.id} value={lang.name}>
                        {lang.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-languages" disabled>
                      No languages available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              {languages.length === 0 && (
                <p className="text-sm text-yellow-600 mt-1">
                  No languages available. Please contact the administrator.
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={isLoading || languages.length === 0}
            >
              {isLoading ? "Logging in..." : "Start Recording Session"}
            </Button>
          </form>
          
          <p className="text-sm text-center mt-6 text-gray-500">
            Don't have a user ID?{" "}
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
