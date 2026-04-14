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

    const { style, colorScheme, brandName } = await req.json();

    if (!style || typeof style !== "string") {
      return new Response(JSON.stringify({ error: "style is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stylePrompts: Record<string, string> = {
      classic: "classic elegant business invoice header banner, subtle line art decoration, professional",
      modern: "modern geometric abstract invoice header banner, clean lines, professional business",
      creative: "creative artistic invoice header banner, watercolor style subtle decoration, professional",
      minimal: "minimal thin line invoice header decoration, very subtle, professional business",
    };

    const prompt = `${stylePrompts[style] || stylePrompts.minimal}. ${colorScheme ? `Color scheme: ${colorScheme}.` : "Monochrome grayscale."} ${brandName ? `For brand "${brandName}".` : ""} Wide banner format, 800x200px aspect ratio, clean white background, suitable as invoice header decoration.`;

    const response = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: { width: 1024, height: 256 },
        num_inference_steps: 4,
        num_images: 2,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("fal.ai error:", response.status, errText);
      throw new Error(`fal.ai API error: ${response.status}`);
    }

    const data = await response.json();
    const images = data.images?.map((img: any) => img.url).filter(Boolean) || [];

    if (images.length === 0) {
      throw new Error("No images generated");
    }

    return new Response(JSON.stringify({ templates: images }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-invoice-template error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
