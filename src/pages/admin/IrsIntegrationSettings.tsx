/**
 * IRS Integration Settings — Admin-only configuration page
 * Supports IRIS + TIN Matching setup across dev/staging/production.
 */
import { useState, useEffect } from "react";
import { useIrsIntegration } from "@/hooks/useIrsIntegration";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, Server, Key,
  Link2, FileJson, Save, Power, PowerOff, TestTube, ClipboardList,
  Eye, EyeOff, Info,
} from "lucide-react";
import {
  type IrsEnvironment,
  type IrsIntegrationSettings as IrsSettings,
  IRS_STATUS_LABELS,
  IRS_STATUS_COLORS,
  validateConfiguration,
  validateJwksJson,
  validateRedirectUrl,
} from "@/lib/irs-integration";

const AVAILABLE_APIS = [
  { key: "IRIS", label: "IRIS — Information Returns Intake System (1099)" },
  { key: "TINM", label: "TINM — TIN Matching" },
];

const INTEGRATION_TYPES = [
  { value: "isp_platform", label: "ISP — Platform for Outside Users" },
  { value: "direct", label: "Direct — Internal Use Only" },
  { value: "partner", label: "Partner — Third-Party Integration" },
];

const ENVS: IrsEnvironment[] = ["development", "staging", "production"];

const defaultForm = (env: IrsEnvironment): Partial<IrsSettings> => ({
  api_label: "DOME Tax Services IRIS TINM",
  selected_apis: ["IRIS", "TINM"],
  integration_type: "isp_platform",
  environment: env,
  redirect_url: "",
  jwks_json: null,
  status: "not_started",
  notes: "",
});

const IrsIntegrationSettingsPage = () => {
  const [activeEnv, setActiveEnv] = useState<IrsEnvironment>("development");
  const { allSettings, save, activate, deactivate, isSaving, isAdmin } = useIrsIntegration(activeEnv);
  const { toast } = useToast();

  const [form, setForm] = useState<Partial<IrsSettings>>(defaultForm("development"));
  const [jwksRaw, setJwksRaw] = useState("");
  const [showJwks, setShowJwks] = useState(false);

  // Load existing settings into form on tab change
  useEffect(() => {
    const existing = allSettings.find((s) => s.environment === activeEnv);
    if (existing) {
      setForm(existing);
      setJwksRaw(existing.jwks_json ? JSON.stringify(existing.jwks_json, null, 2) : "");
    } else {
      setForm(defaultForm(activeEnv));
      setJwksRaw("");
    }
  }, [activeEnv, allSettings]);

  const validation = validateConfiguration(form);
  const jwksValidation = jwksRaw.trim() ? validateJwksJson(jwksRaw) : null;
  const redirectValidation = form.redirect_url ? validateRedirectUrl(form.redirect_url) : null;

  const handleApiToggle = (api: string) => {
    const current = form.selected_apis || [];
    setForm({
      ...form,
      selected_apis: current.includes(api) ? current.filter((a) => a !== api) : [...current, api],
    });
  };

  const handleSaveDraft = async () => {
    let parsedJwks = null;
    if (jwksRaw.trim()) {
      try {
        parsedJwks = JSON.parse(jwksRaw);
      } catch {
        toast({ title: "Invalid JWKS JSON", variant: "destructive" });
        return;
      }
    }
    const v = validateConfiguration({ ...form, jwks_json: parsedJwks });
    await save({
      ...form,
      environment: activeEnv,
      jwks_json: parsedJwks,
      status: v.overallStatus,
    });
  };

  const handleActivate = async () => {
    await activate(activeEnv);
  };

  const handleDeactivate = async () => {
    await deactivate(activeEnv);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <Alert variant="destructive">
          <Shield className="w-5 h-5" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>IRS Integration Settings are restricted to administrators.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentStatus = (form.status || "not_started") as keyof typeof IRS_STATUS_LABELS;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="w-6 h-6 text-primary" /> IRS Integration Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure IRIS and TIN Matching API access for D.O.M.E. tax services.
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Current Status:</span>
            <Badge className={IRS_STATUS_COLORS[currentStatus]}>{IRS_STATUS_LABELS[currentStatus]}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {form.validated_at && <span>Last validated: {new Date(form.validated_at).toLocaleString()}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Environment Tabs */}
      <Tabs value={activeEnv} onValueChange={(v) => setActiveEnv(v as IrsEnvironment)}>
        <TabsList className="w-full justify-start">
          {ENVS.map((e) => {
            const s = allSettings.find((x) => x.environment === e);
            return (
              <TabsTrigger key={e} value={e} className="gap-2 capitalize">
                {e}
                {s && (
                  <Badge variant="outline" className="text-[10px] ml-1">
                    {IRS_STATUS_LABELS[(s.status as keyof typeof IRS_STATUS_LABELS) || "not_started"]}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {ENVS.map((env) => (
          <TabsContent key={env} value={env} className="space-y-6 mt-4">
            {/* Basic Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-4 h-4" /> API Configuration
                </CardTitle>
                <CardDescription>
                  {env === "production"
                    ? "Production settings — real IRS credentials required."
                    : `${env.charAt(0).toUpperCase() + env.slice(1)} environment — may use test mode.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>IRS API Label</Label>
                    <Input
                      value={form.api_label || ""}
                      onChange={(e) => setForm({ ...form, api_label: e.target.value })}
                      placeholder="DOME Tax Services IRIS TINM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Integration Type</Label>
                    <Select
                      value={form.integration_type || "isp_platform"}
                      onValueChange={(v) => setForm({ ...form, integration_type: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INTEGRATION_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Selected IRS APIs</Label>
                  <div className="flex flex-wrap gap-4">
                    {AVAILABLE_APIS.map((api) => (
                      <label key={api.key} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={(form.selected_apis || []).includes(api.key)}
                          onCheckedChange={() => handleApiToggle(api.key)}
                        />
                        <span className="text-sm">{api.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Redirect URL */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> Redirect / Callback URL
                </CardTitle>
                <CardDescription>
                  The URL IRS will redirect to after OAuth or callback events. Must be HTTPS in production.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Redirect URL for {env}</Label>
                  <Input
                    value={form.redirect_url || ""}
                    onChange={(e) => setForm({ ...form, redirect_url: e.target.value })}
                    placeholder={
                      env === "development"
                        ? "http://localhost:5173/tax/integrations/irs/callback"
                        : "https://yourdomain.com/tax/integrations/irs/callback"
                    }
                  />
                  {redirectValidation && !redirectValidation.valid && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {redirectValidation.error}
                    </p>
                  )}
                  {redirectValidation?.valid && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid URL format
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* JWKS Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="w-4 h-4" /> JWKS / RSA Key Configuration
                </CardTitle>
                <CardDescription>
                  Paste the JWKS JSON for RSA-based authentication. Private key material is never displayed after save.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>JWKS JSON</Label>
                  <Button variant="ghost" size="sm" onClick={() => setShowJwks(!showJwks)} className="gap-1 text-xs">
                    {showJwks ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showJwks ? "Hide" : "Show"}
                  </Button>
                </div>
                {showJwks ? (
                  <Textarea
                    value={jwksRaw}
                    onChange={(e) => setJwksRaw(e.target.value)}
                    rows={8}
                    className="font-mono text-xs"
                    placeholder='{"keys": [{"kty": "RSA", "kid": "...", "n": "...", "e": "AQAB"}]}'
                  />
                ) : (
                  <div className="border rounded-md p-3 bg-muted/30 text-sm text-muted-foreground">
                    {jwksRaw.trim() ? `JWKS configured (${jwksRaw.length} characters) — click Show to view` : "No JWKS configured"}
                  </div>
                )}
                {jwksValidation && (
                  <div className="space-y-1">
                    {jwksValidation.valid ? (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Valid JWKS — {jwksValidation.keyCount} key(s) found
                      </p>
                    ) : (
                      jwksValidation.errors.map((err, i) => (
                        <p key={i} className="text-xs text-destructive flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> {err}
                        </p>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="pt-6 space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Internal notes about this configuration..."
                />
              </CardContent>
            </Card>

            {/* Validation Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Configuration Validation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {validation.checks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {check.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span>{check.label}</span>
                      {check.detail && <span className="text-xs text-muted-foreground">— {check.detail}</span>}
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Readiness:</span>
                  <Badge className={IRS_STATUS_COLORS[validation.overallStatus]}>
                    {IRS_STATUS_LABELS[validation.overallStatus]}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSaveDraft} disabled={isSaving} className="gap-2">
                <Save className="w-4 h-4" /> Save Draft
              </Button>
              <Button
                onClick={handleActivate}
                disabled={!validation.canActivate || isSaving || currentStatus === "active"}
                variant="default"
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Power className="w-4 h-4" /> Activate
              </Button>
              <Button
                onClick={handleDeactivate}
                disabled={currentStatus !== "active" || isSaving}
                variant="outline"
                className="gap-2"
              >
                <PowerOff className="w-4 h-4" /> Deactivate
              </Button>
              <Button variant="outline" disabled className="gap-2">
                <TestTube className="w-4 h-4" /> Test Connection (coming soon)
              </Button>
            </div>

            {/* Production Warning */}
            {env === "production" && currentStatus !== "active" && (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Production activation pending</AlertTitle>
                <AlertDescription>
                  Real IRS credentials (redirect URL + JWKS) must be configured and validated before production activation.
                  Do not reuse development or placeholder values.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default IrsIntegrationSettingsPage;
