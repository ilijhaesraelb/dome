import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, ArrowLeft, CheckCircle2, Compass, Globe, FileText,
  Shield, Briefcase, Star, Users, Upload, Lock, Languages,
  Headphones, Heart, MessageSquare, Scale, Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import domeLogo from "@/assets/dome-logo.png";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 8;

const goals = [
  { key: "family_petition", label: "Family petition (spouse, parent, child)", icon: Heart },
  { key: "adjustment_of_status", label: "Adjustment of status (green card)", icon: Star },
  { key: "work_permit", label: "Work permit / employment authorization", icon: Briefcase },
  { key: "citizenship", label: "Citizenship / naturalization", icon: Shield },
  { key: "explore", label: "Explore my options — I'm not sure yet", icon: Compass },
  { key: "other", label: "Something else", icon: Globe },
];

const languages = [
  "English", "Spanish", "French", "Haitian Creole", "Portuguese",
  "Arabic", "Mandarin", "Japanese", "Urdu", "Hindi", "German", "Other",
];

const documentChecklist = [
  { key: "passport", label: "Passport", icon: Globe, required: true },
  { key: "id", label: "Government-issued ID", icon: Shield, required: true },
  { key: "marriage_cert", label: "Marriage certificate", icon: Heart, required: false },
  { key: "birth_cert", label: "Birth certificate", icon: FileText, required: false },
  { key: "utility_bill", label: "Utility bill (proof of address)", icon: FileText, required: false },
  { key: "immigration_notice", label: "Immigration notices / letters", icon: FileText, required: false },
];

const ClientOnboarding = () => {
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryOfBirth, setCountryOfBirth] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  const [dob, setDob] = useState("");
  const [wantsProfessionalHelp, setWantsProfessionalHelp] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from("profiles").update({
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
      }).eq("user_id", user.id);

      const { data: participants } = await supabase
        .from("case_participants")
        .select("case_id")
        .eq("user_id", user.id)
        .limit(1);

      if (!participants || participants.length === 0) {
        const caseNumber = `DOME-${Date.now().toString(36).toUpperCase()}`;
        const caseTypeMap: Record<string, string> = {
          family_petition: "Family-Based Petition",
          adjustment_of_status: "Adjustment of Status",
          work_permit: "Employment Authorization",
          citizenship: "Naturalization",
          explore: "General",
          other: "Other",
        };
        const { data: newCase } = await supabase
          .from("cases")
          .insert({
            case_number: caseNumber,
            case_type: caseTypeMap[selectedGoal] || "General",
            created_by: user.id,
            status: "draft" as any,
            priority: "medium" as any,
          })
          .select("id")
          .single();

        if (newCase) {
          await supabase.from("case_participants").insert({
            case_id: newCase.id,
            user_id: user.id,
            role: "client" as any,
          });

          await supabase.from("persons").insert({
            case_id: newCase.id,
            first_name: firstName,
            last_name: lastName,
            email: user.email,
            country_of_birth: countryOfBirth || null,
            date_of_birth: dob || null,
            role: "beneficiary" as any,
          });

          await supabase.from("case_timeline").insert({
            case_id: newCase.id,
            title: "Case created",
            description: "Case created during client onboarding.",
            event_type: "system" as any,
          });
        }
      }
      setStep(5);
    } catch (err) {
      console.error("Onboarding save error:", err);
      toast({ title: "Error saving profile", description: "Please try again.", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleFinish = () => navigate("/portal");

  const nextStep = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const getFirstFormRecommendation = () => {
    const map: Record<string, { code: string; name: string }> = {
      family_petition: { code: "I-130", name: "Petition for Alien Relative" },
      adjustment_of_status: { code: "I-485", name: "Application to Register Permanent Residence" },
      work_permit: { code: "I-765", name: "Application for Employment Authorization" },
      citizenship: { code: "N-400", name: "Application for Naturalization" },
    };
    return map[selectedGoal] || { code: "I-130", name: "Petition for Alien Relative" };
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <img src={domeLogo} alt="D.O.M.E." className="w-7 h-7 object-contain" />
          <span className="font-display font-bold text-base">D.O.M.E.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleFinish}>Skip for now</Button>
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 pt-4 max-w-lg mx-auto w-full">
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5" />
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-lg space-y-6">

          {/* ============ STEP 1: WELCOME ============ */}
          {step === 1 && (
            <div className="space-y-6 text-center">
              <img src={domeLogo} alt="D.O.M.E." className="w-20 h-20 mx-auto object-contain" />
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">Welcome to D.O.M.E.</h1>
                <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
                  We'll help you organize your case step by step. Everything is saved securely.
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Lock, label: "Secure & Encrypted" },
                  { icon: FileText, label: "Guided Form Preparation" },
                  { icon: Scale, label: "Attorney & A&R Support" },
                  { icon: Languages, label: "Multi-language Support" },
                ].map(t => (
                  <div key={t.label} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                    <t.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-medium text-foreground">{t.label}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 pt-2">
                <Button className="w-full h-12 gap-2 text-base" onClick={nextStep}>
                  Start My Case <ArrowRight className="w-5 h-5" />
                </Button>
                <Button variant="outline" className="w-full h-11 gap-2" onClick={() => navigate("/pathway-finder")}>
                  <Compass className="w-4 h-4" /> Test My Eligibility First
                </Button>
                <Button variant="ghost" className="w-full text-sm text-muted-foreground gap-2" onClick={() => {
                  setWantsProfessionalHelp("yes_find");
                  setStep(5);
                }}>
                  <Users className="w-4 h-4" /> I Need Professional Help
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground/60">
                D.O.M.E. provides educational guidance and form-preparation support. D.O.M.E. does not provide legal advice.
              </p>
            </div>
          )}

          {/* ============ STEP 2: GOAL / CASE TYPE ============ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="font-display text-2xl font-bold text-foreground">What are you trying to do?</h1>
                <p className="text-sm text-muted-foreground mt-1">Choose your primary goal — you can always change this later.</p>
              </div>

              <div className="space-y-2">
                {goals.map(g => (
                  <Card
                    key={g.key}
                    className={cn("cursor-pointer transition-all border-2", selectedGoal === g.key ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/30")}
                    onClick={() => setSelectedGoal(g.key)}
                  >
                    <CardContent className="p-3.5 flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", selectedGoal === g.key ? "bg-secondary/20" : "bg-muted")}>
                        <g.icon className={cn("w-4.5 h-4.5", selectedGoal === g.key ? "text-secondary" : "text-muted-foreground")} />
                      </div>
                      <span className="font-medium text-sm text-foreground flex-1">{g.label}</span>
                      {selectedGoal === g.key && <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-11" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1 h-11 gap-2" disabled={!selectedGoal} onClick={nextStep}>Continue <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {/* ============ STEP 3: BASIC PROFILE ============ */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <h1 className="font-display text-2xl font-bold text-foreground">Tell us about yourself</h1>
                <p className="text-sm text-muted-foreground mt-1">Just the basics — you can add more details later.</p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">First Name *</label>
                    <Input placeholder="Maria" value={firstName} onChange={e => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Last Name *</label>
                    <Input placeholder="Santos" value={lastName} onChange={e => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Preferred Language</label>
                  <select
                    value={preferredLanguage}
                    onChange={e => setPreferredLanguage(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {languages.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-11" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1 h-11 gap-2" disabled={!firstName || !lastName} onClick={nextStep}>Continue <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {/* ============ STEP 4: IMMIGRATION PASSPORT STARTER ============ */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">Immigration Passport</h1>
                <p className="text-sm text-muted-foreground mt-1">Essential details to start your case. You can complete more later.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date of Birth</label>
                  <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Country of Birth</label>
                  <Input placeholder="e.g. Mexico" value={countryOfBirth} onChange={e => setCountryOfBirth(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Current Location</label>
                  <Input placeholder="e.g. Miami, FL" value={currentLocation} onChange={e => setCurrentLocation(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-11" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1 h-11 gap-2" disabled={saving} onClick={handleSaveProfile}>
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Create Passport <ArrowRight className="w-4 h-4" /></>}
                </Button>
              </div>
            </div>
          )}

          {/* ============ STEP 5: PROFESSIONAL HELP OPTION ============ */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                  <Scale className="w-6 h-6 text-secondary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">Would you like professional help?</h1>
                <p className="text-sm text-muted-foreground mt-1">You can work with an attorney, accredited representative, or organization.</p>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: "yes_find", label: "Yes, help me find someone", desc: "Browse available attorneys and organizations", icon: Users },
                  { key: "yes_know", label: "Yes, I already know who", desc: "Send a request to a specific provider", icon: MessageSquare },
                  { key: "no", label: "No, I'll continue on my own", desc: "You can always request help later", icon: ArrowRight },
                ].map(opt => (
                  <Card
                    key={opt.key}
                    className={cn("cursor-pointer transition-all border-2", wantsProfessionalHelp === opt.key ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/30")}
                    onClick={() => setWantsProfessionalHelp(opt.key)}
                  >
                    <CardContent className="p-3.5 flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", wantsProfessionalHelp === opt.key ? "bg-secondary/20" : "bg-muted")}>
                        <opt.icon className={cn("w-4.5 h-4.5", wantsProfessionalHelp === opt.key ? "text-secondary" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                      {wantsProfessionalHelp === opt.key && <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-11" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1 h-11 gap-2" disabled={!wantsProfessionalHelp} onClick={nextStep}>Continue <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {/* ============ STEP 6: DOCUMENT STARTER CHECKLIST ============ */}
          {step === 6 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">Gather Your Documents</h1>
                <p className="text-sm text-muted-foreground mt-1">Check off what you have ready. You can upload them later in your portal.</p>
              </div>

              <div className="space-y-2">
                {documentChecklist.map(doc => {
                  const checked = uploadedDocs.includes(doc.key);
                  return (
                    <Card
                      key={doc.key}
                      className={cn("cursor-pointer transition-all border", checked ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/20")}
                      onClick={() => setUploadedDocs(prev => checked ? prev.filter(d => d !== doc.key) : [...prev, doc.key])}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center shrink-0", checked ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                          {checked && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                        </div>
                        <doc.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium flex-1">{doc.label}</span>
                        {doc.required && <span className="text-[10px] text-destructive font-medium">Required</span>}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Don't have everything yet? No problem — you can upload documents at any time from your portal.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-11" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1 h-11 gap-2" onClick={nextStep}>Continue <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {/* ============ STEP 7: FIRST FORM RECOMMENDATION ============ */}
          {step === 7 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-secondary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground">Your First Form</h1>
                <p className="text-sm text-muted-foreground mt-1">Based on your goal, here's the recommended first step.</p>
              </div>

              {(() => {
                const rec = getFirstFormRecommendation();
                return (
                  <Card className="border-2 border-secondary/20 bg-secondary/5">
                    <CardContent className="p-5 text-center space-y-3">
                      <FileText className="w-10 h-10 text-secondary mx-auto" />
                      <div>
                        <h3 className="font-display font-bold text-xl">Form {rec.code}</h3>
                        <p className="text-sm text-muted-foreground">{rec.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You'll complete this form inside D.O.M.E. with guided sections, help notes, and a live preview of the official form.
                      </p>
                    </CardContent>
                  </Card>
                );
              })()}

              <div className="space-y-2">
                <Button variant="outline" className="w-full text-sm gap-2" onClick={() => navigate("/portal/forms")}>
                  <Compass className="w-4 h-4" /> View Why This Form Is Needed
                </Button>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-11" onClick={prevStep}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button className="flex-1 h-11 gap-2" onClick={nextStep}>Continue <ArrowRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}

          {/* ============ STEP 8: DASHBOARD HANDOFF ============ */}
          {step === 8 && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">You're All Set!</h1>
                <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
                  Your case is ready. Here's a summary of your journey ahead.
                </p>
              </div>

              <Card className="border-2 text-left">
                <CardContent className="p-5 space-y-3">
                  {[
                    { label: "Profile Created", done: true },
                    { label: "Case Initialized", done: true },
                    { label: "Documents — " + uploadedDocs.length + " of " + documentChecklist.length + " ready", done: uploadedDocs.length >= 2 },
                    { label: "First Form Ready to Start", done: false },
                    { label: "Professional Review", done: false },
                    { label: "Export & Submit", done: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", item.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        {item.done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                      </div>
                      <span className={cn("text-sm", item.done ? "font-semibold text-foreground" : "text-muted-foreground")}>{item.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-2.5">
                <Button className="w-full h-12 gap-2 text-base" onClick={handleFinish}>
                  Go to My Dashboard <ArrowRight className="w-5 h-5" />
                </Button>
                {(() => {
                  const rec = getFirstFormRecommendation();
                  return (
                    <Button variant="outline" className="w-full h-11 gap-2" onClick={() => navigate("/portal/forms")}>
                      <FileText className="w-4 h-4" /> Start {rec.code} Now
                    </Button>
                  );
                })()}
              </div>

              <p className="text-[11px] text-muted-foreground/60">
                D.O.M.E. provides educational guidance and form-preparation support. D.O.M.E. does not provide legal advice.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientOnboarding;
