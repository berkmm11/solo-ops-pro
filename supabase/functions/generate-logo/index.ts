import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FAL_API_KEY = Deno.env.get("FAL_API_KEY");
    if (!FAL_API_KEY) throw new Error("FAL_API_KEY is not configured");

    const { brandName, specialty, style, colorPreference } = await req.json();

    if (!brandName || typeof brandName !== "string") {
      return new Response(JSON.stringify({ error: "brandName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const styleMap: Record<string, string> = {
      minimalist: "minimalist, clean lines, simple geometric shapes",
      modern: "modern, sleek, professional, flat design",
      bold: "bold, strong typography, impactful",
      playful: "playful, colorful, fun, rounded shapes",
      elegant: "elegant, luxurious, sophisticated, serif typography",
    };

    const styleDesc = styleMap[style] || styleMap.minimalist;
    const colorNote = colorPreference ? `, using ${colorPreference} color palette` : "";
    const specialtyNote = specialty ? ` for a ${specialty} professional` : "";

    const prompt = `Design a professional logo${specialtyNote}. Brand name: "${brandName}". Style: ${styleDesc}${colorNote}. The logo should be on a clean white background, suitable for business use. High quality, vector-style, centered composition.`;

    // Generate 2 alternatives using fal.ai flux/schnell
    const results = [];
    for (let i = 0; i < 2; i++) {
      const response = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
        method: "POST",
        headers: {
          Authorization: `Key ${FAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt + (i === 1 ? " Alternative design variation." : ""),
          image_size: "square",
          num_inference_steps: 4,
          num_images: 1,
          enable_safety_checker: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("fal.ai error:", response.status, errText);
        throw new Error(`fal.ai API error: ${response.status}`);
      }

      const data = await response.json();
      const imageUrl = data.images?.[0]?.url;
      if (imageUrl) {
        results.push(imageUrl);
      }
    }

    if (results.length === 0) {
      throw new Error("No images generated");
    }

    return new Response(JSON.stringify({ logos: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-logo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
