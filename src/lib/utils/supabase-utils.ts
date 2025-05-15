
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  addNotification, 
  updateUserPassword, 
  authenticateUser,
  registerUserAuth,
  sendRerecordingNotification,
  getUserLanguage
} from "./rpc-utils";

// Re-export notification and user password functions
export { 
  getUserNotifications, 
  markNotificationAsRead, 
  addNotification, 
  updateUserPassword, 
  authenticateUser,
  registerUserAuth,
  sendRerecordingNotification,
  getUserLanguage
};

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
      .select('unique_code')
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
}): Promise<{ uniqueCode: string } | null> => {
  // Check if contact number is already in use
  const { data: existingUser } = await supabase
    .from('users')
    .select('unique_code')
    .eq('contact_number', userData.contactNumber)
    .single();
  
  if (existingUser) {
    console.error('Contact number already in use');
    return null;
  }
  
  const uniqueCode = await generateUniqueCode();
  
  const { error: userError } = await supabase.from('users').insert({
    unique_code: uniqueCode,
    name: userData.name,
    age: userData.age,
    gender: userData.gender,
    contact_number: userData.contactNumber,
    created_at: new Date().toISOString() // Ensure creation date is set
  });
  
  if (userError) {
    console.error('Error saving user:', userError);
    return null;
  }
  
  // Also register the user with Supabase Auth
  await registerUserAuth({
    mobileNumber: userData.contactNumber,
    uniqueCode: uniqueCode,
    name: userData.name
  });
  
  // Save user language
  const { error: langError } = await supabase.from('user_languages').insert({
    unique_code: uniqueCode,
    language: userData.language
  });
  
  if (langError) {
    console.error('Error saving language:', langError);
    // We don't return null here as the user is already created
  }
  
  return { uniqueCode };
};

export const findUserByCode = async (code: string): Promise<any> => {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('unique_code', code);
    
  if (error || !users || users.length === 0) {
    return null;
  }
  
  return users[0];
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
export const getUserRecordings = async (uniqueCode: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('unique_code', uniqueCode);
    
  if (error || !data) {
    return [];
  }
  
  return data;
};

export const saveRecordingMetadata = async (metadata: {
  uniqueCode: string;
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
    .eq('unique_code', metadata.uniqueCode)
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
        unique_code: metadata.uniqueCode,
        language: metadata.language,
        sentence_index: metadata.sentenceIndex,
        sentence_text: metadata.sentenceText,
        file_path: metadata.filePath,
        snr: metadata.snr,
        needs_rerecording: false
      });
  }
};

export const markForRerecording = async (uniqueCode: string, language: string, sentenceIndex: number): Promise<void> => {
  try {
    // Get the sentence text first
    const { data: recordingData } = await supabase
      .from('recordings')
      .select('sentence_text, file_path')
      .eq('unique_code', uniqueCode)
      .eq('language', language)
      .eq('sentence_index', sentenceIndex)
      .single();
    
    // Mark the recording for rerecording  
    await supabase
      .from('recordings')
      .update({ needs_rerecording: true })
      .eq('unique_code', uniqueCode)
      .eq('language', language)
      .eq('sentence_index', sentenceIndex);
    
    // Delete the original recording file if it exists
    if (recordingData && recordingData.file_path) {
      await supabase.storage
        .from('recordings')
        .remove([recordingData.file_path]);
    }
    
    // Send notification to user
    if (recordingData && recordingData.sentence_text) {
      await sendRerecordingNotification(uniqueCode, recordingData.sentence_text);
    }
  } catch (error) {
    console.error("Error marking for rerecording:", error);
  }
};

export const getRerecordingCount = async (uniqueCode: string, language: string): Promise<number> => {
  const { data, error } = await supabase
    .from('recordings')
    .select('id')
    .eq('unique_code', uniqueCode)
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
  uniqueCode: string, 
  language: string, 
  sentenceIndex: number,
  isRerecording: boolean = false
): Promise<string> => {
  try {
    // Get user gender for file naming
    const { data: userData } = await supabase
      .from('users')
      .select('gender')
      .eq('unique_code', uniqueCode)
      .single();
    
    // Create date-based folder structure (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    const gender = userData?.gender || 'unknown';
    
    // Define the file path according to the new structure
    // recordings/YYYY-MM-DD/gender_language_uniqueCode/
    const bucket = isRerecording ? 'rerecordings' : 'recordings';
    const folderPath = `${today}/${gender}_${language}_${uniqueCode}`;
    const fileName = `${folderPath}/${sentenceIndex}.wav`;
    
    console.log(`Saving ${isRerecording ? 're-recording' : 'recording'} to: ${fileName}`);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) {
      // Check if it's a bucket not found error
      if (error.message?.includes('bucket not found')) {
        console.error(`Error: Bucket '${bucket}' not found. Creating bucket...`);
        
        // Try to create the bucket
        const { error: createError } = await supabase
          .storage
          .createBucket(bucket, {
            public: false
          });
          
        if (createError) {
          console.error(`Error creating ${bucket} bucket:`, createError);
          throw new Error(`Failed to create ${bucket} bucket`);
        }
        
        // Retry upload after creating bucket
        const { data: retryData, error: retryError } = await supabase
          .storage
          .from(bucket)
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (retryError) {
          console.error(`Error uploading ${isRerecording ? 're-recording' : 'recording'} after bucket creation:`, retryError);
          throw new Error(`Failed to upload ${isRerecording ? 're-recording' : 'recording'}`);
        }
        
        return retryData.path;
      } else {
        console.error(`Error uploading ${isRerecording ? 're-recording' : 'recording'}:`, error);
        throw new Error(`Failed to upload ${isRerecording ? 're-recording' : 'recording'}`);
      }
    }
    
    return data.path;
  } catch (error) {
    console.error(`Error in saveRecordingBlob:`, error);
    throw error;
  }
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

export const saveUserFeedback = async (uniqueCode: string, rating: number, comments: string): Promise<void> => {
  await supabase
    .from('feedback')
    .insert({
      unique_code: uniqueCode,
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
      .eq('unique_code', user.unique_code)
      .single();
      
    if (langData) {
      user.languagePreference = langData.language;
    }
  }
  
  return users;
};

// Delete user recordings
export const deleteUserRecordings = async (uniqueCode: string): Promise<boolean> => {
  try {
    // 1. Get all recordings for this user
    const { data: recordings } = await supabase
      .from('recordings')
      .select('*')
      .eq('unique_code', uniqueCode);
      
    if (!recordings || recordings.length === 0) {
      return true; // No recordings to delete
    }
    
    // 2. Delete recordings from database
    const { error: dbError } = await supabase
      .from('recordings')
      .delete()
      .eq('unique_code', uniqueCode);
      
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
      .eq('unique_code', uniqueCode)
      .single();
      
    const gender = userData?.gender || 'unknown';
    const language = recordings[0]?.language || '';
    
    // Delete each date folder for this user's recordings
    for (const date of recordingDates) {
      const folderPath = `${date}/${gender}_${language}_${uniqueCode}`;
      
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

// Delete user completely (both data and recordings)
export const deleteUser = async (uniqueCode: string): Promise<boolean> => {
  try {
    // First delete all recordings
    await deleteUserRecordings(uniqueCode);
    
    // Delete user language preferences
    await supabase
      .from('user_languages')
      .delete()
      .eq('unique_code', uniqueCode);
      
    // Delete user notifications
    await supabase
      .from('notifications')
      .delete()
      .eq('unique_code', uniqueCode);
      
    // Delete user feedback
    await supabase
      .from('feedback')
      .delete()
      .eq('unique_code', uniqueCode);
    
    // Delete the user from users table
    await supabase
      .from('users')
      .delete()
      .eq('unique_code', uniqueCode);
      
    // Find the auth user associated with this unique code
    const { data: authData } = await supabase.auth.admin.listUsers({
      filter: {
        user_metadata: { unique_code: uniqueCode }
      }
    });
      
    if (authData?.users && authData.users.length > 0) {
      // Delete the auth user
      await supabase.auth.admin.deleteUser(
        authData.users[0].id
      );
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
};

// Function to download all user recordings as a zip file
export const downloadUserRecordings = async (uniqueCode: string): Promise<Blob | null> => {
  try {
    // Get JSZip from the window object if it's been imported
    const JSZip = (window as any).JSZip;
    if (!JSZip) {
      console.error("JSZip library not found");
      return null;
    }
    
    // Create a new zip file
    const zip = new JSZip();
    
    // Get user recordings
    const { data: recordings } = await supabase
      .from('recordings')
      .select('*')
      .eq('unique_code', uniqueCode);
      
    if (!recordings || recordings.length === 0) {
      return null;
    }
    
    // Get user details
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('unique_code', uniqueCode)
      .single();
      
    if (!user) {
      return null;
    }
    
    // Group recordings by language
    const recordingsByLanguage: Record<string, any[]> = {};
    recordings.forEach(rec => {
      if (!recordingsByLanguage[rec.language]) {
        recordingsByLanguage[rec.language] = [];
      }
      recordingsByLanguage[rec.language].push(rec);
    });
    
    // For each language, create a folder
    for (const [language, recs] of Object.entries(recordingsByLanguage)) {
      const languageFolder = zip.folder(language);
      if (!languageFolder) continue;
      
      // Create metadata.json
      const metadata = {
        user: {
          name: user.name,
          gender: user.gender,
          age: user.age,
          contact: user.contact_number,
          unique_code: user.unique_code
        },
        recordings: recs.map(rec => ({
          sentence_index: rec.sentence_index,
          sentence_text: rec.sentence_text,
          recording_date: rec.recording_date,
          file_name: `${rec.sentence_index}.wav`,
          needs_rerecording: rec.needs_rerecording,
          snr: rec.snr
        }))
      };
      
      languageFolder.file("metadata.json", JSON.stringify(metadata, null, 2));
      
      // Download and add each recording
      for (const rec of recs) {
        try {
          const blob = await getRecordingBlob(rec.file_path, rec.needs_rerecording);
          if (blob) {
            languageFolder.file(`${rec.sentence_index}.wav`, blob);
          }
        } catch (e) {
          console.error(`Error adding recording ${rec.sentence_index} to zip:`, e);
        }
      }
    }
    
    // Generate the zip file
    return await zip.generateAsync({ type: "blob" });
    
  } catch (error) {
    console.error("Error downloading user recordings:", error);
    return null;
  }
};
