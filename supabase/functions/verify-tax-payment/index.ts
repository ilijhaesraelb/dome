import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-TAX-PAYMENT] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { session_id, tax_file_id } = await req.json();
    logStep("Request received", { session_id, tax_file_id });

    if (!session_id || !tax_file_id) {
      return new Response(JSON.stringify({ error: "session_id and tax_file_id are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid auth token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    // OWNERSHIP CHECK: ensure the authenticated user owns this tax file
    const { data: taxFile, error: taxFileError } = await supabase
      .from("tax_files")
      .select("user_id, payment_status")
      .eq("id", tax_file_id)
      .single();

    if (taxFileError || !taxFile) {
      logStep("Tax file not found", { tax_file_id });
      return new Response(JSON.stringify({ error: "Tax file not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (taxFile.user_id !== userId) {
      logStep("OWNERSHIP DENIED", { userId, fileOwner: taxFile.user_id, tax_file_id });
      return new Response(JSON.stringify({ error: "You do not have permission to verify this tax file" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // IDEMPOTENCY: if already paid, return success without re-updating
    if (taxFile.payment_status === "paid") {
      logStep("Already paid — idempotent return", { tax_file_id });
      return new Response(JSON.stringify({
        verified: true,
        payment_status: "paid",
        already_paid: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify the checkout session with Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Stripe session retrieved", { status: session.payment_status, amount: session.amount_total });

    if (session.payment_status !== "paid") {
      logStep("Payment NOT confirmed", { payment_status: session.payment_status });
      return new Response(JSON.stringify({
        verified: false,
        payment_status: session.payment_status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Payment is verified by Stripe — now update the DB using service role (bypasses RLS)
    const { error: updateError } = await supabase.from("tax_files").update({
      payment_status: "paid",
      status: "paid_ready_export",
      payment_amount_cents: session.amount_total || 0,
      stripe_session_id: session.id,
      paid_at: new Date().toISOString(),
    }).eq("id", tax_file_id);

    if (updateError) {
      logStep("DB update failed", { error: updateError.message });
      return new Response(JSON.stringify({ error: "Failed to update payment record" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Payment verified and DB updated", { tax_file_id, amount: session.amount_total });

    return new Response(JSON.stringify({
      verified: true,
      payment_status: "paid",
      amount_cents: session.amount_total,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
