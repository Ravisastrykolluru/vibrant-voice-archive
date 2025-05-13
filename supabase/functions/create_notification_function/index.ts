
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Create RPC function to add notifications
    const { error: addNotificationError } = await supabaseClient.rpc('execute_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION add_notification(p_user_id TEXT, p_message TEXT)
        RETURNS void
        LANGUAGE plpgsql
        AS $$
        BEGIN
          INSERT INTO public.notifications (user_id, message)
          VALUES (p_user_id, p_message);
        END;
        $$;
      `
    });
    
    if (addNotificationError) {
      console.error("Error creating add_notification function:", addNotificationError);
      return new Response(JSON.stringify({ error: addNotificationError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }
    
    // Create RPC function to get user notifications
    const { error: getUserNotificationsError } = await supabaseClient.rpc('execute_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION get_user_notifications(p_user_id TEXT)
        RETURNS SETOF public.notifications
        LANGUAGE plpgsql
        AS $$
        BEGIN
          RETURN QUERY
          SELECT *
          FROM public.notifications
          WHERE user_id = p_user_id
          ORDER BY created_at DESC;
        END;
        $$;
      `
    });
    
    if (getUserNotificationsError) {
      console.error("Error creating get_user_notifications function:", getUserNotificationsError);
      return new Response(JSON.stringify({ error: getUserNotificationsError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }
    
    // Create RPC function to mark notification as read
    const { error: markNotificationReadError } = await supabaseClient.rpc('execute_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
        RETURNS void
        LANGUAGE plpgsql
        AS $$
        BEGIN
          UPDATE public.notifications
          SET read = true
          WHERE id = p_notification_id;
        END;
        $$;
      `
    });
    
    if (markNotificationReadError) {
      console.error("Error creating mark_notification_read function:", markNotificationReadError);
      return new Response(JSON.stringify({ error: markNotificationReadError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
