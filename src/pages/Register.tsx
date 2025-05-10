
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
import { getLanguages, generateUserId, saveUser, UserData } from "@/lib/utils/storage";

const Register: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    contactNumber: "",
    language: ""
  });
  const languages = getLanguages();
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenderChange = (gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
  };

  const handleLanguageChange = (language: string) => {
    setFormData(prev => ({ ...prev, language }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Generate a unique 4-digit ID
    const userId = generateUserId();
    
    // Validate form data
    if (!formData.name || !formData.age || !formData.gender || !formData.contactNumber || !formData.language) {
      toast({
        title: "Please fill out all fields",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    // Create new user
    const newUser: UserData = {
      id: userId,
      name: formData.name,
      age: parseInt(formData.age),
      gender: formData.gender,
      contactNumber: formData.contactNumber,
      createdAt: new Date().toISOString()
    };
    
    // Save user to storage
    saveUser(newUser);
    
    // Show success message with the user ID
    toast({
      title: "Registration Successful",
      description: `Your user ID is ${userId}. Please save this for future login.`
    });
    
    // Navigate to recording page
    setTimeout(() => {
      navigate(`/record/${userId}/${formData.language}`);
      setIsLoading(false);
    }, 1500);
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
            <h2 className="text-2xl font-bold">New User Registration</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Enter your full name" 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input 
                id="age" 
                name="age"
                type="number" 
                value={formData.age} 
                onChange={handleChange} 
                placeholder="Enter your age" 
                min="1"
                max="120"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Gender</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={formData.gender === "male" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => handleGenderChange("male")}
                >
                  Male
                </Button>
                <Button
                  type="button"
                  variant={formData.gender === "female" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => handleGenderChange("female")}
                >
                  Female
                </Button>
                <Button
                  type="button"
                  variant={formData.gender === "other" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => handleGenderChange("other")}
                >
                  Other
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input 
                id="contactNumber" 
                name="contactNumber" 
                value={formData.contactNumber} 
                onChange={handleChange} 
                placeholder="Enter your contact number" 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Language</Label>
              <Select onValueChange={handleLanguageChange}>
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
              {isLoading ? "Processing..." : "Register & Start Recording"}
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default Register;
