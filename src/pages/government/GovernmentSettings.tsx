import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Shield, Users, Globe, Lock, Key, Eye, Building2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useT } from "@/hooks/useT";

const roles = [
  { role: "Super Admin", desc: "Full access to all settings, data, and reporting", perms: ["All"] },
  { role: "Government Admin", desc: "Manage staff, programs, and participants", perms: ["Participants", "Programs", "Reports", "Staff"] },
  { role: "Organization Admin", desc: "Manage organization-specific programs and staff", perms: ["Participants", "Programs", "Reports"] },
  { role: "Program Manager", desc: "Manage assigned programs and participants", perms: ["Participants", "Programs", "Reports"] },
  { role: "Caseworker", desc: "View and manage assigned participants", perms: ["Participants", "Documents"] },
  { role: "Support Staff", desc: "Limited participant view and document access", perms: ["Participants (view)", "Documents (view)"] },
  { role: "Reporting Only", desc: "View-only access to program analytics and reports", perms: ["Reports (view)"] },
];

const GovernmentSettings = () => {
  const t = useT();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("govSettings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("govSettings.subtitle")}</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" />{t("govSettings.orgSettings")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">{t("govSettings.orgName")}</label><Input placeholder="Your Institution" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">{t("govSettings.orgType")}</label>
              <Select defaultValue="nonprofit"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="government_agency">Government Agency</SelectItem><SelectItem value="nonprofit">Nonprofit</SelectItem><SelectItem value="city_office">City Office</SelectItem><SelectItem value="state_office">State Office</SelectItem><SelectItem value="community_org">Community Organization</SelectItem>
              </SelectContent></Select>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">{t("govSettings.defaultLanguage")}</label>
              <Select defaultValue="en"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="en">English</SelectItem><SelectItem value="es">Spanish</SelectItem><SelectItem value="pt">Portuguese</SelectItem><SelectItem value="fr">French</SelectItem><SelectItem value="zh">Mandarin Chinese</SelectItem><SelectItem value="ar">Arabic</SelectItem><SelectItem value="ht">Haitian Creole</SelectItem>
              </SelectContent></Select>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-foreground">{t("govSettings.contactEmail")}</label><Input type="email" placeholder="admin@institution.org" /></div>
          </div>
          <Button className="bg-primary hover:bg-primary/90">{t("govSettings.saveSettings")}</Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Key className="w-4 h-4 text-[hsl(var(--gold))]" />{t("govSettings.rolesPermissions")}</CardTitle>
          <CardDescription>{t("govSettings.rolesDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roles.map((r) => (
              <div key={r.role} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div><h4 className="text-sm font-semibold text-foreground">{r.role}</h4><p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p></div>
                  <div className="flex gap-1 flex-wrap justify-end">{r.perms.map((p) => (<Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>))}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-[hsl(var(--success))]" />{t("govSettings.securityTrust")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Encrypted Document Storage", desc: "TLS 1.3 + AES-256", icon: Lock },
              { label: "Permission-Based Sharing", desc: "Role-gated access to all data", icon: Key },
              { label: "Audit Logging", desc: "All actions logged with timestamps", icon: Eye },
              { label: "Tenant Isolation", desc: "Organizations cannot access other org data", icon: Shield },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className="p-2 rounded-lg bg-[hsl(var(--success)/0.1)]"><s.icon className="w-4 h-4 text-[hsl(var(--success))]" /></div>
                <div><p className="text-sm font-medium text-foreground">{s.label}</p><p className="text-xs text-muted-foreground">{s.desc}</p></div>
                <Badge className="ml-auto text-[10px] bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]">{t("govSettings.active")}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader><CardTitle className="text-base">{t("govSettings.apiReadiness")}</CardTitle><CardDescription>{t("govSettings.apiDesc")}</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {["Case Management Systems", "Reporting Systems", "CRM Systems", "Learning Modules", "Document Storage", "Institutional Dashboards"].map((api) => (
              <div key={api} className="p-3 bg-muted/50 rounded-lg text-center"><p className="text-xs font-medium text-foreground">{api}</p><Badge variant="outline" className="text-[10px] mt-1">{t("govSettings.ready")}</Badge></div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-[11px] text-muted-foreground text-center py-3">{t("gov.disclaimerLong")}</div>
    </div>
  );
};

export default GovernmentSettings;
