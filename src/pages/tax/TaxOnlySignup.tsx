/**
 * Tax-Only Registration — standalone signup for tax/accounting services.
 * Does NOT require immigration case creation.
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calculator, ArrowRight, Shield } from "lucide-react";
import BackButton from "@/components/BackButton";

const USER_TYPES = [
  { value: "individual", label: "Individual Taxpayer" },
  { value: "nonprofit", label: "Nonprofit Organization" },
  { value: "small_business", label: "Small Business / Organization" },
  { value: "accountant_cpa", label: "Accountant / CPA" },
  { value: "internal_client", label: "Internal Service Client" },
];

const TaxOnlySignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", phone: "",
    preferredLanguage: "en", userType: "individual",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.firstName) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            display_name: `${form.firstName} ${form.lastName}`.trim(),
            requested_role: "client",
            signup_source: "tax_services",
            tax_user_type: form.userType,
          },
        },
      });
      if (error) throw error;

      // Create tax client profile
      if (data.user) {
        const isOrg = ["nonprofit", "small_business"].includes(form.userType);
        await supabase.from("tax_clients").insert({
          user_id: data.user.id,
          tax_user_type: form.userType as any,
          legal_first_name: isOrg ? undefined : form.firstName,
          legal_last_name: isOrg ? undefined : form.lastName,
          email: form.email,
          phone: form.phone || null,
          preferred_language: form.preferredLanguage,
        });
      }

      toast({ title: "Account created!", description: "Please check your email to verify your account." });
      navigate("/tax/dashboard");
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="absolute top-4 left-4"><BackButton /></div>
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          <Badge className="bg-secondary/10 text-secondary border-0">Tax & Accounting</Badge>
          <h1 className="text-2xl font-display font-bold">Create Your Tax Account</h1>
          <p className="text-sm text-muted-foreground">No immigration registration required. Tax services only.</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={8} />
              </div>
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <Label>I am a…</Label>
                <Select value={form.userType} onValueChange={v => setForm(p => ({ ...p, userType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {USER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preferred Language</Label>
                <Select value={form.preferredLanguage} onValueChange={v => setForm(p => ({ ...p, preferredLanguage: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="pt">Português</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? "Creating…" : "Create Tax Account"} <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
            <div className="mt-4 text-center text-xs text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary underline">Sign in</Link>
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Shield className="w-3 h-3" /> Your data is encrypted and secure
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaxOnlySignup;
