
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Users, HardDrive, Upload, Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getUsers, getLanguages, getTotalStorageUsed, deleteLanguage, Language } from "@/lib/utils/storage";
import AdminUserList from "@/components/admin/AdminUserList";
import AdminLanguageManager from "@/components/admin/AdminLanguageManager";
import AdminSettings from "@/components/admin/AdminSettings";

const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<any[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  
  useEffect(() => {
    // Load dashboard data
    loadDashboardData();
  }, []);
  
  const loadDashboardData = () => {
    const userData = getUsers();
    setUsers(userData);
    
    const languageData = getLanguages();
    setLanguages(languageData);
    
    const storage = getTotalStorageUsed();
    setStorageUsed(storage);
  };
  
  const handleAddLanguage = () => {
    // Will be implemented in AdminLanguageManager
  };
  
  const handleDeleteLanguage = (id: string) => {
    if (window.confirm("Are you sure you want to delete this language? This action cannot be undone.")) {
      deleteLanguage(id);
      toast({
        title: "Language deleted",
        description: "The language has been removed from the system"
      });
      loadDashboardData();
    }
  };
  
  const handleLogout = () => {
    navigate("/");
    toast({ title: "Logged out successfully" });
  };
  
  // Convert bytes to GB for display
  const formatStorageSize = (bytes: number): string => {
    const gigabytes = bytes / (1024 * 1024 * 1024);
    return gigabytes.toFixed(2) + " GB";
  };
  
  return (
    <Layout showBackground={false}>
      <div className="min-h-screen flex flex-col">
        <header className="bg-black text-white shadow py-4 px-6">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            
            <Button variant="ghost" onClick={handleLogout} className="text-white">
              <LogOut size={18} className="mr-2" /> Logout
            </Button>
          </div>
        </header>
        
        <div className="flex-1 p-4 md:p-8 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Total Users</p>
                    <p className="text-3xl font-bold">{users.length}</p>
                  </div>
                  <Users className="h-10 w-10 text-holi-purple opacity-80" />
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Languages</p>
                    <p className="text-3xl font-bold">{languages.length}</p>
                  </div>
                  <Upload className="h-10 w-10 text-holi-blue opacity-80" />
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500">Storage Used</p>
                    <p className="text-3xl font-bold">{formatStorageSize(storageUsed)}</p>
                  </div>
                  <HardDrive className="h-10 w-10 text-holi-orange opacity-80" />
                </div>
              </Card>
            </div>
            
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="languages">Languages</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="users" className="mt-6">
                <AdminUserList users={users} />
              </TabsContent>
              
              <TabsContent value="languages" className="mt-6">
                <AdminLanguageManager 
                  languages={languages}
                  onDelete={handleDeleteLanguage}
                  onLanguageAdded={loadDashboardData}
                />
              </TabsContent>
              
              <TabsContent value="settings" className="mt-6">
                <AdminSettings onSettingsUpdated={loadDashboardData} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
