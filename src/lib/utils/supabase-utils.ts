import { supabase } from "@/integrations/supabase/client";
import { registerUserAuth } from "./rpc-utils";
import { v4 as uuidv4 } from 'uuid';
import { TablesInsert } from "@/integrations/supabase/types";

// Function to save user data to Supabase
export const saveUser = async (userData: {
  name: string;
  age: number;
  gender: string;
  contactNumber: string;
  language: string;
}): Promise<any> => {
  try {
    // Check if the contact number is already registered
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('contact_number', userData.contactNumber);
    
    if (existingUser && existingUser.length > 0) {
      return null; // Indicate that the phone number is already registered
    }
    
    // Generate a unique code
    let uniqueCode: string;
    let isCodeUnique = false;
    
    while (!isCodeUnique) {
      uniqueCode = generateUniqueCode();
      const { data: existingCode } = await supabase
        .from('users')
        .select('*')
        .eq('unique_code', uniqueCode);
      
      if (!existingCode || existingCode.length === 0) {
        isCodeUnique = true;
      }
    }
    
    // Insert user data into the 'users' table
    const { data, error } = await supabase
      .from('users')
      .insert<TablesInsert<'users'>>([
        {
          name: userData.name,
          age: userData.age,
          gender: userData.gender,
          contact_number: userData.contactNumber,
          unique_code: uniqueCode
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error("Error saving user:", error);
      return null;
    }
    
    // Save user language preference
    await saveUserLanguage(uniqueCode, userData.language);
    
    // Register user with Supabase Auth
    await registerUserAuth({
      mobileNumber: userData.contactNumber,
      uniqueCode: uniqueCode,
      name: userData.name
    });
    
    return { uniqueCode: uniqueCode, ...data };
  } catch (error) {
    console.error("Error in saveUser:", error);
    return null;
  }
};

// Function to save user language preference
export const saveUserLanguage = async (uniqueCode: string, language: string): Promise<boolean> => {
  try {
    // Insert language preference into the 'user_languages' table
    const { error } = await supabase
      .from('user_languages')
      .insert([
        {
          unique_code: uniqueCode,
          language: language
        }
      ]);
    
    if (error) {
      console.error("Error saving user language:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in saveUserLanguage:", error);
    return false;
  }
};

// Function to generate a unique 5-character alphanumeric code
const generateUniqueCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Function to get languages from Supabase
export const getLanguages = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('languages')
      .select('*');
    
    if (error) {
      console.error("Error getting languages:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getLanguages:", error);
    return [];
  }
};

// Function to get admin password from Supabase
export const getAdminPassword = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('password')
      .eq('id', 'admin')
      .single();
    
    if (error) {
      console.error("Error getting admin password:", error);
      return null;
    }
    
    return data?.password || null;
  } catch (error) {
    console.error("Error in getAdminPassword:", error);
    return null;
  }
};

// Function to save recording metadata to Supabase
export const saveRecordingMetadata = async (
  userId: string,
  language: string,
  sentenceIndex: number,
  filePath: string,
  sentenceText: string,
  snr?: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('recordings')
      .insert([
        {
          unique_code: userId,
          language: language,
          sentence_index: sentenceIndex,
          file_path: filePath,
          recording_date: new Date().toISOString(),
          sentence_text: sentenceText,
          snr: snr || null
        }
      ]);
    
    if (error) {
      console.error("Error saving recording metadata:", error);
      return false;
    }
    
    // Dispatch a custom event to notify components about the recording update
    window.dispatchEvent(new Event('recording-updated'));
    
    return true;
  } catch (error) {
    console.error("Error in saveRecordingMetadata:", error);
    return false;
  }
};

// Function to save recording blob to Supabase storage
export const saveRecordingBlob = async (blob: Blob, filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('recordings')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error("Error saving recording:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in saveRecording:", error);
    return false;
  }
};

export const fetchUserLanguages = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('user_languages')
      .select('language')
      .eq('unique_code', userId);
      
    if (error) {
      console.error("Error fetching user languages:", error);
      return [];
    }
    
    // Extract language names from the data
    return data.map(item => item.language);
  } catch (error) {
    console.error("Error in fetchUserLanguages:", error);
    return [];
  }
};

export const fetchSentencesForLanguage = async (language: string) => {
  try {
    const { data, error } = await supabase
      .from('sentences')
      .select('id, text, language')
      .eq('language', language)
      .order('id', { ascending: true });
    
    if (error) {
      console.error("Error fetching sentences:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchSentencesForLanguage:", error);
    return [];
  }
};

// Function to get all users from Supabase
export const getAllUsers = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error("Error getting users:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return [];
  }
};

export const deleteUserRecordings = async (userId: string): Promise<boolean> => {
  try {
    // First get all recordings for this user
    const { data: recordings } = await supabase
      .from('recordings')
      .select('file_path')
      .eq('unique_code', userId);
      
    if (recordings && recordings.length > 0) {
      // Delete each recording file from storage
      for (const recording of recordings) {
        if (recording.file_path) {
          const { error: storageError } = await supabase
            .storage
            .from('recordings')
            .remove([recording.file_path]);
            
          if (storageError) {
            console.error("Error deleting recording file:", storageError);
          }
        }
      }
      
      // Delete the recording metadata from the database
      const { error: dbError } = await supabase
        .from('recordings')
        .delete()
        .eq('unique_code', userId);
        
      if (dbError) {
        console.error("Error deleting recording metadata:", dbError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error in deleteUserRecordings:", error);
    return false;
  }
};

// Function to add a new language with sentences
export const addLanguageWithSentences = async (
  languageName: string, 
  sentences: string[], 
  paragraphMode: boolean = false
): Promise<boolean> => {
  try {
    // Process sentences if in paragraph mode
    const processedSentences = paragraphMode 
      ? sentences.flatMap(paragraph => paragraph.split(/(?<=\.)\s+/)) // Split paragraphs at sentence endings
      : sentences;
    
    // Insert the new language
    const { data: languageData, error: languageError } = await supabase
      .from('languages')
      .insert({
        id: Date.now().toString(),
        name: languageName,
        sentences: processedSentences,
        upload_date: new Date().toISOString()
      })
      .select();
      
    if (languageError) {
      console.error("Error adding language:", languageError);
      return false;
    }
    
    // Add each sentence to the sentences table for better querying
    for (let i = 0; i < processedSentences.length; i++) {
      const { error: sentenceError } = await supabase
        .from('sentences')
        .insert({
          language: languageName,
          text: processedSentences[i].trim()
        });
        
      if (sentenceError) {
        console.error("Error adding sentence:", sentenceError);
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error in addLanguageWithSentences:", error);
    return false;
  }
};

// Fixed return type to avoid infinite type instantiation without using index signature
export const getUserWithRecordingsCount = async (userId: string): Promise<{ 
  recordingsCount: number; 
  name?: string;
  unique_code?: string;
  created_at?: string;
  password?: string | null;
  age?: number;
  gender?: string;
  contact_number?: string;
  id?: string;
}> => {
  try {
    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (userError) {
      console.error("Error fetching user:", userError);
      return { recordingsCount: 0 };
    }
    
    // Count recordings
    const { count: recordingsCount, error: recordingsError } = await supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true })
      .eq('unique_code', userId);
      
    if (recordingsError) {
      console.error("Error counting recordings:", recordingsError);
    }
    
    return {
      ...(user || {}),
      recordingsCount: recordingsCount || 0
    };
  } catch (error) {
    console.error("Error in getUserWithRecordingsCount:", error);
    return { recordingsCount: 0 };
  }
};

// Function to update admin settings
export const updateAdminSettings = async (settings: {
  password?: string;
  storageType?: string;
  googleConnected?: boolean;
  googleEmail?: string | null;
  googleFolderName?: string | null;
  autoSync?: boolean;
}): Promise<boolean> => {
  try {
    const updates: {
      password?: string;
      storage_type?: string;
      google_connected?: boolean;
      google_email?: string | null;
      google_folder_name?: string | null;
      auto_sync?: boolean;
    } = {};
    
    if (settings.password) {
      updates.password = settings.password;
    }
    if (settings.storageType) {
      updates.storage_type = settings.storageType;
    }
    if (settings.googleConnected !== undefined) {
      updates.google_connected = settings.googleConnected;
    }
    if (settings.googleEmail !== undefined) {
      updates.google_email = settings.googleEmail;
    }
    if (settings.googleFolderName !== undefined) {
      updates.google_folder_name = settings.googleFolderName;
    }
    if (settings.autoSync !== undefined) {
      updates.auto_sync = settings.autoSync;
    }
    
    const { error } = await supabase
      .from('admin_settings')
      .update(updates)
      .eq('id', 'admin');
    
    if (error) {
      console.error("Error updating admin settings:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateAdminSettings:", error);
    return false;
  }
};

// Function to authenticate a user by unique code and language
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

// Function to get user's language preference
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

// Function to get user notifications
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

// Function to save user feedback
export const saveUserFeedback = async (uniqueCode: string, rating: number, comments?: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('feedback')
      .insert([
        {
          unique_code: uniqueCode,
          rating: rating,
          comments: comments || null
        }
      ]);
    
    if (error) {
      console.error("Error saving feedback:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in saveUserFeedback:", error);
    return false;
  }
};

// Function to get user recordings
export const getUserRecordings = async (uniqueCode: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('unique_code', uniqueCode)
      .order('sentence_index', { ascending: true });
    
    if (error || !data) {
      console.error("Error getting recordings:", error);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Error in getUserRecordings:", error);
    return [];
  }
};
