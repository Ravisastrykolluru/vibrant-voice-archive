
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserHeaderProps {
  userId: string;
}

const UserHeader: React.FC<UserHeaderProps> = ({ userId }) => {
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name')
          .eq('unique_code', userId)
          .single();
        
        if (error) {
          console.error("Error fetching user details:", error);
        } else if (data) {
          setUserName(data.name);
        }
      } catch (error) {
        console.error("Failed to fetch user details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserDetails();
  }, [userId]);

  if (loading) {
    return <div className="h-12 animate-pulse bg-gray-200 rounded-md"></div>;
  }

  return (
    <div className="flex items-center bg-gray-100 px-4 py-2 rounded-lg shadow-sm">
      <div>
        <div className="text-sm text-gray-500">User:</div>
        <div className="font-medium">{userName || "Unknown"}</div>
      </div>
      <div className="ml-6">
        <div className="text-sm text-gray-500">ID:</div>
        <div className="font-medium">{userId}</div>
      </div>
    </div>
  );
};

export default UserHeader;
