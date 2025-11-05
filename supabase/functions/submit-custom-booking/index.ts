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

    const requestData = await req.json();
    const {
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      clientType,
      requestedPrice,
      depositAmount,
      projectDetails,
      bookingDate,
      bookingTime,
      honeypot,
    } = requestData;

    // Honeypot check - if filled, it's a bot
    if (honeypot && honeypot.length > 0) {
      console.log("Bot submission detected via honeypot field");
      return new Response(
        JSON.stringify({ error: "Invalid submission" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Comprehensive input validation
    const errors: string[] = [];

    // Validate client name
    if (!clientName || typeof clientName !== 'string' || clientName.trim().length === 0) {
      errors.push("Client name is required");
    } else if (clientName.trim().length > 100) {
      errors.push("Client name must be less than 100 characters");
    }

    // Validate email
    if (!clientEmail || typeof clientEmail !== 'string') {
      errors.push("Email is required");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(clientEmail.trim())) {
        errors.push("Invalid email format");
      } else if (clientEmail.trim().length > 255) {
        errors.push("Email must be less than 255 characters");
      }
    }

    // Validate phone
    if (!clientPhone || typeof clientPhone !== 'string' || clientPhone.trim().length === 0) {
      errors.push("Phone number is required");
    } else if (clientPhone.trim() !== "N/A" && clientPhone.trim().length > 50) {
      errors.push("Phone number must be less than 50 characters");
    }

    // Validate client type
    if (!clientType || !['commercial', 'small_business'].includes(clientType)) {
      errors.push("Invalid client type");
    }

    // Validate requested price
    if (typeof requestedPrice !== 'number' || requestedPrice < 300 || requestedPrice > 100000) {
      errors.push("Requested price must be between $300 and $100,000");
    }

    // Validate deposit amount
    if (typeof depositAmount !== 'number' || depositAmount < 0 || depositAmount > requestedPrice) {
      errors.push("Invalid deposit amount");
    }

    // Validate project details (optional but has max length)
    if (projectDetails && typeof projectDetails === 'string' && projectDetails.length > 5000) {
      errors.push("Project details must be less than 5000 characters");
    }

    // Validate company name if provided
    if (clientCompany && typeof clientCompany === 'string' && clientCompany.length > 200) {
      errors.push("Company name must be less than 200 characters");
    }

    // Validate booking date
    if (!bookingDate || typeof bookingDate !== 'string') {
      errors.push("Booking date is required");
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(bookingDate)) {
        errors.push("Invalid booking date format (use YYYY-MM-DD)");
      }
    }

    // Validate booking time
    if (!bookingTime || typeof bookingTime !== 'string' || bookingTime.trim().length === 0) {
      errors.push("Booking time is required");
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: errors }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Sanitize inputs by trimming whitespace
    const sanitizedData = {
      client_name: clientName.trim(),
      client_email: clientEmail.trim().toLowerCase(),
      client_phone: clientPhone.trim(),
      client_company: clientCompany?.trim() || null,
      client_type: clientType,
      requested_price: requestedPrice,
      deposit_amount: depositAmount,
      project_details: projectDetails?.trim() || null,
      booking_date: bookingDate,
      booking_time: bookingTime.trim(),
      status: "pending",
    };

    // Insert custom booking request with sanitized data
    const { data: booking, error: insertError } = await supabaseClient
      .from("custom_booking_requests")
      .insert(sanitizedData)
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      
      // Check if it's a rate limit error
      if (insertError.message?.includes("check_recent_booking_submission")) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please wait 5 minutes before submitting another request from the same email." 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 429,
          }
        );
      }
      
      // Generic error for security (don't expose internal details)
      return new Response(
        JSON.stringify({ error: "Unable to submit booking request. Please check your information and try again." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // BOOKING FLOW: Client submits custom request (NOT paid yet)
    // Status: "pending" - waiting for admin approval
    // NO opportunity created yet - will be created when admin approves/marks as lead
    console.log("Custom booking request submitted:", booking.id);
    console.log("Opportunity will be created when admin approves or marks as lead");

    // Send email notification to admin
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    // Use sanitized data for emails to prevent injection
    try {
      const adminEmail = await resend.emails.send({
        from: "NVision Films <contact@nvisionfilms.com>",
        to: ["nvisionmg@gmail.com"],
        subject: `New Custom Booking Request from ${sanitizedData.client_name}`,
      html: `
        <h1>New Custom Booking Request</h1>
        <p><strong>Client:</strong> ${sanitizedData.client_name}</p>
        <p><strong>Email:</strong> ${sanitizedData.client_email}</p>
        <p><strong>Phone:</strong> ${sanitizedData.client_phone}</p>
        ${sanitizedData.client_company ? `<p><strong>Company:</strong> ${sanitizedData.client_company}</p>` : ""}
        <p><strong>Client Type:</strong> ${clientType === "commercial" ? "Commercial/Agency" : "Small Business/Independent"}</p>
        <p><strong>Requested Price:</strong> $${requestedPrice}</p>
        <p><strong>Deposit (Auto-calculated):</strong> $${depositAmount}</p>
        <p><strong>Booking Date:</strong> ${bookingDate}</p>
        <p><strong>Booking Time:</strong> ${sanitizedData.booking_time}</p>
        <p><strong>Project Details:</strong></p>
        <p>${sanitizedData.project_details || "No details provided"}</p>
        <hr/>
        <p>View and manage this request in your admin dashboard:</p>
        <p><a href="${req.headers.get("origin")}/admin/bookings">Admin Dashboard</a></p>
      `,
      });
      console.log("Admin notification email sent successfully:", adminEmail);
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError);
      // Don't fail the booking if email fails
    }

    // Send confirmation email to client using sanitized data
    try {
      const clientEmail = await resend.emails.send({
        from: "NVision Films <contact@nvisionfilms.com>",
      to: [sanitizedData.client_email],
      subject: "Custom Booking Request Received",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Thank you for your custom booking request!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi ${sanitizedData.client_name},</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">We've received your custom booking request and Eric will review it shortly.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #555; margin-top: 0; font-size: 18px;">Your Request Details:</h2>
            <p style="margin: 8px 0; color: #333;"><strong>Requested Budget:</strong> $${requestedPrice}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Deposit (if approved):</strong> $${depositAmount}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Preferred Date:</strong> ${bookingDate}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Preferred Time:</strong> ${sanitizedData.booking_time}</p>
          </div>
          ${clientType === "commercial" ? `<p style="font-size: 16px; line-height: 1.6; color: #333;"><em>Commercial terms will be discussed based on your project scope.</em></p>` : ""}
          <p style="font-size: 16px; line-height: 1.6; color: #333;">You'll receive an email once your request is reviewed with either an approval or a counter-offer.</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br/>Eric Sattler<br/>New Vision Production</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            New Vision Production | NVision Films<br>
            If you have questions, reply to this email.
          </p>
        </div>
      `,
      });
      console.log("Client confirmation email sent successfully:", clientEmail);
    } catch (emailError) {
      console.error("Failed to send client confirmation email:", emailError);
      // Don't fail the booking if email fails
    }

    return new Response(
      JSON.stringify({ success: true, bookingId: booking.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error submitting custom booking:", error);
    
    // Return generic error message for security (don't expose internal details)
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred. Please try again later or contact support if the problem persists." 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});