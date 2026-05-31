 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Full JSON rules evaluator supporting: ==, !=, in, >=, <=, >, <, exists, all, any, not
function resolveVar(path: string, answers: Record<string, unknown>): unknown {
  const clean = path.replace(/^answers\./, "");
  return answers[clean];
}

function evaluateExpr(expr: Record<string, unknown>, answers: Record<string, unknown>): boolean {
  if (!expr || typeof expr !== "object") return false;
  if (expr.always === true) return true;

  if ("var" in expr) {
    const val = resolveVar(expr["var"] as string, answers);
    if ("==" in expr) return val === expr["=="];
    if ("!=" in expr) return val !== expr["!="];
    if ("in" in expr) {
      const list = expr["in"] as unknown[];
      return Array.isArray(list) && list.includes(val);
    }
    if (">=" in expr) return typeof val === "number" && val >= (expr[">="] as number);
    if ("<=" in expr) return typeof val === "number" && val <= (expr["<="] as number);
    if (">" in expr) return typeof val === "number" && val > (expr[">"] as number);
    if ("<" in expr) return typeof val === "number" && val < (expr["<"] as number);
    if ("exists" in expr) {
      const exists = val !== undefined && val !== null;
      return expr["exists"] === true ? exists : !exists;
    }
  }

  if ("all" in expr) {
    return (expr["all"] as Record<string, unknown>[]).every((r) => evaluateExpr(r, answers));
  }
  if ("any" in expr) {
    return (expr["any"] as Record<string, unknown>[]).some((r) => evaluateExpr(r, answers));
  }
  if ("not" in expr) {
    return !evaluateExpr(expr["not"] as Record<string, unknown>, answers);
  }

  return false;
}

async function getCallerId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  try {
    const { data: { user } } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { authorization: authHeader } } }
    ).auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, session_id, question_id, answer_value, source, confidence, pathway_id, locale } = await req.json();

    // ACTION: create_session
    if (action === "create_session") {
      const authHeader = req.headers.get("authorization");
      let userId = null;
      if (authHeader) {
        const { data: { user } } = await createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { authorization: authHeader } } }
        ).auth.getUser();
        userId = user?.id || null;
      }

      const { data, error } = await supabase
        .from("pathway_sessions")
        .insert({ user_id: userId, disclaimer_ack: false, locale: locale || "en" })
        .select("id")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ session_id: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: next_question / answer
    if (action === "next_question" || action === "answer") {
      // Verify session ownership
      const callerId = await getCallerId(req);
      const { data: sess } = await supabase.from("pathway_sessions").select("user_id").eq("id", session_id).single();
      if (sess?.user_id && callerId && sess.user_id !== callerId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Save answer if provided
      if (question_id && answer_value !== undefined) {
        await supabase.from("pathway_answers").insert({
          session_id,
          question_id,
          answer_value,
          source: source || "TYPED",
          confidence: confidence || 1.0,
        });
      }

      // Get all answers for this session
      const { data: existingAnswers } = await supabase
        .from("pathway_answers")
        .select("question_id, answer_value")
        .eq("session_id", session_id);

      const answersMap: Record<string, unknown> = {};
      const answeredIds = new Set<string>();
      for (const a of existingAnswers || []) {
        answeredIds.add(a.question_id);
        const val = a.answer_value;
        answersMap[a.question_id] = typeof val === "object" && val !== null && "value" in (val as Record<string, unknown>)
          ? (val as Record<string, unknown>).value
          : val;
      }

      // Get all questions with priority and logic, sorted by priority desc
      // Questions with priority > 5 are "real" questions; priority 5 = filler (skip unless explicitly needed)
      const { data: allQuestions } = await supabase
        .from("questions")
        .select("id, priority, logic")
        .gt("priority", 5)
        .order("priority", { ascending: false });

      // Find next unanswered question whose logic condition is met (or has no condition)
      let nextQuestionId: string | null = null;
      for (const q of allQuestions || []) {
        if (answeredIds.has(q.id)) continue;
        // If question has a logic condition, evaluate it
        if (q.logic) {
          if (!evaluateExpr(q.logic as Record<string, unknown>, answersMap)) continue;
        }
        // No logic = always show (unconditional)
        nextQuestionId = q.id;
        break;
      }

      if (nextQuestionId) {
        const { data: question } = await supabase
          .from("questions")
          .select("*")
          .eq("id", nextQuestionId)
          .single();

        // Apply translations if locale is not English
        const sessionLocale = locale || "en";
        if (question && sessionLocale !== "en") {
          const pt = question.prompt_translations as Record<string, string> | null;
          const ht = question.help_translations as Record<string, string> | null;
          const ct = question.choice_translations as Record<string, Record<string, string>> | null;
          if (pt && pt[sessionLocale]) question.prompt_plain = pt[sessionLocale];
          if (ht && ht[sessionLocale]) question.help_plain = ht[sessionLocale];
          if (ct && ct[sessionLocale] && Array.isArray(question.choices)) {
            question.choices = (question.choices as { value: string; label: string }[]).map(
              (c: { value: string; label: string }) => ({
                ...c,
                label: ct[sessionLocale][c.value] || c.label,
              })
            );
          }
        }

        return new Response(
          JSON.stringify({ type: "question", question, progress: answeredIds.size }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // No more questions — compute results
      return await computeResults(supabase, session_id, answersMap);
    }

    // ACTION: get_results
    if (action === "get_results") {
      // Verify session ownership
      const callerId = await getCallerId(req);
      const { data: sess } = await supabase.from("pathway_sessions").select("user_id").eq("id", session_id).single();
      if (sess?.user_id && callerId && sess.user_id !== callerId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existingAnswers } = await supabase
        .from("pathway_answers")
        .select("question_id, answer_value")
        .eq("session_id", session_id);

      const answersMap: Record<string, unknown> = {};
      for (const a of existingAnswers || []) {
        const val = a.answer_value;
        answersMap[a.question_id] = typeof val === "object" && val !== null && "value" in (val as Record<string, unknown>)
          ? (val as Record<string, unknown>).value
          : val;
      }

      return await computeResults(supabase, session_id, answersMap);
    }

    // ACTION: start_case
    if (action === "start_case") {
      const authHeader = req.headers.get("authorization");
      const { data: { user } } = await createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { authorization: authHeader || "" } } }
      ).auth.getUser();

      if (!user) {
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get pathway info
      const { data: pathway } = await supabase.from("pathways").select("*").eq("id", pathway_id).single();
      if (!pathway) throw new Error("Pathway not found");

      // Get forms for this pathway
      const { data: forms } = await supabase.from("pathway_forms").select("*").eq("pathway_id", pathway_id);

      // Generate case number
      const caseNumber = `DOME-${Date.now().toString(36).toUpperCase()}`;

      // Create case
      const { data: newCase, error: caseErr } = await supabase
        .from("cases")
        .insert({
          case_number: caseNumber,
          case_type: pathway.display_name,
          visa_type: pathway_id,
          created_by: user.id,
          status: "draft",
          priority: pathway.risk_level_default === "HIGH" ? "high" : "medium",
          package_forms: (forms || []).map((f: { form_code: string }) => f.form_code),
        })
        .select("id")
        .single();

      if (caseErr) throw caseErr;

      // Add user as case participant
      await supabase.from("case_participants").insert({
        case_id: newCase.id,
        user_id: user.id,
        role: "client",
      });

      // Create form instances
      for (const f of forms || []) {
        await supabase.from("form_instances").insert({
          case_id: newCase.id,
          form_type: f.form_code,
          form_name: `${f.form_code}${f.notes ? ` - ${f.notes}` : ""}`,
          status: "not_started",
        });
      }

      // Update session status
      await supabase.from("pathway_sessions").update({ status: "complete" }).eq("id", session_id);

      return new Response(
        JSON.stringify({ case_id: newCase.id, case_number: caseNumber }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("pathway-engine error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function computeResults(
  supabase: ReturnType<typeof createClient>,
  sessionId: string,
  answers: Record<string, unknown>
) {
  // Get all pathways + their rules
  const { data: pathways } = await supabase.from("pathways").select("*");
  const { data: allRules } = await supabase.from("pathway_rules").select("*");

  const results = [];

  for (const pathway of pathways || []) {
    const rules = (allRules || []).filter((r: { pathway_id: string }) => r.pathway_id === pathway.id);
    let score = 50; // base
    const reasons: string[] = [];
    const riskFlags: string[] = [];
    const missingQuestions: string[] = [];
    let disqualified = false;
    let eligibilityHits = 0;
    let eligibilityTotal = 0;

    // Evaluate DISQUALIFIER rules first
    const disqualifierRules = rules.filter((r: { rule_type: string }) => r.rule_type === "DISQUALIFIER");
    const eligibilityRules = rules.filter((r: { rule_type: string }) => r.rule_type === "ELIGIBILITY");
    const scoreRules = rules.filter((r: { rule_type: string }) => r.rule_type === "SCORE");

    for (const rule of disqualifierRules) {
      const fired = evaluateExpr(rule.expr as Record<string, unknown>, answers);
      await supabase.from("pathway_rule_audit").insert({
        session_id: sessionId, pathway_id: pathway.id, rule_id: rule.id,
        rule_fired: fired, inputs_used: answers,
        explanation_returned: fired ? rule.explain_if_true : rule.explain_if_false,
      });
      if (fired) {
        disqualified = true;
        score += rule.weight * 10; // weight is negative
        if (rule.explain_if_true) riskFlags.push(rule.explain_if_true);
      }
    }

    for (const rule of eligibilityRules) {
      eligibilityTotal++;
      // Check if required vars are missing
      const exprStr = JSON.stringify(rule.expr);
      const varMatches = exprStr.match(/"var"\s*:\s*"answers\.([^"]+)"/g) || [];
      const referencedVars = varMatches.map((m: string) => {
        const match = m.match(/"answers\.([^"]+)"/);
        return match ? match[1] : null;
      }).filter(Boolean) as string[];
      const allPresent = referencedVars.every((v: string) => v in answers);

      if (!allPresent) {
        for (const v of referencedVars) {
          if (!(v in answers) && !missingQuestions.includes(v)) missingQuestions.push(v);
        }
        continue; // skip evaluation if data missing
      }

      const fired = evaluateExpr(rule.expr as Record<string, unknown>, answers);
      await supabase.from("pathway_rule_audit").insert({
        session_id: sessionId, pathway_id: pathway.id, rule_id: rule.id,
        rule_fired: fired, inputs_used: answers,
        explanation_returned: fired ? rule.explain_if_true : rule.explain_if_false,
      });
      if (fired) {
        eligibilityHits++;
        score += rule.weight * 10;
        if (rule.explain_if_true) reasons.push(rule.explain_if_true);
      } else {
        score -= rule.weight * 5;
        if (rule.explain_if_false) reasons.push(rule.explain_if_false);
      }
    }

    for (const rule of scoreRules) {
      const fired = evaluateExpr(rule.expr as Record<string, unknown>, answers);
      await supabase.from("pathway_rule_audit").insert({
        session_id: sessionId, pathway_id: pathway.id, rule_id: rule.id,
        rule_fired: fired, inputs_used: answers,
        explanation_returned: fired ? rule.explain_if_true : rule.explain_if_false,
      });
      if (fired) {
        score += rule.weight * 5;
        if (rule.explain_if_true) reasons.push(rule.explain_if_true);
      } else {
        if (rule.explain_if_false) reasons.push(rule.explain_if_false);
      }
    }

    // Clamp score
    score = Math.max(0, Math.min(100, Math.round(score)));

    let status: string;
    if (disqualified) {
      status = "NOT_ELIGIBLE";
      score = Math.min(score, 15);
    } else if (eligibilityTotal === 0) {
      status = "NEEDS_INFO";
    } else if (eligibilityHits === eligibilityTotal) {
      status = "STRONG";
    } else if (eligibilityHits >= eligibilityTotal * 0.5) {
      status = "POSSIBLE";
    } else {
      status = "NEEDS_INFO";
    }

    // Store result
    await supabase.from("pathway_results").insert({
      session_id: sessionId,
      pathway_id: pathway.id,
      status,
      score,
      reasons,
      risk_flags: riskFlags,
      missing_questions: missingQuestions,
    });

    results.push({
      pathway_id: pathway.id,
      display_name: pathway.display_name,
      category: pathway.category,
      description: pathway.description_plain,
      requires_rep_review: pathway.requires_rep_review,
      status,
      score,
      reasons,
      risk_flags: riskFlags,
    });
  }

  // Sort by score desc
  results.sort((a, b) => b.score - a.score);

  return new Response(
    JSON.stringify({ type: "results", results }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
}