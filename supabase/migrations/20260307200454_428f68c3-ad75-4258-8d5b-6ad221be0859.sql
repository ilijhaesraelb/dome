
-- Create a database webhook/trigger that calls notify-new-message on new case messages
-- We use pg_net to call the edge function when a new message is inserted

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  _supabase_url text;
  _service_key text;
BEGIN
  -- Call the edge function via pg_net
  PERFORM extensions.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/notify-new-message',
    body := jsonb_build_object('record', row_to_json(NEW)),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block message insert if notification fails
  RETURN NEW;
END;
$$;
