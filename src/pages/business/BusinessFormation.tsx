import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight, ArrowLeft, Sparkles, MapPin, FileText, Shield, Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useT } from "@/hooks/useT";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY"
];

const STATE_NAMES: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",
  CT:"Connecticut",DE:"Delaware",DC:"District of Columbia",FL:"Florida",GA:"Georgia",
  HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",
  LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",
  MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",
  NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",
  OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",
  WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming"
};

const ENTITY_TYPES = [
  { value: "llc", label: "LLC (Limited Liability Company)", desc: "Flexible structure, pass-through taxation, limited liability" },
  { value: "corporation", label: "Corporation (Inc.)", desc: "Formal structure, shareholders, board of directors" },
  { value: "sole_proprietorship", label: "Sole Proprietorship / DBA", desc: "Simplest structure, single owner, no separate entity" },
  { value: "partnership", label: "Partnership", desc: "Two or more owners sharing profits and responsibilities" },
];

type Step = "state" | "entity" | "details" | "guidance";

const BusinessFormation = () => {
  const t = useT();
  const [step, setStep] = useState<Step>("state");
  const [selectedState, setSelectedState] = useState("");
  const [entityType, setEntityType] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessPurpose, setBusinessPurpose] = useState("");
  const [registeredAgent, setRegisteredAgent] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [aiGuidance, setAiGuidance] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAIGuidance = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("business-formation-guide", {
        body: { state: selectedState, entityType, businessName }
      });
      if (error) throw error;
      setAiGuidance(data?.guidance || "Guidance unavailable. Please consult your state's filing office directly.");
    } catch {
      setAiGuidance("Unable to load AI guidance at this time. Please check your state's Secretary of State website for filing requirements.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === "state" && selectedState) setStep("entity");
    else if (step === "entity" && entityType) setStep("details");
    else if (step === "details") {
      setStep("guidance");
      fetchAIGuidance();
    }
  };

  const handleBack = () => {
    if (step === "entity") setStep("state");
    else if (step === "details") setStep("entity");
    else if (step === "guidance") setStep("details");
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error(t("bizFormation.signInToSave")); return; }

      const { error } = await supabase.from("formation_intakes").insert({
        user_id: user.id,
        state_code: selectedState,
        entity_type: entityType as any,
        business_name: businessName,
        business_purpose: businessPurpose,
        registered_agent_name: registeredAgent,
        business_address: businessAddress,
        status: "in_progress" as any,
      });
      if (error) throw error;
      toast.success(t("bizFormation.saved"));
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/business" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">D.O.M.E.</span>
          </Link>
          <BackButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 mb-8">
          {["state", "entity", "details", "guidance"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s ? "bg-secondary text-secondary-foreground" :
                ["state","entity","details","guidance"].indexOf(step) > i ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              {i < 3 && <div className="w-8 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-6 h-6 text-secondary" />
          <h1 className="font-display text-2xl font-bold">{t("bizFormation.title")}</h1>
        </div>

        {step === "state" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-secondary" />
                {t("bizFormation.stateQuestion")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{t("bizFormation.stateDesc")}</p>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger><SelectValue placeholder={t("bizFormation.selectState")} /></SelectTrigger>
                <SelectContent>
                  {US_STATES.map(s => (
                    <SelectItem key={s} value={s}>{STATE_NAMES[s]} ({s})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleNext} disabled={!selectedState} className="gap-2 bg-secondary hover:bg-secondary/90">
                {t("bizFormation.continue")} <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "entity" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-secondary" />
                {t("bizFormation.entityQuestion")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ENTITY_TYPES.map(et => (
                <div
                  key={et.value}
                  onClick={() => setEntityType(et.value)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    entityType === et.value ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/30"
                  }`}
                >
                  <div className="font-medium">{et.label}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{et.desc}</div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleBack} className="gap-1"><ArrowLeft className="w-4 h-4" /> {t("common.back")}</Button>
                <Button onClick={handleNext} disabled={!entityType} className="gap-2 bg-secondary hover:bg-secondary/90">
                  {t("bizFormation.continue")} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "details" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("bizFormation.detailsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("bizFormation.businessName")}</Label>
                <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder={t("bizFormation.businessNamePlaceholder")} />
                <p className="text-xs text-muted-foreground mt-1">{t("bizFormation.businessNameHint")}</p>
              </div>
              <div>
                <Label>{t("bizFormation.businessPurpose")}</Label>
                <Textarea value={businessPurpose} onChange={e => setBusinessPurpose(e.target.value)} placeholder={t("bizFormation.businessPurposeHint")} />
              </div>
              <div>
                <Label>{t("bizFormation.registeredAgent")}</Label>
                <Input value={registeredAgent} onChange={e => setRegisteredAgent(e.target.value)} placeholder={t("bizFormation.registeredAgentPlaceholder")} />
                <p className="text-xs text-muted-foreground mt-1">{t("bizFormation.registeredAgentHint")}</p>
              </div>
              <div>
                <Label>{t("bizFormation.businessAddress")}</Label>
                <Input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder={t("bizFormation.businessAddressPlaceholder")} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleBack} className="gap-1"><ArrowLeft className="w-4 h-4" /> {t("common.back")}</Button>
                <Button onClick={handleNext} className="gap-2 bg-secondary hover:bg-secondary/90">
                  {t("bizFormation.getGuidance")} <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "guidance" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-secondary" />
                  {t("bizFormation.guidanceFor", { state: STATE_NAMES[selectedState] })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">{STATE_NAMES[selectedState]}</Badge>
                  <Badge variant="outline" className="capitalize">{entityType.replace("_", " ")}</Badge>
                  {businessName && <Badge variant="outline">{businessName}</Badge>}
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" /> {t("bizFormation.loadingGuidance")}
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap">
                    {aiGuidance}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleBack} className="gap-1"><ArrowLeft className="w-4 h-4" /> {t("common.back")}</Button>
              <Button onClick={handleSave} className="gap-2 bg-secondary hover:bg-secondary/90">
                {t("bizFormation.saveProgress")}
              </Button>
              <Link to="/business/hire-help">
                <Button variant="outline" className="gap-2">
                  <Shield className="w-4 h-4" /> {t("bizFormation.hireHelp")}
                </Button>
              </Link>
            </div>

            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">
                  <strong>{t("common.disclaimer")}:</strong> {t("bizFormation.formationDisclaimer")}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessFormation;
