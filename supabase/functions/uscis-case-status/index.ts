import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Add any other origins the app is served from (e.g. a Lovable preview URL) here.
const ALLOWED_ORIGINS = new Set([
  "https://domeimmigration.com",
  "https://www.domeimmigration.com",
  "http://localhost:8080",
]);

function getCorsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://domeimmigration.com",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    Vary: "Origin",
  };
}

const USCIS_BASE = "https://api-int.uscis.gov";
const TOKEN_URL = `${USCIS_BASE}/oauth/accesstoken`;
const CASE_STATUS_URL = `${USCIS_BASE}/case-status`;

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
    
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OAuth token request failed [${res.status}]: ${body}`);
  }

  const data = await res.json();
  const token = data.access_token;
  const expiresIn = data.expires_in || 3600;

  cachedToken = {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return token;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ code: 401, message: "Invalid Access Token", error: "Invalid Access Token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ code: 401, message: "Invalid Access Token", error: "Invalid Access Token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: 10 lookups per 60s per user, tracked server-side via a SECURITY DEFINER function
    // (auth.uid() is read inside the function itself, so it can't be spoofed by the caller).
    const { data: withinLimit, error: rateLimitError } = await supabase.rpc("check_uscis_rate_limit", {
      max_requests: 10,
      window_seconds: 60,
    });

    if (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!withinLimit) {
      return new Response(
        JSON.stringify({ code: 429, message: "Spike Arrest Violation", error: "Spike Arrest Violation" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientId = Deno.env.get("USCIS_CLIENT_ID");
    if (!clientId) {
      console.error("USCIS_CLIENT_ID is not configured");
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientSecret = Deno.env.get("USCIS_CLIENT_SECRET");
    if (!clientSecret) {
      console.error("USCIS_CLIENT_SECRET is not configured");
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { receiptNumber } = await req.json();

    if (!receiptNumber || typeof receiptNumber !== "string") {
      return new Response(
        JSON.stringify({ error: "receiptNumber is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const receiptRegex = /^[a-zA-Z]{3}\d{10}$/;
    if (!receiptRegex.test(receiptNumber)) {
      return new Response(
        JSON.stringify({
          code: 422,
          message: "The application receipt number is not formatted correctly, It should be total of 13 characters (3 character prefix followed by 10 digits). Please check your receipt number and try again",
          error: "The application receipt number is not formatted correctly, It should be total of 13 characters (3 character prefix followed by 10 digits). Please check your receipt number and try again",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Restrict lookups to receipt numbers tied to a case the caller participates in.
    // Runs through the caller-scoped client so RLS (is_case_participant / practitioner role) applies.
    const { data: filings, error: filingError } = await supabase
      .from("immigration_filings")
      .select("receipt_number")
      .not("receipt_number", "is", null);

    if (filingError) {
      console.error("Immigration filings ownership check failed:", filingError);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalize = (v: string) => v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const isOwned = (filings ?? []).some((f) => f.receipt_number && normalize(f.receipt_number) === receiptNumber);

    if (!isOwned) {
      return new Response(
        JSON.stringify({ error: "This receipt number is not associated with your account." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getAccessToken(clientId, clientSecret);

    const apiRes = await fetch(`${CASE_STATUS_URL}/${receiptNumber}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        demo_id: "3879",
      },
    });

    const responseText = await apiRes.text();
    let responseBody: Record<string, unknown>;
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = { raw: responseText };
    }

    if (!apiRes.ok) {
      const bodyMessage = typeof responseBody?.message === "string" ? responseBody.message : undefined;
      const bodyError = typeof responseBody?.error === "string" ? responseBody.error : undefined;
      const statusMessage = bodyMessage || bodyError || (() => {
        switch (apiRes.status) {
          case 400:
            return "Bad request. The receipt number format may be invalid.";
          case 401:
            return "Invalid Access Token";
          case 403:
            return "Access denied by USCIS API. The service may be restricted.";
          case 404:
            return "Case Status Online does not recognize the receipt number entered. Please check your receipt number and try again. If you need further assistance, please call the USCIS Contact Center at 1-800-375-5283.";
          case 422:
            return "The application receipt number is not formatted correctly, It should be total of 13 characters (3 character prefix followed by 10 digits). Please check your receipt number and try again";
          case 429:
            return "Spike Arrest Violation";
          case 503:
            return "Service Unavailable";
          default:
            return `USCIS API error [${apiRes.status}]`;
        }
      })();

      return new Response(
        JSON.stringify({ error: statusMessage, code: apiRes.status, message: statusMessage }),
        { status: apiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("USCIS Case Status error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
