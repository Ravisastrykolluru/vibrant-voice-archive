
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
    
    // Check if the notifications table exists
    const { error: tableCheckError } = await supabase.from('notifications').select('id').limit(1);
    
    if (tableCheckError && tableCheckError.message.includes('does not exist')) {
      console.log("Creating notifications table...");
      
      // Create the notifications table
      const { error: createTableError } = await supabase.rpc('create_notifications_table');
      if (createTableError) {
        console.error("Error creating notifications table:", createTableError);
        
        // Try direct SQL as fallback (this might not work depending on permissions)
        try {
          await supabase.rpc('execute_sql', {
            sql_query: `
              CREATE TABLE IF NOT EXISTS public.notifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT NOT NULL,
                message TEXT NOT NULL,
                read BOOLEAN NOT NULL DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
              );
            `
          });
          console.log("Created notifications table via execute_sql");
        } catch (sqlError) {
          console.error("Failed to create notifications table via execute_sql:", sqlError);
        }
      } else {
        console.log("Notifications table created successfully");
      }
    }
    
    console.log("Supabase initialization complete");
  } catch (error) {
    console.error("Error initializing Supabase:", error);
  }
};
