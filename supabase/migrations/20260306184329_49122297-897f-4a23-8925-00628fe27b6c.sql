
-- Add priority and logic columns to questions table
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS priority integer DEFAULT 50;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS logic jsonb DEFAULT NULL;

-- Add rule_id text column to pathway_rules with unique constraint
ALTER TABLE public.pathway_rules ADD COLUMN IF NOT EXISTS rule_id text;
CREATE UNIQUE INDEX IF NOT EXISTS pathway_rules_rule_id_key ON public.pathway_rules (rule_id) WHERE rule_id IS NOT NULL;
