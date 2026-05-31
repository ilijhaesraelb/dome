import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, AlertCircle, CheckCircle2, Clock, FileText, History, ServerCrash, ShieldAlert, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";

interface CaseStatusResult {
  case_status: {
    receiptNumber: string;
    formType?: string;
    submittedDate?: string;
    modifiedDate?: string;
    current_case_status_text_en?: string;
    current_case_status_desc_en?: string;
    current_case_status_text_es?: string;
    current_case_status_desc_es?: string;
    hist_case_status?: Array<{
      date: string;
      completed_text_en: string;
      completed_text_es?: string;
    }>;
  };
  message?: string;
}

const USCISCaseStatus = () => {
  const t = useT();
  const { toast } = useToast();
  const [receiptNumber, setReceiptNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaseStatusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  const receiptRegex = /^[A-Z]{3}\d{10}$/;

  const handleLookup = async () => {
    const cleaned = receiptNumber.replace(/[-\s]/g, "").toUpperCase();

    if (!cleaned) {
      toast({ title: t("uscis.enterReceipt"), variant: "destructive" });
      return;
    }

    if (!receiptRegex.test(cleaned)) {
      setResult(null);
      setError(t("uscis.invalidFormat"));
      setErrorCode(422);
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    setErrorCode(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("uscis-case-status", {
        body: { receiptNumber: cleaned },
      });

      if (fnError) {
        // supabase.functions.invoke wraps non-2xx as FunctionsHttpError —
        // try to extract the JSON body which contains our friendly message
        try {
          const ctx = (fnError as any).context;
          if (ctx && typeof ctx.json === "function") {
            const body = await ctx.json();
            if (body?.error) {
              setError(body.error);
              setErrorCode(body.code || null);
            } else {
              setError(fnError.message);
            }
          } else {
            setError(fnError.message);
          }
        } catch {
          setError(fnError.message);
        }
      } else if (data?.error) {
        setError(data.error);
        setErrorCode(data.code || null);
      } else {
        setResult(data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to look up case status";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const cs = result?.case_status;

  return (
    <div className="px-4 py-2 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-display font-bold text-foreground">{t("uscis.title")}</h1>
        <div className="w-16 h-0.5 bg-secondary mx-auto rounded-full" />
        <p className="text-sm text-muted-foreground">{t("uscis.subtitle")}</p>
      </div>

      {/* Search Input */}
      <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5 space-y-4">
        <label className="text-sm font-medium text-foreground">{t("uscis.receiptNumber")}</label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. EAC9999103403"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            className="font-mono text-base tracking-wider uppercase"
            maxLength={16}
          />
          <Button onClick={handleLookup} disabled={loading} className="shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("uscis.receiptHelp")}</p>
      </div>

      {/* Error */}
      {error && (
        <div className={cn(
          "border rounded-xl p-4 flex items-start gap-3",
          errorCode === 503 ? "bg-amber-500/10 border-amber-500/30" :
          errorCode === 404 ? "bg-muted border-border" :
          errorCode === 429 ? "bg-amber-500/10 border-amber-500/30" :
          "bg-destructive/10 border-destructive/30"
        )}>
          {errorCode === 503 ? (
            <ServerCrash className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          ) : errorCode === 404 ? (
            <Search className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          ) : errorCode === 429 ? (
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          ) : errorCode === 401 || errorCode === 403 ? (
            <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          )}
          <div>
            <p className={cn(
              "text-sm font-medium",
              errorCode === 503 || errorCode === 429 ? "text-amber-600" :
              errorCode === 404 ? "text-foreground" :
              "text-destructive"
            )}>
              {errorCode === 503 ? t("uscis.serviceUnavailable") :
               errorCode === 404 ? t("uscis.caseNotFound") :
               errorCode === 429 ? t("uscis.rateLimited") :
               errorCode === 401 || errorCode === 403 ? t("uscis.accessDenied") :
               t("uscis.lookupFailed")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {cs && (
        <div className="space-y-4">
          {/* Status Card */}
          <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-foreground">{t("uscis.caseStatus")}</h2>
              <Badge variant="outline" className="text-xs font-mono">
                {cs.receiptNumber}
              </Badge>
            </div>

            {cs.current_case_status_text_en && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {cs.current_case_status_text_en}
                  </p>
                  {cs.current_case_status_desc_en && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {cs.current_case_status_desc_en}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              {cs.formType && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-secondary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("uscis.formType")}</p>
                    <p className="text-sm font-medium text-foreground">{cs.formType}</p>
                  </div>
                </div>
              )}
              {cs.submittedDate && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-secondary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("uscis.submitted")}</p>
                    <p className="text-sm font-medium text-foreground">{cs.submittedDate}</p>
                  </div>
                </div>
              )}
              {cs.modifiedDate && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-secondary" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("uscis.lastUpdated")}</p>
                    <p className="text-sm font-medium text-foreground">{cs.modifiedDate}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Spanish Status */}
          {cs.current_case_status_text_es && (
            <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5 space-y-2">
              <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                🇪🇸 {t("uscis.spanishStatus")}
              </h3>
              <p className="text-sm font-medium text-foreground">{cs.current_case_status_text_es}</p>
              {cs.current_case_status_desc_es && (
                <p className="text-xs text-muted-foreground">{cs.current_case_status_desc_es}</p>
              )}
            </div>
          )}

          {/* History */}
          {cs.hist_case_status && cs.hist_case_status.length > 0 && (
            <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5 space-y-4">
              <h3 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
                <History className="w-5 h-5 text-secondary" /> {t("uscis.caseHistory")}
              </h3>
              <div className="space-y-3">
                {cs.hist_case_status.map((evt, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-secondary mt-2 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{evt.completed_text_en}</p>
                      <p className="text-xs text-muted-foreground">{evt.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 px-1">
        <AlertCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">{t("uscis.disclaimer")}</p>
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center pb-4">{t("common.disclaimer")}</p>
    </div>
  );
};

export default USCISCaseStatus;
