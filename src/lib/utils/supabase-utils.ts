import { supabase } from "@/integrations/supabase/client";

export const getLanguages = async () => {
  try {
    const { data, error } = await supabase
      .from('languages')
      .select('*');

    if (error) {
      console.error("Error fetching languages:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching languages:", error);
    return [];
  }
};

export const getUserNotifications = async (uniqueCode: string) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('unique_code', uniqueCode);

    if (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

export const getUserLanguage = async (uniqueCode: string) => {
  try {
    const { data, error } = await supabase
      .from('user_languages')
      .select('language')
      .eq('unique_code', uniqueCode)
      .single();
    
    if (error) {
      console.error('Error fetching user language:', error);
      return null;
    }
    
    return data?.language || null;
  } catch (error) {
    console.error('Exception fetching user language:', error);
    return null;
  }
};

export const authenticateUser = async (
  mobileNumber: string, 
  uniqueCode: string, 
  selectedLanguage: string
) => {
  try {
    // Check if the user exists with the given mobile and unique code
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('contact_number', mobileNumber)
      .eq('unique_code', uniqueCode)
      .single();
    
    if (userError || !userData) {
      console.error('User authentication error:', userError);
      return { 
        success: false, 
        error: 'Invalid mobile number or unique code'
      };
    }
    
    // Check if user has a language preference
    const { data: langData, error: langError } = await supabase
      .from('user_languages')
      .select('language')
      .eq('unique_code', uniqueCode)
      .single();
    
    // If user has a language and it's different from selected
    if (!langError && langData && langData.language !== selectedLanguage) {
      return {
        success: false,
        correctLanguage: langData.language,
        error: 'Language mismatch'
      };
    }
    
    // If user doesn't have a language yet, assign the selected one
    if (langError && !langData) {
      const { error: insertError } = await supabase
        .from('user_languages')
        .insert({
          unique_code: uniqueCode,
          language: selectedLanguage
        });
      
      if (insertError) {
        console.error('Error assigning language:', insertError);
      }
    }
    
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: `${uniqueCode}@example.com`,
      password: userData.password || uniqueCode // Fallback to uniqueCode if no password
    });
    
    if (authError) {
      // Try to create the auth user if they don't exist yet
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: `${uniqueCode}@example.com`,
        password: userData.password || uniqueCode,
        options: {
          data: {
            unique_code: uniqueCode,
            name: userData.name
          }
        }
      });
      
      if (signUpError) {
        console.error('Auth signup error:', signUpError);
        return { success: false, error: 'Authentication failed' };
      }
      
      // Successfully created auth user
      return { 
        success: true, 
        profile: userData,
        language: langData?.language
      };
    }
    
    // Successfully authenticated
    return { 
      success: true, 
      profile: userData,
      language: langData?.language
    };
    
  } catch (error) {
    console.error('Authentication exception:', error);
    return { success: false, error: 'Authentication failed' };
  }
};

export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    
    // Get the language for each user
    const usersWithLanguage = await Promise.all(
      data.map(async (user) => {
        const language = await getUserLanguage(user.unique_code);
        return {
          ...user,
          languagePreference: language
        };
      })
    );
    
    return usersWithLanguage;
  } catch (error) {
    console.error('Exception fetching users:', error);
    return [];
  }
};

export const updateUser = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select();
    
    if (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data ? data[0] : null };
  } catch (error) {
    console.error('Exception updating user:', error);
    return { success: false, error: 'Failed to update user' };
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception deleting user:', error);
    return false;
  }
};

export const createRecording = async (
  unique_code: string,
  language: string,
  sentence_index: number,
  file_path: string,
  sentence_text: string
) => {
  try {
    const { data, error } = await supabase
      .from('recordings')
      .insert([
        {
          unique_code,
          language,
          sentence_index,
          file_path,
          sentence_text
        },
      ])
      .select();

    if (error) {
      console.error("Error creating recording:", error);
      return { success: false, error: error.message };
    }

    // Dispatch a custom event
    window.dispatchEvent(new Event('recording-updated'));

    return { success: true, data: data ? data[0] : null };
  } catch (error) {
    console.error("Error creating recording:", error);
    return { success: false, error: "Failed to create recording" };
  }
};

export const fetchUserRecordings = async (
  uniqueCode: string,
  language: string,
  page = 1,
  pageSize = 10
) => {
  try {
    // Calculate range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await supabase
      .from('recordings')
      .select('*', { count: 'exact' })
      .eq('unique_code', uniqueCode)
      .eq('language', language)
      .order('sentence_index', { ascending: true })
      .range(from, to);
    
    if (error) {
      console.error('Error fetching recordings:', error);
      return { recordings: [], count: 0 };
    }
    
    return { recordings: data || [], count: count || 0 };
  } catch (error) {
    console.error('Exception fetching recordings:', error);
    return { recordings: [], count: 0 };
  }
};

export const getRecordingCount = async (uniqueCode: string, language: string) => {
  try {
    const { count, error } = await supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true })
      .eq('unique_code', uniqueCode)
      .eq('language', language);

    if (error) {
      console.error("Error fetching recording count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error fetching recording count:", error);
    return 0;
  }
};

// Added missing functions
export const saveUserFeedback = async (userId: string, rating: number, comments: string) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert([
        {
          unique_code: userId,
          rating,
          comments
        }
      ])
      .select();

    if (error) {
      console.error("Error saving user feedback:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data ? data[0] : null };
  } catch (error) {
    console.error("Error saving user feedback:", error);
    return { success: false, error: "Failed to save feedback" };
  }
};

export const deleteUserRecordings = async (uniqueCode: string) => {
  try {
    const { error } = await supabase
      .from('recordings')
      .delete()
      .eq('unique_code', uniqueCode);
    
    if (error) {
      console.error('Error deleting user recordings:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception deleting user recordings:', error);
    return false;
  }
};

export const getAdminPassword = async () => {
  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('password')
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching admin password:', error);
      return 'admin'; // Default password
    }
    
    return data.password;
  } catch (error) {
    console.error('Exception fetching admin password:', error);
    return 'admin'; // Default password on error
  }
};

export const saveUser = async (userData: {
  name: string;
  age: number;
  gender: string;
  contactNumber: string;
  language: string;
}) => {
  try {
    // Generate unique code (5 characters, alphanumeric)
    const generateUniqueCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const uniqueCode = generateUniqueCode();
    
    // Check if contact number already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('contact_number', userData.contactNumber)
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return null;
    }
    
    if (existingUser && existingUser.length > 0) {
      console.error('User with this contact number already exists');
      return null;
    }
    
    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        name: userData.name,
        age: userData.age,
        gender: userData.gender,
        contact_number: userData.contactNumber,
        unique_code: uniqueCode
      }])
      .select();
    
    if (insertError || !newUser || newUser.length === 0) {
      console.error('Error creating user:', insertError);
      return null;
    }
    
    // Insert user language preference
    const { error: langError } = await supabase
      .from('user_languages')
      .insert([{
        unique_code: uniqueCode,
        language: userData.language
      }]);
    
    if (langError) {
      console.error('Error setting language preference:', langError);
      // Continue anyway, language preference is not critical
    }
    
    return { 
      ...newUser[0],
      uniqueCode 
    };
  } catch (error) {
    console.error('Exception creating user:', error);
    return null;
  }
};

// Function to save recording metadata
export const saveRecordingMetadata = async (
  uniqueCode: string, 
  language: string,
  sentenceIndex: number,
  filePath: string,
  sentenceText: string,
  isRerecording: boolean = false
) => {
  try {
    const { data, error } = await supabase
      .from('recordings')
      .insert([
        {
          unique_code: uniqueCode,
          language: language,
          sentence_index: sentenceIndex,
          file_path: filePath,
          sentence_text: sentenceText,
          needs_rerecording: isRerecording
        }
      ])
      .select();

    if (error) {
      console.error("Error saving recording metadata:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data ? data[0] : null };
  } catch (error) {
    console.error("Error saving recording metadata:", error);
    return { success: false, error: "Failed to save recording metadata" };
  }
};

// Function to save recording blob to storage
export const saveRecordingBlob = async (
  blob: Blob,
  filePath: string
) => {
  try {
    const { data, error } = await supabase
      .storage
      .from('recordings')
      .upload(filePath, blob);

    if (error) {
      console.error("Error saving recording blob:", error);
      return { success: false, error: error.message };
    }

    return { success: true, path: data?.path };
  } catch (error) {
    console.error("Error saving recording blob:", error);
    return { success: false, error: "Failed to save recording blob" };
  }
};

// Alias for getRecordingCount to support rerecordings
export const getRerecordingCount = async (uniqueCode: string, language: string) => {
  try {
    const { count, error } = await supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true })
      .eq('unique_code', uniqueCode)
      .eq('language', language)
      .eq('needs_rerecording', true);

    if (error) {
      console.error("Error fetching rerecording count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error fetching rerecording count:", error);
    return 0;
  }
};

// Implementation of getUserRecordings for compatibility
export const getUserRecordings = async (uniqueCode: string, language?: string) => {
  try {
    let query = supabase
      .from('recordings')
      .select('*')
      .eq('unique_code', uniqueCode);
      
    if (language) {
      query = query.eq('language', language);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching user recordings:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Exception fetching user recordings:', error);
    return [];
  }
};

// Add the missing fetchUserLanguages function
export const fetchUserLanguages = async (userId: string): Promise<string[]> => {
  try {
    // First, get the user's unique code using the userId
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('unique_code')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return [];
    }
    
    const uniqueCode = userData.unique_code;
    
    // Then fetch the language for this unique code
    const { data, error } = await supabase
      .from('user_languages')
      .select('language')
      .eq('unique_code', uniqueCode);
    
    if (error) {
      console.error('Error fetching user languages:', error);
      return [];
    }
    
    // Return the languages as an array of strings
    return data?.map(item => item.language) || [];
  } catch (error) {
    console.error('Exception fetching user languages:', error);
    return [];
  }
};
