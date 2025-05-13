
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
    
    // Create the SQL function for adding notifications
    const { error } = await supabaseClient.rpc('execute_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION add_notification(p_user_id TEXT, p_message TEXT)
        RETURNS VOID
        LANGUAGE plpgsql
        AS $$
        BEGIN
          INSERT INTO notifications (user_id, message, read, created_at)
          VALUES (p_user_id, p_message, false, NOW());
        END;
        $$;
      `
    });
    
    if (error) {
      console.error("Error creating add_notification function:", error);
      return new Response(JSON.stringify({ error: error.message }), {
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
