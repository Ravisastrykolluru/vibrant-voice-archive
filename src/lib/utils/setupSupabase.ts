
import { supabase } from "@/integrations/supabase/client";

export const initializeSupabase = async (): Promise<void> => {
  try {
    // Check if storage bucket exists and create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    const recordingsBucketExists = buckets?.some(bucket => bucket.name === 'recordings');
    
    if (!recordingsBucketExists) {
      // Create the recordings bucket if it doesn't exist
      await supabase.storage.createBucket('recordings', { public: false });
      console.log("Created recordings bucket");
      
      // Set up bucket policies
      try {
        const { error } = await supabase.storage.from('recordings').upload('test.txt', new Blob(['test']), {
          cacheControl: '3600',
          upsert: true
        });
        if (error) {
          console.error("Error setting up storage bucket:", error);
        } else {
          // Delete the test file
          await supabase.storage.from('recordings').remove(['test.txt']);
        }
      } catch (storageError) {
        console.error("Error testing storage bucket:", storageError);
      }
    }
    
    // Create a rerecordings bucket if it doesn't exist
    const rerecordingsBucketExists = buckets?.some(bucket => bucket.name === 'rerecordings');
    if (!rerecordingsBucketExists) {
      await supabase.storage.createBucket('rerecordings', { public: false });
      console.log("Created rerecordings bucket");
    }
    
    // Create custom RPC functions
    try {
      // Create notification functions
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
    } catch (rpcError) {
      console.error("Error creating RPC functions:", rpcError);
    }
    
    console.log("Supabase initialization complete");
  } catch (error) {
    console.error("Error initializing Supabase:", error);
  }
};
