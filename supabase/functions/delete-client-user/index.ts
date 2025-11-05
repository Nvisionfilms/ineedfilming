import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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

    const { user_id } = await req.json()

    if (!user_id) {
      throw new Error('user_id is required')
    }

    console.log('Deleting user:', user_id)

    // Delete from client_accounts first (will cascade delete related records)
    const { error: clientError } = await supabaseAdmin
      .from('client_accounts')
      .delete()
      .eq('user_id', user_id)

    if (clientError) {
      console.error('Error deleting client account:', clientError)
      throw new Error(`Client account error: ${clientError.message}`)
    }

    console.log('Client account deleted')

    // Delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (authError) {
      console.error('Error deleting auth user:', authError)
      throw new Error(`Auth error: ${authError.message}`)
    }

    console.log('Auth user deleted')

    return new Response(
      JSON.stringify({ success: true, message: 'Client deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error deleting client:', error)
    const errorMessage = error?.message || error?.msg || String(error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
