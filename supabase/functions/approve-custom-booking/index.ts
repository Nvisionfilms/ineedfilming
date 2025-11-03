import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@3.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { bookingId, action, counterPrice, adminNotes } = await req.json();

    // Initialize Resend and get origin for email links
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const origin = req.headers.get("origin") || "";

    // Get the booking
    const { data: booking, error: fetchError } = await supabaseClient
      .from("custom_booking_requests")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchError) throw fetchError;

    let updateData: any = {
      admin_notes: adminNotes,
    };

    if (action === "approve") {
      updateData.status = "approved";
      updateData.approved_price = booking.requested_price;
      updateData.approved_at = new Date().toISOString();
    } else if (action === "counter") {
      updateData.status = "countered";
      updateData.counter_price = counterPrice;
      // Recalculate deposit for counter price
      updateData.deposit_amount = counterPrice >= 5000 ? counterPrice * 0.3 : counterPrice * 0.5;
    } else if (action === "reject") {
      updateData.status = "rejected";
    }

    // Update booking
    const { error: updateError } = await supabaseClient
      .from("custom_booking_requests")
      .update(updateData)
      .eq("id", bookingId);

    if (updateError) throw updateError;

    // When approved, create opportunity, project, and client account
    if (action === "approve") {
      console.log("Creating opportunity for approved booking");
      
      // Create or update opportunity
      const { data: opportunity, error: oppError } = await supabaseClient
        .from("opportunities")
        .insert({
          contact_name: booking.client_name,
          contact_email: booking.client_email,
          contact_phone: booking.client_phone,
          company: booking.client_company,
          service_type: booking.project_details?.substring(0, 100) || "Custom Booking",
          budget_min: booking.requested_price,
          budget_max: booking.requested_price,
          notes: `Approved custom booking. ${booking.project_details || ""}`,
          stage: "won",
          source: "custom_booking"
        })
        .select()
        .single();

      if (oppError) {
        console.error("Error creating opportunity:", oppError);
      } else {
        console.log("Opportunity created:", opportunity.id);
      }

      // Create project
      console.log("Creating project for approved booking");
      const { error: projectError } = await supabaseClient
        .from("projects")
        .insert({
          project_name: `${booking.client_name} - ${booking.client_company || "Project"}`,
          project_type: "Custom Video Production",
          booking_id: bookingId,
          opportunity_id: opportunity?.id,
          status: "pre_production",
          shoot_date: booking.booking_date,
          notes: booking.project_details
        });

      if (projectError) {
        console.error("Error creating project:", projectError);
      } else {
        console.log("Project created successfully");
      }

      // Create client account with auth user
      console.log("Creating client account for approved booking");
      
      // Generate a temporary password
      const tempPassword = `NV${Math.random().toString(36).slice(-8)}${Date.now().toString(36).slice(-4)}!`;
      
      // Create auth user
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: booking.client_email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: booking.client_name,
        },
      });

      if (authError) {
        console.error("Error creating auth user:", authError);
      } else if (authData.user) {
        console.log("Auth user created:", authData.user.id);
        
        // Create client account
        const { error: clientError } = await supabaseClient
          .from("client_accounts")
          .insert({
            user_id: authData.user.id,
            booking_id: bookingId,
            company_name: booking.client_company || booking.client_name,
            status: "active",
          });

        if (clientError) {
          console.error("Error creating client account:", clientError);
        } else {
          console.log("Client account created successfully");
        }

        // Add client role
        const { error: roleError } = await supabaseClient
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "client",
          });

        if (roleError) {
          console.error("Error adding client role:", roleError);
        }

        // Send credentials email
        try {
          await resend.emails.send({
            from: "Eric Sattler <contact@nvisionfilms.com>",
            to: [booking.client_email],
            subject: "Your Client Portal Access - New Vision Production",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #10b981;">Welcome to New Vision Production!</h1>
                <p>Hi ${booking.client_name},</p>
                <p>Your booking has been approved and we've created your client portal account.</p>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="margin-top: 0;">Your Login Credentials:</h2>
                  <p><strong>Email:</strong> ${booking.client_email}</p>
                  <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                </div>
                <p><strong>Important:</strong> Please change your password after your first login.</p>
                <div style="margin: 30px 0; text-align: center;">
                  <a href="${origin}/client/login" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Access Client Portal</a>
                </div>
                <p>In your portal, you can:</p>
                <ul>
                  <li>View project status and deliverables</li>
                  <li>Upload and share files</li>
                  <li>Communicate with our team</li>
                  <li>Track project milestones</li>
                </ul>
                <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br/>Eric Sattler<br/>New Vision Production</p>
              </div>
            `,
          });
        } catch (emailError) {
          console.error("Error sending credentials email:", emailError);
        }
      }
    }

    // Send email to client based on action
    if (action === "approve") {
      await resend.emails.send({
        from: "Eric Sattler <contact@nvisionfilms.com>",
        to: [booking.client_email],
        subject: "Your Custom Booking Request is Approved!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #10b981; font-size: 24px; margin-bottom: 20px;">Great news, ${booking.client_name}!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Your custom booking request has been approved.</p>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h2 style="color: #333; margin-top: 0; font-size: 18px;">Approved Details:</h2>
              <p style="margin: 8px 0; color: #333;"><strong>Total Price:</strong> $${booking.requested_price.toLocaleString()}</p>
              <p style="margin: 8px 0; color: #333;"><strong>Deposit Required:</strong> $${booking.deposit_amount.toLocaleString()}</p>
              <p style="margin: 8px 0; color: #333;"><strong>Booking Date:</strong> ${booking.booking_date}</p>
              <p style="margin: 8px 0; color: #333;"><strong>Booking Time:</strong> ${booking.booking_time}</p>
            </div>
            ${adminNotes ? `<p style="font-size: 16px; line-height: 1.6; color: #333;"><strong>Note from Eric:</strong> ${adminNotes}</p>` : ""}
            <div style="margin: 30px 0; text-align: center;">
              <a href="${origin}/booking-portal?token=${booking.approval_token}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Complete Your Booking</a>
            </div>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">This link is unique to you and will pre-fill your approved pricing. Click to proceed to payment.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br/>Eric Sattler<br/>New Vision Production</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              New Vision Production | NVision Films<br>
              If you have questions, reply to this email.
            </p>
          </div>
        `,
      });
    } else if (action === "counter") {
      await resend.emails.send({
        from: "Eric Sattler <contact@nvisionfilms.com>",
        to: [booking.client_email],
        subject: "Counter-Offer for Your Custom Booking",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #f59e0b; font-size: 24px; margin-bottom: 20px;">Hi ${booking.client_name},</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you for your custom booking request. After reviewing your project details, here's what I can offer:</p>
            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h2 style="color: #333; margin-top: 0; font-size: 18px;">Counter-Offer Details:</h2>
              <p style="margin: 8px 0; color: #333;"><strong>Your Requested Price:</strong> $${booking.requested_price.toLocaleString()}</p>
              <p style="margin: 8px 0; color: #333;"><strong>Proposed Price:</strong> $${counterPrice.toLocaleString()}</p>
              <p style="margin: 8px 0; color: #333;"><strong>Deposit Required:</strong> $${updateData.deposit_amount.toLocaleString()}</p>
              <p style="margin: 8px 0; color: #333;"><strong>Booking Date:</strong> ${booking.booking_date}</p>
              <p style="margin: 8px 0; color: #333;"><strong>Booking Time:</strong> ${booking.booking_time}</p>
            </div>
            ${adminNotes ? `<p style="font-size: 16px; line-height: 1.6; color: #333;"><strong>Details:</strong> ${adminNotes}</p>` : ""}
            <p style="font-size: 16px; line-height: 1.6; color: #333;">If you're happy with this pricing, click the link below to complete your booking:</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${origin}/booking-portal?token=${booking.approval_token}" style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept & Book Now</a>
            </div>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">If you have questions or would like to discuss further, feel free to reply to this email.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br/>Eric Sattler<br/>New Vision Production</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              New Vision Production | NVision Films<br>
              If you have questions, reply to this email.
            </p>
          </div>
        `,
      });
    } else if (action === "reject") {
      await resend.emails.send({
        from: "Eric Sattler <contact@nvisionfilms.com>",
        to: [booking.client_email],
        subject: "Regarding Your Custom Booking Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #ef4444; font-size: 24px; margin-bottom: 20px;">Hi ${booking.client_name},</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you for your interest in working with New Vision Production.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Unfortunately, I'm unable to accommodate your custom booking request at this time.</p>
            ${adminNotes ? `<div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;"><p style="margin: 0; color: #333;"><strong>Note:</strong> ${adminNotes}</p></div>` : ""}
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Please feel free to reach out if you'd like to discuss alternative options or future projects.</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br/>Eric Sattler<br/>New Vision Production</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              New Vision Production | NVision Films<br>
              If you have questions, reply to this email.
            </p>
          </div>
        `,
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error processing booking approval:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});