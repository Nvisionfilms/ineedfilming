import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify the requesting user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("User is not an admin");
    }

    const { email, password, full_name, company_name, project_id, booking_id } = await req.json();

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      // Check if user already has a client account
      const { data: existingClient } = await supabaseAdmin
        .from("client_accounts")
        .select("id")
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingClient) {
        throw new Error("This email already has a client account");
      }

      userId = existingUser.id;
      
      // Update existing user's metadata if full_name is provided
      if (full_name) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existingUser.user_metadata,
            full_name: full_name,
          },
        });
      }
    } else {
      // Create new user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || "",
        },
      });

      if (authError) {
        throw new Error(`Failed to create user: ${authError.message}`);
      }
      if (!authData.user) throw new Error("User creation failed");
      
      userId = authData.user.id;
    }

    // Create client account
    const { error: clientError } = await supabaseAdmin
      .from("client_accounts")
      .insert({
        user_id: userId,
        project_id: project_id || null,
        booking_id: booking_id || null,
        company_name: company_name || null,
        created_by: user.id,
      });

    if (clientError) throw clientError;

    // Add client role (if not already exists)
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "client")
      .single();

    if (!existingRole) {
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "client",
        });

      if (roleInsertError) throw roleInsertError;
    }

    // Send welcome email with credentials
    const origin = req.headers.get("origin") || "https://12dbbf59-658d-48d9-b9c3-ec1854bd439f.lovableproject.com";
    const portalUrl = `${origin}/client/login`;

    try {
      await resend.emails.send({
        from: "NVISION FILMS LLC <contact@nvisionfilms.com>",
        to: [email],
        subject: "Welcome to NVISION FILMS LLC Client Portal",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://static.wixstatic.com/media/e05d6c_796390cb4e7a447ebd2fa7dc927276c3~mv2.png/v1/fill/w_219,h_114,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/e05d6c_796390cb4e7a447ebd2fa7dc927276c3~mv2.png" alt="NVISION FILMS LLC" style="max-width: 180px; height: auto;" />
            </div>
            <h1>Welcome to NVISION FILMS LLC Client Portal!</h1>
            <p>Hi ${full_name || "there"},</p>
            <p>Your client portal account has been created. Here are your login credentials:</p>
            <p><strong>Email:</strong> ${email}<br>
            <strong>Temporary Password:</strong> ${password}</p>
            <p><a href="${portalUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; margin: 16px 0;">Login to Portal</a></p>
            <p><strong>Important:</strong> For security, please change your password after your first login by going to Settings.</p>
            <p>Best regards,<br/>NVISION FILMS LLC</p>
          </div>
        `,
      });

      console.log("Welcome email sent successfully to:", email);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
