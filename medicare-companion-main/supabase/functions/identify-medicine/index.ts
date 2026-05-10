// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { imageUrl, notes } = await req.json();
    const gatewayApiKey = Deno.env.get("AI_GATEWAY_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    if (!gatewayApiKey) throw new Error("AI gateway API key not configured (set AI_GATEWAY_API_KEY or LOVABLE_API_KEY)");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${gatewayApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a medical assistant. Examine the medicine photo and provide: 1) Likely medicine name 2) Common uses 3) Typical dosage 4) Key warnings. Be concise. Always remind the user to consult a doctor or pharmacist before taking any medication." },
          { role: "user", content: [
            { type: "text", text: `Identify this medicine. User notes: ${notes || "none"}` },
            { type: "image_url", image_url: { url: imageUrl } },
          ] },
        ],
      }),
    });
    if (!response.ok) {
      const t = await response.text();
      return new Response(JSON.stringify({ error: t }), { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ analysis }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
