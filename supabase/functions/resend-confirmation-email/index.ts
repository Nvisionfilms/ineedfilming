import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Attempting to resend confirmation email to: ${email}`);

    // Get user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resend confirmation email using admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      password: crypto.randomUUID(), // Temporary password, user won't need it for confirmation
    });

    if (error) {
      console.error('Error generating confirmation link:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate confirmation link' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully generated confirmation link for: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Confirmation email resent successfully',
        properties: data.properties
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in resend-confirmation-email function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
