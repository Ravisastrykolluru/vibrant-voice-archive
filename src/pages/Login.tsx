
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { authenticateUser, getUserNotifications, getLanguages } from "@/lib/utils/supabase-utils";
import { supabase } from "@/integrations/supabase/client";

const Login: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState("");
  const [uniqueCode, setUniqueCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  
  React.useEffect(() => {
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
          const { data: profileData } = await supabase
            .from('user_languages')
            .select('language')
            .eq('unique_code', unique_code)
            .single();
            
          if (profileData?.language) {
            navigate(`/record/${unique_code}/${profileData.language}`);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileNumber || !uniqueCode) {
      toast({
        title: "Please enter all fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First clean up any existing auth state
      await supabase.auth.signOut();
      
      // Try to authenticate
      const result = await authenticateUser(mobileNumber, uniqueCode);
      
      if (!result.success) {
        toast({
          title: "Authentication Failed",
          description: result.error || "Invalid credentials",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Get user profile
      const { profile } = result;
      
      // Load notifications
      await getUserNotifications(profile.unique_code);
      
      // If user profile was found, check if a language is selected
      if (!selectedLanguage) {
        // Get user's preferred language
        const { data: langData } = await supabase
          .from('user_languages')
          .select('language')
          .eq('unique_code', profile.unique_code)
          .single();
          
        if (langData?.language) {
          setSelectedLanguage(langData.language);
          
          // Navigate to recording page with user's preferred language
          setTimeout(() => {
            navigate(`/record/${profile.unique_code}/${langData.language}`);
            setIsLoading(false);
          }, 500);
          return;
        } else {
          // If no language preference found, show language selection
          toast({
            title: "Please Select a Language",
            description: "Please choose a language to continue recording"
          });
          setIsLoading(false);
          return;
        }
      }
      
      // If a language is selected, navigate to recording page
      setTimeout(() => {
        navigate(`/record/${profile.unique_code}/${selectedLanguage}`);
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

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
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
              <Label>Language (Optional)</Label>
              <Select onValueChange={handleLanguageChange} value={selectedLanguage}>
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
              disabled={isLoading || (!mobileNumber || !uniqueCode)}
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
