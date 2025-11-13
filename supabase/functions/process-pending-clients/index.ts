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

    // Get pending client accounts
    const { data: pendingClients, error: fetchError } = await supabaseAdmin
      .from('pending_client_accounts')
      .select('*')
      .eq('status', 'pending_auth_creation')
      .limit(10)

    if (fetchError) throw fetchError

    const results = []

    for (const pending of pendingClients || []) {
      try {
        // Generate temporary password
        const tempPassword = `Welcome${Math.floor(Math.random() * 10000)}!`

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: pending.client_email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: pending.client_name,
            created_from: 'payment_automation'
          }
        })

        if (authError) {
          // Check if user already exists
          if (authError.message.includes('already registered')) {
            // Get existing user
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
            const existingUser = existingUsers?.users.find(u => u.email === pending.client_email)
            
            if (existingUser) {
              // Use existing user
              await createClientAccount(supabaseAdmin, pending.booking_id, existingUser.id)
              
              await supabaseAdmin
                .from('pending_client_accounts')
                .update({ 
                  status: 'completed',
                  processed_at: new Date().toISOString()
                })
                .eq('id', pending.id)

              results.push({
                email: pending.client_email,
                status: 'success',
                message: 'Used existing user account'
              })
              continue
            }
          }
          
          throw authError
        }

        // Create client account and project
        const { data: clientAccountId, error: clientError } = await supabaseAdmin
          .rpc('create_client_account_from_booking', {
            p_booking_id: pending.booking_id,
            p_user_id: authData.user.id
          })

        if (clientError) throw clientError

        // Send welcome email
        await supabaseAdmin.functions.invoke('send-welcome-email', {
          body: {
            email: pending.client_email,
            name: pending.client_name,
            tempPassword: tempPassword
          }
        })

        // Mark as completed
        await supabaseAdmin
          .from('pending_client_accounts')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', pending.id)

        results.push({
          email: pending.client_email,
          status: 'success',
          tempPassword: tempPassword
        })

      } catch (error: any) {
        // Mark as failed
        await supabaseAdmin
          .from('pending_client_accounts')
          .update({ 
            status: 'failed',
            error_message: error.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', pending.id)

        results.push({
          email: pending.client_email,
          status: 'failed',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function createClientAccount(supabase: any, bookingId: string, userId: string) {
  const { error } = await supabase.rpc('create_client_account_from_booking', {
    p_booking_id: bookingId,
    p_user_id: userId
  })
  if (error) throw error
}
