import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sen soloops adlı Türk freelancer uygulamasının AI asistanısın. Kullanıcıya her konuda yardım edersin — fatura, müşteri, vergi, nakit akışı, freelance iş tavsiyeleri. Her zaman Türkçe, samimi ve yardımsever bir tonla yanıt ver. Veri soruları için aşağıdaki JSON'u kullan. Veri dışı genel sorular gelirse de yardım et, freelance profesyonel için bir arkadaş gibi davran. ASLA 'bilmiyorum' veya 'yardım edemem' deme — her zaman faydalı bir yanıt ver.`;

const FALLBACK_MESSAGE =
  "Şu an bir aksaklık var, lütfen biraz sonra tekrar dene. 🙏";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Yetkilendirme gerekli." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate user via JWT claims (faster, no server round-trip)
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Kullanıcı doğrulanamadı." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = claimsData.claims.sub as string;

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages alanı gerekli." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Fetch full database context ──

    const [clientsRes, projectsRes, invoicesRes, expensesRes] = await Promise.all([
      supabase.from("clients").select("id, name, trust_score").eq("user_id", userId),
      supabase.from("projects").select("id, title, status, price, deadline, client_id").eq("user_id", userId),
      supabase.from("invoices").select("id, invoice_no, amount, status, due_date, issue_date, client_id, description").eq("user_id", userId),
      supabase.from("expenses").select("id, name, amount, category, expense_date").eq("user_id", userId).order("expense_date", { ascending: false }).limit(20),
    ]);

    const clients = clientsRes.data || [];
    const projects = projectsRes.data || [];
    const invoices = invoicesRes.data || [];
    const expenses = expensesRes.data || [];

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    const pendingInvoices = invoices
      .filter((i: any) => i.status === "pending")
      .map((i: any) => ({
        invoice_no: i.invoice_no,
        amount: i.amount,
        due_date: i.due_date,
      }));

    const overdueInvoices = invoices
      .filter((i: any) => i.status === "overdue")
      .map((i: any) => {
        const client = clients.find((c: any) => c.id === i.client_id);
        const daysOverdue = Math.floor(
          (now.getTime() - new Date(i.due_date).getTime()) / 86400000
        );
        return {
          invoice_no: i.invoice_no,
          amount: i.amount,
          due_date: i.due_date,
          client_name: client?.name || "Bilinmeyen",
          days_overdue: daysOverdue,
        };
      });

    const paidThisMonth = invoices
      .filter((i: any) => i.status === "paid" && i.issue_date >= thisMonthStart)
      .reduce((sum: number, i: any) => sum + Number(i.amount), 0);

    const dbContext = {
      toplam_musteri: clients.length,
      toplam_proje: projects.length,
      toplam_fatura: invoices.length,
      bekleyen_faturalar: pendingInvoices,
      geciken_faturalar: overdueInvoices,
      bu_ay_tahsilat: paidThisMonth,
      son_giderler: expenses.slice(0, 10).map((e: any) => ({
        ad: e.name,
        tutar: e.amount,
        kategori: e.category,
        tarih: e.expense_date,
      })),
    };

    // Build messages with context injected into last user message
    const lastUserMsg = messages[messages.length - 1];
    const contextualContent = `${lastUserMsg.content}\n\n--- Kullanıcının güncel verileri (JSON) ---\n${JSON.stringify(dbContext, null, 2)}`;

    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(0, -1),
      { role: "user", content: contextualContent },
    ];

    // ── Call AI Gateway ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ message: FALLBACK_MESSAGE }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: aiMessages,
          max_tokens: 1000,
        }),
      }
    );

    if (!aiResponse.ok) {
      console.error("AI gateway error:", aiResponse.status, await aiResponse.text());
      return new Response(
        JSON.stringify({ message: FALLBACK_MESSAGE }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const message = aiData.choices?.[0]?.message?.content || FALLBACK_MESSAGE;

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("solo-copilot error:", e);
    return new Response(
      JSON.stringify({ message: FALLBACK_MESSAGE }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
