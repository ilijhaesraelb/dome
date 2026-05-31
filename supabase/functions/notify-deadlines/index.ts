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

  // Verify this is called internally via service role key
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Get VAPID keys
    const { data: vapidRow } = await supabase
      .from("vapid_keys")
      .select("*")
      .limit(1)
      .single();

    if (!vapidRow) {
      return new Response(JSON.stringify({ error: "No VAPID keys" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(
      "mailto:support@domeimmigration.com",
      vapidRow.public_key,
      vapidRow.private_key
    );

    // Find cases with deadlines in the next 3 days (not closed/approved/denied)
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split("T")[0];
    const futureStr = threeDaysLater.toISOString().split("T")[0];

    const { data: cases } = await supabase
      .from("cases")
      .select("id, case_number, case_type, deadline")
      .gte("deadline", todayStr)
      .lte("deadline", futureStr)
      .not("status", "in", '("approved","denied","closed")');

    if (!cases?.length) {
      return new Response(JSON.stringify({ sent: 0, cases: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSent = 0;

    for (const c of cases) {
      // Get participants
      const { data: participants } = await supabase
        .from("case_participants")
        .select("user_id")
        .eq("case_id", c.id);

      if (!participants?.length) continue;

      const userIds = participants.map((p) => p.user_id);
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("user_id", userIds);

      if (!subscriptions?.length) continue;

      const deadlineDate = new Date(c.deadline + "T00:00:00Z");
      const diffDays = Math.ceil(
        (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const urgency =
        diffDays <= 0 ? "today" : diffDays === 1 ? "tomorrow" : `in ${diffDays} days`;

      const results = await Promise.allSettled(
        subscriptions.map((sub) =>
          webpush
            .sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              JSON.stringify({
                title: `⏰ Deadline ${urgency}`,
                body: `Case ${c.case_number} (${c.case_type}) deadline is ${urgency}.`,
                url: "/portal",
                tag: `deadline-${c.id}`,
              })
            )
            .catch(async (err: any) => {
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

      totalSent += results.filter((r) => r.status === "fulfilled").length;
    }

    return new Response(
      JSON.stringify({ sent: totalSent, cases: cases.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
