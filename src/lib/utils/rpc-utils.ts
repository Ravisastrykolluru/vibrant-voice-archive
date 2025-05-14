import { supabase } from "@/integrations/supabase/client";

// Notifications Functions
export const getUserNotifications = async (uniqueCode: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('unique_code', uniqueCode)
      .order('created_at', { ascending: false });
    
    if (error || !data) {
      console.error("Error getting notifications:", error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Error in getUserNotifications:", error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
      
    if (error) {
      console.error("Error marking notification as read:", error);
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

export const addNotification = async (uniqueCode: string, message: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({ 
        unique_code: uniqueCode, 
        message: message,
        read: false
      });
      
    if (error) {
      console.error("Error adding notification:", error);
    }
  } catch (error) {
    console.error("Error adding notification:", error);
  }
};

// User Password Functions
export const updateUserPassword = async (uniqueCode: string, password: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ password: password })
      .eq('unique_code', uniqueCode);
    
    if (error) {
      console.error("Error updating user password:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateUserPassword:", error);
    return false;
  }
};

// Authentication Functions
export const authenticateUser = async (mobileNumber: string, uniqueCode: string): Promise<any> => {
  try {
    // Formulate email and password using the specified format
    const email = `${mobileNumber}@spl.com`;
    const password = `${uniqueCode}@spl`;
    
    console.log("Attempting authentication with:", { email, password });
    
    // Try to sign in with Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error("Authentication error:", error);
      return { success: false, error: error.message };
    }
    
    // Get user profile from users table using unique_code
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('unique_code', uniqueCode)
      .single();
      
    if (userError || !userData) {
      console.error("User data retrieval error:", userError);
      return { success: false, error: "User profile not found" };
    }
    
    return { success: true, user: data.user, session: data.session, profile: userData };
  } catch (error) {
    console.error("Error in authenticateUser:", error);
    return { success: false, error: "Authentication failed" };
  }
};

// Register user with Supabase Auth
export const registerUserAuth = async (userData: {
  mobileNumber: string, 
  uniqueCode: string,
  name: string
}): Promise<any> => {
  try {
    const email = `${userData.mobileNumber}@spl.com`;
    const password = `${userData.uniqueCode}@spl`;
    
    // Register the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          unique_code: userData.uniqueCode
        }
      }
    });
    
    if (error) {
      console.error("Registration error:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error("Error in registerUserAuth:", error);
    return { success: false, error: "Registration failed" };
  }
};

// Function to send notification for rerecording
export const sendRerecordingNotification = async (uniqueCode: string, sentence: string): Promise<void> => {
  const message = `You need to re-record the following sentence: "${sentence.substring(0, 50)}${sentence.length > 50 ? '...' : ''}"`;
  await addNotification(uniqueCode, message);
};
