
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAllUsers } from "@/lib/utils/supabase-utils";
import AdminUserDetails from "./AdminUserDetails";

interface AdminUserListProps {
  users: any[];
}

const AdminUserList: React.FC<AdminUserListProps> = ({ users: initialUsers }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [users, setUsers] = useState<any[]>(initialUsers || []);
  
  // Load users when component mounts or is refreshed
  useEffect(() => {
    const loadUsers = async () => {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    };
    
    loadUsers();
  }, [refreshTrigger]);
  
  // Listen for recording-updated events
  useEffect(() => {
    const handleRecordingUpdate = () => {
      // Force a refresh of the component
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener("recording-updated", handleRecordingUpdate);
    
    return () => {
      window.removeEventListener("recording-updated", handleRecordingUpdate);
    };
  }, []);
  
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id?.includes(searchTerm) ||
    user.unique_code?.includes(searchTerm.toUpperCase())
  );
  
  const handleViewUser = (user: any) => {
    setSelectedUser(user);
  };
  
  const handleBackToList = () => {
    setSelectedUser(null);
    // Refresh the list when returning from details view
    setRefreshTrigger(prev => prev + 1);
  };
  
  if (selectedUser) {
    return (
      <AdminUserDetails 
        user={selectedUser} 
        onBack={handleBackToList} 
      />
    );
  }
  
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Registered Users</h2>
        <div className="w-72">
          <Input
            placeholder="Search by name, ID or unique code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {filteredUsers.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unique Code</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id || user.user_id}>
                  <TableCell>
                    <Badge variant="outline">{user.unique_code || 'N/A'}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{user.user_id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.age}</TableCell>
                  <TableCell className="capitalize">{user.gender}</TableCell>
                  <TableCell>{user.language || 'Not assigned'}</TableCell>
                  <TableCell>{user.contact_number}</TableCell>
                  <TableCell>
                    {user.created_at ? 
                      new Date(user.created_at).toLocaleDateString() : 
                      'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleViewUser(user)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </Card>
  );
};

export default AdminUserList;
