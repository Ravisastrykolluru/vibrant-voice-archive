
import { supabase } from "@/integrations/supabase/client";

// Notifications Functions
export const getUserNotifications = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_user_notifications', { p_user_id: userId }) as { data: any[], error: any };
    
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
    await supabase
      .rpc('mark_notification_read', { p_notification_id: notificationId }) as { data: any, error: any };
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

export const addNotification = async (userId: string, message: string): Promise<void> => {
  try {
    await supabase
      .rpc('add_notification', { p_user_id: userId, p_message: message }) as { data: any, error: any };
  } catch (error) {
    console.error("Error adding notification:", error);
  }
};

// User Password Functions
export const updateUserPassword = async (userId: string, password: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .rpc('update_user_password', { p_user_id: userId, p_password: password }) as { data: any, error: any };
    
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
