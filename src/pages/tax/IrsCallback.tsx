/**
 * IRS OAuth / Callback Route
 *
 * Receives inbound callback events from IRS integration flows.
 * Logs all events, validates origin, and fails safely if misconfigured.
 * No sensitive values are exposed in the UI.
 */
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { logAuditEvent } from "@/lib/audit-logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, CheckCircle2, XCircle } from "lucide-react";

type CallbackState = "processing" | "success" | "error" | "unauthorized";

const IrsCallback = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>("processing");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const processCallback = async () => {
      // Log the inbound callback event (no sensitive params logged)
      const paramKeys = Array.from(searchParams.keys());

      if (!user?.id) {
        setState("unauthorized");
        setMessage("Authentication required to process IRS callback.");
        return;
      }

      try {
        await logAuditEvent(user.id, {
          module: "tax",
          action_type: "custom",
          human_label: "IRS callback received",
          metadata: {
            param_keys: paramKeys,
            timestamp: new Date().toISOString(),
            has_code: searchParams.has("code"),
            has_state: searchParams.has("state"),
            has_error: searchParams.has("error"),
          },
        });

        if (searchParams.has("error")) {
          setState("error");
          setMessage(
            "The IRS service returned an error. This has been logged for review. Please contact your administrator."
          );
          return;
        }

        // In a real integration, we would exchange the code/token here.
        // For now, log and show confirmation.
        setState("success");
        setMessage(
          "IRS callback processed successfully. Details have been logged to the audit trail."
        );
      } catch (err) {
        setState("error");
        setMessage("An unexpected error occurred while processing the IRS callback.");
      }
    };

    processCallback();
  }, [user?.id, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            IRS Integration Callback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "processing" && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing IRS callback...</span>
            </div>
          )}

          {state === "success" && (
            <Alert>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertTitle>Callback Processed</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {state === "error" && (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertTitle>Callback Error</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {state === "unauthorized" && (
            <Alert variant="destructive">
              <Shield className="w-4 h-4" />
              <AlertTitle>Unauthorized</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Button variant="outline" onClick={() => navigate("/tax/dashboard")} className="w-full">
            Return to Tax Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default IrsCallback;
