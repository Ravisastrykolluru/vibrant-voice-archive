
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { getUserNotifications, markNotificationAsRead, addNotification, updateUserPassword } from "./rpc-utils";

// Re-export notification and user password functions
export { getUserNotifications, markNotificationAsRead, addNotification, updateUserPassword };

// Generate a unique 5-digit alphanumeric code
export const generateUniqueCode = async (): Promise<string> => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code: string;
  let isUnique = false;

  while (!isUnique) {
    // Generate a 5-character code
    code = Array(5)
      .fill(0)
      .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join('');
    
    // Check if code is already in use
    const { data } = await supabase
      .from('users')
      .select('user_id')
      .eq('unique_code', code);
      
    isUnique = !data || data.length === 0;
    
    if (isUnique) return code;
  }
  
  return '';  // This should never happen but TypeScript needs a return
};

// User Functions
export const saveUser = async (userData: {
  name: string;
  age: number;
  gender: string;
  contactNumber: string;
  language: string;
}): Promise<{ userId: string; uniqueCode: string } | null> => {
  const uniqueCode = await generateUniqueCode();
  const userId = `user_${Date.now().toString().slice(-6)}`;
  
  const { error: userError } = await supabase.from('users').insert({
    user_id: userId,
    name: userData.name,
    age: userData.age,
    gender: userData.gender,
    contact_number: userData.contactNumber,
    unique_code: uniqueCode,
    created_at: new Date().toISOString() // Ensure creation date is set
  });
  
  if (userError) {
    console.error('Error saving user:', userError);
    return null;
  }
  
  // Save user language
  const { error: langError } = await supabase.from('user_languages').insert({
    user_id: userId,
    language: userData.language
  });
  
  if (langError) {
    console.error('Error saving language:', langError);
    // We don't return null here as the user is already created
  }
  
  return { userId, uniqueCode };
};

export const findUserByCodeAndName = async (code: string, name: string): Promise<any> => {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('unique_code', code)
    .eq('name', name);
    
  if (error || !users || users.length === 0) {
    return null;
  }
  
  return users[0];
};

export const getUserLanguage = async (userId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('user_languages')
    .select('language')
    .eq('user_id', userId)
    .single();
    
  if (error || !data) {
    return null;
  }
  
  return data.language;
};

// Language Functions
export const getLanguages = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('languages')
    .select('*');
    
  if (error || !data) {
    return [];
  }
  
  return data;
};

// Recording Functions
export const getUserRecordings = async (userId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('user_id', userId);
    
  if (error || !data) {
    return [];
  }
  
  return data;
};

export const saveRecordingMetadata = async (metadata: {
  userId: string;
  language: string;
  sentenceIndex: number;
  sentenceText: string;
  filePath: string;
  snr?: number;
}): Promise<void> => {
  // Check if recording already exists
  const { data } = await supabase
    .from('recordings')
    .select('id')
    .eq('user_id', metadata.userId)
    .eq('language', metadata.language)
    .eq('sentence_index', metadata.sentenceIndex);
    
  if (data && data.length > 0) {
    // Update existing recording
    await supabase
      .from('recordings')
      .update({
        sentence_text: metadata.sentenceText,
        file_path: metadata.filePath,
        recording_date: new Date().toISOString(),
        snr: metadata.snr,
        needs_rerecording: false
      })
      .eq('id', data[0].id);
  } else {
    // Insert new recording
    await supabase
      .from('recordings')
      .insert({
        user_id: metadata.userId,
        language: metadata.language,
        sentence_index: metadata.sentenceIndex,
        sentence_text: metadata.sentenceText,
        file_path: metadata.filePath,
        snr: metadata.snr,
        needs_rerecording: false
      });
  }
};

export const markForRerecording = async (userId: string, language: string, sentenceIndex: number): Promise<void> => {
  await supabase
    .from('recordings')
    .update({ needs_rerecording: true })
    .eq('user_id', userId)
    .eq('language', language)
    .eq('sentence_index', sentenceIndex);
};

export const getRerecordingCount = async (userId: string, language: string): Promise<number> => {
  const { data, error } = await supabase
    .from('recordings')
    .select('id')
    .eq('user_id', userId)
    .eq('language', language)
    .eq('needs_rerecording', true);
    
  if (error || !data) {
    return 0;
  }
  
  return data.length;
};

// File Storage Functions
export const saveRecordingBlob = async (
  blob: Blob, 
  userId: string, 
  language: string, 
  sentenceIndex: number,
  isRerecording: boolean = false
): Promise<string> => {
  // Create date-based folder structure
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const { data: userData } = await supabase.from('users').select('gender').eq('user_id', userId).single();
  const gender = userData?.gender || 'unknown';
  
  const bucket = isRerecording ? 'rerecordings' : 'recordings';
  const fileName = `${today}/${gender}_${language}_${userId}/${sentenceIndex}.wav`;
  
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(fileName, blob, {
      cacheControl: '3600',
      upsert: true
    });
    
  if (error) {
    console.error(`Error uploading ${isRerecording ? 're-recording' : 'recording'}:`, error);
    throw new Error(`Failed to upload ${isRerecording ? 're-recording' : 'recording'}`);
  }
  
  return data.path;
};

export const getRecordingBlob = async (filePath: string, isRerecording: boolean = false): Promise<Blob | null> => {
  const bucket = isRerecording ? 'rerecordings' : 'recordings';
  
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .download(filePath);
    
  if (error || !data) {
    return null;
  }
  
  return data;
};

export const saveUserFeedback = async (userId: string, rating: number, comments: string): Promise<void> => {
  await supabase
    .from('feedback')
    .insert({
      user_id: userId,
      rating,
      comments
    });
};

// Admin Functions
export const getAdminPassword = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('password')
    .single();
    
  if (error || !data) {
    return 'admin'; // Default password
  }
  
  return data.password;
};

export const setAdminPassword = async (password: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('admin_settings')
      .select('id');
      
    if (data && data.length > 0) {
      const { error } = await supabase
        .from('admin_settings')
        .update({ password })
        .eq('id', data[0].id);
        
      return !error;
    } else {
      const { error } = await supabase
        .from('admin_settings')
        .insert({ id: 'admin', password });
        
      return !error;
    }
  } catch (error) {
    console.error("Error setting admin password:", error);
    return false;
  }
};

export const exportAllData = async (): Promise<any> => {
  // Get all users, recordings, etc.
  const { data: users } = await supabase
    .from('users')
    .select('*');
    
  const { data: recordings } = await supabase
    .from('recordings')
    .select('*');
    
  const { data: languages } = await supabase
    .from('languages')
    .select('*');
    
  const { data: feedback } = await supabase
    .from('feedback')
    .select('*');
    
  return {
    users,
    recordings,
    languages,
    feedback,
    exportDate: new Date().toISOString()
  };
};

// Get all users for display in admin panel
export const getAllUsers = async (): Promise<any[]> => {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error || !users) {
    console.error("Error fetching users:", error);
    return [];
  }
  
  // For each user, get their language
  for (const user of users) {
    const { data: langData } = await supabase
      .from('user_languages')
      .select('language')
      .eq('user_id', user.user_id)
      .single();
      
    if (langData) {
      user.language = langData.language;
    }
  }
  
  return users;
};

// Delete user recordings
export const deleteUserRecordings = async (userId: string): Promise<boolean> => {
  try {
    // 1. Get all recordings for this user
    const { data: recordings } = await supabase
      .from('recordings')
      .select('*')
      .eq('user_id', userId);
      
    if (!recordings || recordings.length === 0) {
      return true; // No recordings to delete
    }
    
    // 2. Delete recordings from database
    const { error: dbError } = await supabase
      .from('recordings')
      .delete()
      .eq('user_id', userId);
      
    if (dbError) throw dbError;
    
    // 3. Delete recordings from storage
    // Get unique dates from recordings
    const recordingDates = [...new Set(recordings.map(rec => 
      new Date(rec.recording_date).toISOString().split('T')[0]
    ))];
    
    // Get user gender
    const { data: userData } = await supabase
      .from('users')
      .select('gender')
      .eq('user_id', userId)
      .single();
      
    const gender = userData?.gender || 'unknown';
    const language = recordings[0]?.language || '';
    
    // Delete each date folder for this user's recordings
    for (const date of recordingDates) {
      const folderPath = `${date}/${gender}_${language}_${userId}`;
      
      // List all files in this folder
      const { data: files } = await supabase.storage
        .from('recordings')
        .list(folderPath);
        
      if (files && files.length > 0) {
        // Delete all files in the folder
        const filePaths = files.map(file => `${folderPath}/${file.name}`);
        await supabase.storage
          .from('recordings')
          .remove(filePaths);
      }
      
      // Try to remove the folder itself (this may not work depending on storage provider)
      try {
        await supabase.storage
          .from('recordings')
          .remove([folderPath]);
      } catch (e) {
        // Ignore folder deletion errors
        console.log("Could not delete folder, this is normal for some storage providers");
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting user recordings:", error);
    return false;
  }
};
