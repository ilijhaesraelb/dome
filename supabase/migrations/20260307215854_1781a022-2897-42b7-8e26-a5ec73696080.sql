
-- Remove overly permissive anonymous SELECT policies on pathway_answers and pathway_results
DROP POLICY IF EXISTS "Anon can read own answers" ON public.pathway_answers;
DROP POLICY IF EXISTS "Anon can insert answers" ON public.pathway_answers;
DROP POLICY IF EXISTS "Anon view own results" ON public.pathway_results;

-- Also remove the anonymous session policies that allow cross-session reads
DROP POLICY IF EXISTS "Anon can read own session" ON public.pathway_sessions;
DROP POLICY IF EXISTS "Anon can create sessions" ON public.pathway_sessions;
