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

    console.log('Creating user with:', { email, full_name, company_name })

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    })

    if (authError) {
      console.error('Auth error:', authError)
      throw new Error(`Auth error: ${authError.message}`)
    }

    console.log('User created:', authData.user.id)

    // Wait a moment for triggers to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Create client account
    console.log('Creating client account...')
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('client_accounts')
      .insert({
        user_id: authData.user.id,
        company_name: company_name || null,
        project_id: project_id || null,
        booking_id: booking_id || null,
      })
      .select()
      .single()

    if (clientError) {
      console.error('Client account error:', clientError)
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Client account error: ${clientError.message} (${clientError.code})`)
    }

    console.log('Client account created:', clientData.id)

    return new Response(
      JSON.stringify({ success: true, client: clientData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error creating client:', error)
    const errorMessage = error?.message || error?.msg || String(error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
