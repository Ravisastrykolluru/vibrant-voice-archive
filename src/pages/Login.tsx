import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { authenticateUser, getUserNotifications, getLanguages, getUserLanguage } from "@/lib/utils/supabase-utils";
import { supabase } from "@/integrations/supabase/client";

const Login: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState("");
  const [uniqueCode, setUniqueCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [isLanguageRequired, setIsLanguageRequired] = useState(true);
  
  // Effect to load languages and check authentication status
  useEffect(() => {
    const loadLanguages = async () => {
      const langs = await getLanguages();
      setLanguages(langs);
    };
    
    loadLanguages();
    
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Get user metadata to extract unique_code
        const unique_code = data.session.user.user_metadata?.unique_code;
        if (unique_code) {
          // Get user's preferred language
          const language = await getUserLanguage(unique_code);
            
          if (language) {
            navigate(`/record/${unique_code}/${language}`);
          } else {
            toast({
              title: "Welcome back!",
              description: "Please select a language to continue recording"
            });
          }
        }
      }
    };
    
    checkAuth();
  }, [navigate, toast]);

  // Add the missing handleLanguageChange function
  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileNumber || !uniqueCode) {
      toast({
        title: "Please enter all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (isLanguageRequired && !selectedLanguage) {
      toast({
        title: "Please select your language",
        description: "Language selection is required for login",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First clean up any existing auth state
      await supabase.auth.signOut();
      
      // Try to authenticate
      const result = await authenticateUser(mobileNumber, uniqueCode, selectedLanguage);
      
      if (!result.success) {
        if (result.correctLanguage) {
          toast({
            title: "Language Mismatch",
            description: `Your registered language is ${result.correctLanguage}. Please select that language.`,
            variant: "destructive"
          });
          setSelectedLanguage(result.correctLanguage);
        } else {
          toast({
            title: "Authentication Failed",
            description: result.error || "Invalid credentials",
            variant: "destructive"
          });
        }
        setIsLoading(false);
        return;
      }
      
      // Get user profile
      const { profile, language } = result;
      
      // Load notifications
      await getUserNotifications(profile.unique_code);
      
      // Use the language from the authentication result or the selected language
      const userLanguage = language || selectedLanguage;
      
      // Navigate to recording page with the language
      setTimeout(() => {
        navigate(`/record/${profile.unique_code}/${userLanguage}?mode=regular`);
        setIsLoading(false);
      }, 500);
      
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "There was an error logging in. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
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
            <h2 className="text-2xl font-bold">Existing User Login</h2>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input 
                id="mobileNumber" 
                value={mobileNumber} 
                onChange={(e) => setMobileNumber(e.target.value)} 
                placeholder="Enter your mobile number"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="uniqueCode">Unique Code</Label>
              <Input 
                id="uniqueCode" 
                value={uniqueCode} 
                onChange={(e) => setUniqueCode(e.target.value.toUpperCase())} 
                placeholder="Enter your unique code" 
                maxLength={5}
                required
                className="uppercase"
              />
              <p className="text-xs text-gray-500">
                Enter the 5-digit code that was provided during registration
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Language (Required)</Label>
              <Select onValueChange={handleLanguageChange} value={selectedLanguage} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your language" />
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
              disabled={isLoading || (!mobileNumber || !uniqueCode || !selectedLanguage)}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                  Register Here
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;
