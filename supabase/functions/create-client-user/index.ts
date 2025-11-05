import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email, password, full_name, company_name, project_id, booking_id } = await req.json()

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authError) throw authError

    // Profile is created automatically by trigger, so we skip manual creation

    // Create client account
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('client_accounts')
      .insert({
        user_id: authData.user.id,
        company_name,
        project_id: project_id || null,
        booking_id: booking_id || null,
      })
      .select()
      .single()

    if (clientError) {
      // Rollback: delete auth user and profile
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw clientError
    }

    return new Response(
      JSON.stringify({ success: true, client: clientData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error creating client:', error)
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
