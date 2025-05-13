
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
    const { p_notification_id } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Mark notification as read
    const { error } = await supabaseClient
      .from('notifications')
      .update({ read: true })
      .eq('id', p_notification_id);
      
    if (error) {
      console.error("Error marking notification as read:", error);
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
