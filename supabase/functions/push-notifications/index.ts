import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { action, ...payload } = await req.json();

    // --- Authenticate the caller for subscribe/unsubscribe actions ---
    let authenticatedUserId: string | null = null;

    if (action === "subscribe" || action === "unsubscribe") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const anonClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      authenticatedUserId = claimsData.claims.sub as string;
    }

    // --- Authenticate the caller for send action (admin only) ---
    if (action === "send") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const anonClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Only admins/practitioners can send notifications
      const callerId = claimsData.claims.sub as string;
      const { data: hasAdmin } = await supabase.rpc("has_role", { _user_id: callerId, _role: "admin" });
      const { data: hasPractitioner } = await supabase.rpc("has_role", { _user_id: callerId, _role: "practitioner" });
      if (!hasAdmin && !hasPractitioner) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get or generate VAPID keys
    const { data: existingKeys } = await supabase
      .from("vapid_keys")
      .select("*")
      .limit(1)
      .single();

    let vapidKeys;
    if (existingKeys) {
      vapidKeys = {
        publicKey: existingKeys.public_key,
        privateKey: existingKeys.private_key,
      };
    } else {
      vapidKeys = webpush.generateVAPIDKeys();
      await supabase.from("vapid_keys").insert({
        public_key: vapidKeys.publicKey,
        private_key: vapidKeys.privateKey,
      });
    }

    webpush.setVapidDetails(
      "mailto:support@domeimmigration.com",
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    // Action: get-public-key (public, no auth needed)
    if (action === "get-public-key") {
      return new Response(
        JSON.stringify({ publicKey: vapidKeys.publicKey }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: subscribe (authenticated, userId from JWT)
    if (action === "subscribe") {
      const { subscription } = payload;
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: authenticatedUserId!,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" }
      );
      if (error) throw error;
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: unsubscribe (authenticated, userId from JWT)
    if (action === "unsubscribe") {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", authenticatedUserId!);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: send (admin/practitioner only)
    if (action === "send") {
      const { userId, title, body, url, tag } = payload;
      let query = supabase.from("push_subscriptions").select("*");
      if (userId) query = query.eq("user_id", userId);

      const { data: subscriptions, error } = await query;
      if (error) throw error;

      const results = await Promise.allSettled(
        (subscriptions || []).map((sub) =>
          webpush
            .sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              JSON.stringify({ title, body, url, tag })
            )
            .catch(async (err) => {
              if (err.statusCode === 410 || err.statusCode === 404) {
                await supabase
                  .from("push_subscriptions")
                  .delete()
                  .eq("id", sub.id);
              }
              throw err;
            })
        )
      );

      const sent = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return new Response(
        JSON.stringify({ sent, failed }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
