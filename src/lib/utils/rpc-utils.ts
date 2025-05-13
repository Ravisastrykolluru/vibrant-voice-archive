
import { supabase } from "@/integrations/supabase/client";

// Notifications Functions
export const getUserNotifications = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_notifications', { p_user_id: userId } as any);
    
    if (error || !data) {
      console.error("Error getting notifications:", error);
      return [];
    }
    
    return data as any[];
  } catch (error) {
    console.error("Error in getUserNotifications:", error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .rpc('mark_notification_read', { p_notification_id: notificationId } as any);
      
    if (error) {
      console.error("Error marking notification as read:", error);
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

export const addNotification = async (userId: string, message: string): Promise<void> => {
  try {
    const { error } = await supabase
      .rpc('add_notification', { p_user_id: userId, p_message: message } as any);
      
    if (error) {
      console.error("Error adding notification:", error);
    }
  } catch (error) {
    console.error("Error adding notification:", error);
  }
};

// User Password Functions
export const updateUserPassword = async (userId: string, password: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .rpc('update_user_password', { p_user_id: userId, p_password: password } as any);
    
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
export const authenticateUser = async (mobileNumber: string, userId: string): Promise<any> => {
  try {
    // Formulate email and password using the specified format
    const email = `${mobileNumber}@spl.com`;
    const password = `${userId}@spl`;
    
    // Try to sign in with Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error("Authentication error:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, user: data.user, session: data.session };
  } catch (error) {
    console.error("Error in authenticateUser:", error);
    return { success: false, error: "Authentication failed" };
  }
};

// Register user with Supabase Auth
export const registerUserAuth = async (userData: {
  mobileNumber: string, 
  userId: string,
  name: string
}): Promise<any> => {
  try {
    const email = `${userData.mobileNumber}@spl.com`;
    const password = `${userData.userId}@spl`;
    
    // Register the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          user_id: userData.userId
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
export const sendRerecordingNotification = async (userId: string, sentence: string): Promise<void> => {
  const message = `You need to re-record the following sentence: "${sentence.substring(0, 50)}${sentence.length > 50 ? '...' : ''}"`;
  await addNotification(userId, message);
};
