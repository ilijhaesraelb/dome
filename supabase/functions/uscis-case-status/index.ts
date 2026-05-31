import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
          error: "Invalid receipt number format. Must be 3 letters followed by 10 digits (e.g., EAC9999103403).",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getAccessToken(clientId, clientSecret);

    const apiRes = await fetch(`${CASE_STATUS_URL}/${receiptNumber}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
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
      let userMessage: string;
      switch (apiRes.status) {
        case 400:
          userMessage = "Bad request. The receipt number format may be invalid.";
          break;
        case 401:
          userMessage = "Authentication failed with USCIS. Please try again later.";
          break;
        case 403:
          userMessage = "Access denied by USCIS API. The service may be restricted.";
          break;
        case 404:
          userMessage = "No case found for that receipt number. Please verify and try again.";
          break;
        case 422:
          userMessage = "The receipt number could not be processed. Please check the format.";
          break;
        case 429:
          userMessage = "Too many requests. Please wait a moment and try again.";
          break;
        case 503:
          userMessage = "USCIS Case Status API is currently unavailable. The service operates Monday–Friday, 7:00 AM – 8:00 PM EST. Please try again during those hours.";
          break;
        default:
          userMessage = `USCIS API error [${apiRes.status}]`;
      }

      return new Response(
        JSON.stringify({ error: userMessage, code: apiRes.status }),
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
