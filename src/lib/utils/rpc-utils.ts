
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
export const authenticateUser = async (mobileNumber: string, uniqueCode: string, language: string = ""): Promise<any> => {
  try {
    // Modified to allow authentication with just uniqueCode and language
    const whereClause = mobileNumber 
      ? { unique_code: uniqueCode, contact_number: mobileNumber }
      : { unique_code: uniqueCode };
    
    // First, check if the user exists with the given unique code (and mobile number if provided)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .match(whereClause)
      .single();
      
    if (userError || !userData) {
      console.error("User data retrieval error:", userError);
      return { success: false, error: "Invalid credentials. Please check your unique code." };
    }
    
    // If language is provided, verify it matches the user's preference
    if (language) {
      const { data: langData } = await supabase
        .from('user_languages')
        .select('language')
        .eq('unique_code', uniqueCode)
        .single();
        
      if (langData && langData.language !== language) {
        return { 
          success: false, 
          error: "Selected language doesn't match your registered language preference.",
          correctLanguage: langData.language
        };
      }
    }
    
    // Formulate email and password using the specified format
    // For backward compatibility, if mobile number is provided use it, otherwise use a placeholder with the unique code
    const email = mobileNumber ? `${mobileNumber}@spl.com` : `${uniqueCode}@spl.com`;
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
    
    return { 
      success: true, 
      user: data.user, 
      session: data.session, 
      profile: userData,
      language: language || (await getUserLanguage(uniqueCode))
    };
  } catch (error) {
    console.error("Error in authenticateUser:", error);
    return { success: false, error: "Authentication failed" };
  }
};

// Helper function to get user's language preference
export const getUserLanguage = async (uniqueCode: string): Promise<string | null> => {
  try {
    const { data } = await supabase
      .from('user_languages')
      .select('language')
      .eq('unique_code', uniqueCode)
      .single();
      
    return data?.language || null;
  } catch (error) {
    console.error("Error getting user language:", error);
    return null;
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
