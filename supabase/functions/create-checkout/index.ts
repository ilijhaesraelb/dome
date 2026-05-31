import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const { price_id, mode, donation_amount, guest_email, tax_file_id } = await req.json();
    
    let userEmail: string | null = null;
    let customerId: string | undefined;
    
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader !== "Bearer " + Deno.env.get("SUPABASE_ANON_KEY")) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      userEmail = data.user?.email ?? null;
    }
    
    const isDonation = donation_amount && donation_amount > 0;
    if (!isDonation && !userEmail) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is not set");
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    let line_items;
    if (donation_amount && donation_amount > 0) {
      line_items = [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "D.O.M.E. Donation",
            description: "Support our immigration assistance mission",
          },
          unit_amount: Math.round(donation_amount * 100),
        },
        quantity: 1,
      }];
    } else {
      line_items = [{ price: price_id, quantity: 1 }];
    }

    // Build success/cancel URLs
    let success_url: string;
    let cancel_url: string;

    if (isDonation) {
      success_url = `${req.headers.get("origin")}/portal?donation=success`;
      cancel_url = `${req.headers.get("origin")}/contribution?canceled=true`;
    } else if (tax_file_id) {
      // Tax payment: include session_id for server-side verification
      success_url = `${req.headers.get("origin")}/tax/file/${tax_file_id}/payment?success=true&session_id={CHECKOUT_SESSION_ID}`;
      cancel_url = `${req.headers.get("origin")}/tax/file/${tax_file_id}/payment?canceled=true`;
    } else {
      success_url = `${req.headers.get("origin")}/portal/subscription?success=true`;
      cancel_url = `${req.headers.get("origin")}/portal/subscription?canceled=true`;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : (userEmail || undefined),
      line_items,
      mode: mode || "payment",
      success_url,
      cancel_url,
      submit_type: isDonation ? "donate" : undefined,
      metadata: tax_file_id ? { tax_file_id } : undefined,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-checkout error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
