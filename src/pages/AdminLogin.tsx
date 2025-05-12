
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getAdminPassword } from "@/lib/utils/supabase-utils";

const AdminLogin: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate password
      const correctPassword = await getAdminPassword();
      
      if (password === correctPassword) {
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
    } catch (error) {
      console.error("Admin login error:", error);
      toast({
        title: "Login failed",
        description: "An error occurred during login",
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
            <div className="flex items-center text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              <p>Storage is now handled by Supabase. All recordings will be automatically saved to Supabase Storage.</p>
            </div>
          </div>
          
          <p className="text-sm mt-6 text-center text-gray-500">
            Default password is "admin"
          </p>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminLogin;
