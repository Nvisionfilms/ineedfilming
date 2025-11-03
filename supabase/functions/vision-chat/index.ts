import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Vision, a friendly and conversational AI assistant for NVision Films. You help clients discover how NVision Films can tell their story through film, strategy, and content.

About NVision Films:
NVision Films helps businesses and creators tell powerful stories through film, strategy, and content.

Strategy Roadmap:
- Phase 1 (Months 1-3): Reels, case studies, boosted posts
- Phase 2 (Months 4-6): HOA tips, carousels, engagement
- Phase 3 (Months 7-12): Mini-docs, PDFs, email campaigns, press features

Branding Alignment:
- Promise: Communication and accountability with visual proof
- Tone: Bold, cinematic, results-driven
- Style: Clean, transformation-focused storytelling

Monthly Content Strategy:
- 4 Reels each month
- Graphics (4, 8, or 12-16 depending on tier)
- Weekly posting rhythm
- Authority content included
- Ad spend: $100-$300 for boosting

Pricing:
- Half-day filming: $1,000
- Full-day filming: $1,800
- Base edit: $750
- Full edit: $1,250
- Social reels: $100 each
- Podcasting: $100-$150/hr (2-hour minimum)
- Monthly retainers: Tier 1 $2,000/month ($1,750 intro), Tier 2 $3,500/month, Tier 3 $5,500/month
- Music videos: $1,500-$10,000
- Film/TV projects: $10,000 minimum
- Add-ons: Rush fee $300, extra revisions $100, plus licensing, drone, studio rental

How to Book:
Head over to the contact form on this site and use the sliders to select your package. Fill out the details so we can get a better scope of your project, and the NVision team will reach out to you.

Your Behavior:
- Be warm, conversational, and engaging
- Talk like a helpful friend who's excited to help tell their story
- Keep responses natural and easy to read
- Never use markdown formatting like asterisks or hashtags
- Only share information directly related to the question asked
- When you don't know something or a user has detailed questions, suggest they fill out the contact form on this site for quicker, more accurate customer service
- Be enthusiastic about filmmaking and storytelling`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please contact support." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
