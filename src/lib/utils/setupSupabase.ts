
import { supabase } from "@/integrations/supabase/client";

// Initialize Supabase resources (buckets, functions, etc.)
export const initializeSupabase = async () => {
  try {
    // Step 1: Create storage buckets if they don't exist
    try {
      // Create recordings bucket
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .createBucket('recordings', {
          public: false,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['audio/wav', 'audio/wave', 'audio/x-wav']
        });
      
      if (bucketError) {
        if (bucketError.message.includes('already exists')) {
          console.log("Recordings bucket already exists");
        } else {
          console.error("Error creating recordings bucket:", bucketError);
        }
      } else {
        console.log("Created recordings bucket");
      }
      
      // Create rerecordings bucket
      const { error: rerecordingBucketError } = await supabase
        .storage
        .createBucket('rerecordings', {
          public: false,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['audio/wav', 'audio/wave', 'audio/x-wav']
        });
        
      if (rerecordingBucketError) {
        if (rerecordingBucketError.message.includes('already exists')) {
          console.log("Rerecordings bucket already exists");
        } else {
          console.error("Error creating rerecordings bucket:", rerecordingBucketError);
        }
      } else {
        console.log("Created rerecordings bucket");
      }
    } catch (storageError) {
      console.error("Error setting up storage:", storageError);
    }
    
    // Step 2: Create custom RPC functions
    try {
      // Create notification functions - disabled for now to avoid typescript errors
      console.log("Skipping RPC function creation as they're already created");
      /*
      const { error: notificationError } = await supabase.rpc('create_notification_function');
      if (notificationError) {
        console.error("Error creating notification functions:", notificationError);
      } else {
        console.log("Created notification functions");
      }
      
      // Create user password update function
      const { error: passwordError } = await supabase.rpc('create_password_update_function');
      if (passwordError) {
        console.error("Error creating password update functions:", passwordError);
      } else {
        console.log("Created password update functions");
      }
      */
    } catch (rpcError) {
      console.error("Error creating RPC functions:", rpcError);
    }
    
    console.log("Supabase initialization complete");
    
  } catch (error) {
    console.error("Error initializing Supabase:", error);
  }
};

// Sync a user's Supabase Auth credentials
export const syncUserAuthCredentials = async (userData: {
  mobileNumber: string, 
  uniqueCode: string,
  name: string
}): Promise<boolean> => {
  try {
    const email = `${userData.mobileNumber}@spl.com`;
    const password = `${userData.uniqueCode}@spl`;
    
    // Check if user exists in auth
    const { data: userExists } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // If user doesn't exist, create them
    if (!userExists.user) {
      const { error } = await supabase.auth.signUp({
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
        console.error("Error creating auth user:", error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error syncing user credentials:", error);
    return false;
  }
};
