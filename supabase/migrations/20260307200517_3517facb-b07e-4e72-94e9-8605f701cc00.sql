
-- Create trigger on case_messages to fire notification function
CREATE OR REPLACE TRIGGER on_new_case_message
  AFTER INSERT ON public.case_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();
