
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
import { authenticateUser, getUserNotifications, getLanguages } from "@/lib/utils/supabase-utils";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const Login: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [uniqueCode, setUniqueCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [languages, setLanguages] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  
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
          navigate(`/record/${unique_code}/${selectedLanguage}`);
        }
      }
    };
    
    checkAuth();
  }, [navigate, selectedLanguage]);

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uniqueCode) {
      toast({
        title: "Please enter your unique code",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedLanguage) {
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
      
      // Try to authenticate with just unique code and language (no mobile number required)
      const result = await authenticateUser("", uniqueCode, selectedLanguage);
      
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
    <Layout showBackground={false}>
      {/* Add a subtle colorful background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500 opacity-10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md p-6 shadow-lg">
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
            
            <form onSubmit={handleLogin} className="space-y-4">
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
                className="w-full mt-6 bg-black hover:bg-gray-800 text-white"
                disabled={isLoading || !uniqueCode || !selectedLanguage}
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
        </motion.div>
      </div>
    </Layout>
  );
};

export default Login;
