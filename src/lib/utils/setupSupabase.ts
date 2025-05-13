
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
      // This would typically be done through SQL migrations
      // but we're doing it here for simplicity
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
    
    // Create custom RPC functions for notifications and user password updates
    try {
      // Create add_notification function
      await supabase.rpc('create_notification_function', {});
      console.log("Created add_notification function");
      
      // Create update_user_password function
      await supabase.rpc('create_password_update_function', {});
      console.log("Created update_user_password function");
    } catch (rpcError) {
      console.error("Error creating RPC functions:", rpcError);
    }
    
    console.log("Supabase initialization complete");
  } catch (error) {
    console.error("Error initializing Supabase:", error);
  }
};
