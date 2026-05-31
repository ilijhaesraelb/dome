import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  UserPlus, Mail, CheckCircle2, ChevronRight,
  Shield, Send, Building2, Scale, Users, Sparkles,
  FileText, Plus, Loader2, AlertCircle, XCircle, Clock, RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMyCase } from "@/hooks/useMyCase";
import { useAttorneyInvitations, AttorneyInvitation } from "@/hooks/useAttorneyInvitations";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useT } from "@/hooks/useT";
type CollaboratorType = "attorney" | "organization" | "ar_doj";

const collaboratorTypes: { value: CollaboratorType; label: string; icon: any; desc: string }[] = [
  { value: "attorney", label: "Immigration Attorney", icon: Scale, desc: "Licensed attorney to represent your case" },
  { value: "organization", label: "Organization / Nonprofit", icon: Building2, desc: "DOJ-recognized organization for assistance" },
  { value: "ar_doj", label: "Accredited Representative (DOJ)", icon: Users, desc: "DOJ-accredited representative authorized to practice" },
];

const availableForms = [
  { code: "I-130", name: "Petition for Alien Relative", recommended: true },
  { code: "I-485", name: "Adjustment of Status", recommended: true },
  { code: "I-765", name: "Employment Authorization", recommended: false },
  { code: "I-131", name: "Travel Document", recommended: false },
  { code: "N-400", name: "Naturalization Application", recommended: false },
  { code: "I-751", name: "Remove Conditions on Residence", recommended: false },
  { code: "I-539", name: "Change/Extend Nonimmigrant Status", recommended: false },
  { code: "DS-160", name: "Nonimmigrant Visa Application", recommended: false },
];

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: Clock, label: "Pending" },
  accepted: { color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle2, label: "Accepted" },
  declined: { color: "text-red-600 bg-red-50 border-red-200", icon: XCircle, label: "Declined" },
  revoked: { color: "text-muted-foreground bg-muted border-border", icon: XCircle, label: "Revoked" },
  expired: { color: "text-muted-foreground bg-muted border-border", icon: Clock, label: "Expired" },
};

const AttorneyCollaboration = () => {
  const t = useT();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: myCase, isLoading: caseLoading } = useMyCase();
  const { invitations, isLoading: invLoading, sendInvitation, revokeInvitation, updatePermissions } = useAttorneyInvitations();

  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedType, setSelectedType] = useState<CollaboratorType>("attorney");
  const [selectedForms, setSelectedForms] = useState<string[]>(["I-130", "I-485"]);
  const [showFormPicker, setShowFormPicker] = useState(false);
  const [uploadAccess, setUploadAccess] = useState(true);
  const [viewSensitive, setViewSensitive] = useState(false);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    sendInvitation.mutate({
      email: inviteEmail.trim().toLowerCase(),
      collaboratorType: selectedType,
      permissions: { upload_documents: uploadAccess, view_sensitive: viewSensitive },
      selectedForms,
    });
    setInviteEmail("");
  };

  const toggleForm = (code: string) => {
    setSelectedForms(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handlePermissionChange = (inv: AttorneyInvitation, key: "upload_documents" | "view_sensitive", value: boolean) => {
    updatePermissions.mutate({
      invitationId: inv.id,
      permissions: { ...inv.permissions, [key]: value },
    });
  };

  if (caseLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!myCase) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-display font-bold text-foreground">No Active Case</h2>
        <p className="text-sm text-muted-foreground">You need an active case to invite collaborators.</p>
      </div>
    );
  }

  const activeInvitations = invitations.filter(i => i.status === "accepted");
  const pendingInvitations = invitations.filter(i => i.status === "pending");
  const pastInvitations = invitations.filter(i => ["declined", "revoked", "expired"].includes(i.status));

  return (
    <div className="px-4 py-2 max-w-lg mx-auto space-y-4">
      {/* Title */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-display font-bold text-foreground">{t("attorney.title")}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("attorney.subtitle")}
        </p>
      </div>

      {/* Active Collaborators */}
      {activeInvitations.length > 0 && (
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h2 className="text-sm font-display font-bold text-foreground">{t("attorney.activeCollaborators")}</h2>
            <Badge variant="outline" className="text-xs">{activeInvitations.length}</Badge>
          </div>
          <div className="divide-y divide-border/50">
            {activeInvitations.map((inv) => (
              <div key={inv.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{inv.invited_email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{inv.collaborator_type.replace("_", " ")}</p>
                  </div>
                  <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">Active</Badge>
                </div>
                {/* Live permission toggles */}
                <div className="pl-12 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Upload & edit documents</span>
                    <Switch
                      checked={inv.permissions.upload_documents}
                      onCheckedChange={(v) => handlePermissionChange(inv, "upload_documents", v)}
                      className="scale-75"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">View sensitive info</span>
                    <Switch
                      checked={inv.permissions.view_sensitive}
                      onCheckedChange={(v) => handlePermissionChange(inv, "view_sensitive", v)}
                      className="scale-75"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-display font-bold text-foreground">{t("attorney.pendingInvitations")}</h2>
          </div>
          <div className="divide-y divide-border/50">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-yellow-50 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{inv.invited_email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {format(new Date(inv.expires_at), "MMM d, yyyy")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-destructive hover:text-destructive"
                  onClick={() => revokeInvitation.mutate(inv.id)}
                >
                  {t("attorney.revoke")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collaborator Type Selector */}
      <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-sm font-display font-bold text-foreground">{t("attorney.chooseType")}</h2>
        </div>
        <div className="divide-y divide-border/50">
          {collaboratorTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
                selectedType === type.value ? "bg-primary/5" : "hover:bg-muted/30"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                selectedType === type.value ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <type.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-bold", selectedType === type.value ? "text-primary" : "text-foreground")}>{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.desc}</p>
              </div>
              {selectedType === type.value && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Client info */}
      <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/60 shadow-sm p-4 flex items-center gap-3">
        <Avatar className="w-12 h-12 ring-2 ring-secondary/20">
          <AvatarFallback className="bg-secondary/10 text-secondary font-bold text-base">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">{displayName}</p>
          <p className="text-xs text-muted-foreground">Attorney collaboration</p>
        </div>
      </div>

      {/* Invite CTA */}
      <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/60 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{t("attorney.inviteCollaborator")}</p>
            <p className="text-xs text-muted-foreground">{t("attorney.inviteDesc")}</p>
          </div>
        </div>

        <Input
          type="email"
          placeholder="attorney@lawfirm.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          className="h-11"
          onKeyDown={(e) => e.key === "Enter" && handleInvite()}
        />

        <Button
          onClick={handleInvite}
          disabled={sendInvitation.isPending || !inviteEmail.trim()}
          className="w-full h-11 text-base font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl shadow-md shadow-secondary/20"
        >
          {sendInvitation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {t("attorney.sendInvitation")}
        </Button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" /> {t("attorney.accessRestricted")}
          </p>
        </div>
      </div>

      {/* Form Selection */}
      <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h2 className="text-base font-display font-bold text-foreground">{t("attorney.formsToPrepare")}</h2>
          <Button size="sm" variant="ghost" onClick={() => setShowFormPicker(!showFormPicker)} className="gap-1 text-xs">
            <Plus className="w-3 h-3" /> {showFormPicker ? t("attorney.done") : t("attorney.addForms")}
          </Button>
        </div>

        <div className="mx-4 mb-2 bg-secondary/5 border border-secondary/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-secondary shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-secondary">{t("attorney.aiRecommended")}</span> {t("attorney.aiRecommendedDesc")}
          </p>
        </div>

        <div className="divide-y divide-border/50">
          {(showFormPicker ? availableForms : availableForms.filter(f => selectedForms.includes(f.code))).map((form) => {
            const isSelected = selectedForms.includes(form.code);
            return (
              <button
                key={form.code}
                onClick={() => showFormPicker ? toggleForm(form.code) : null}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                  showFormPicker && "hover:bg-muted/30 cursor-pointer"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                  isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">{form.code}</span>
                    {form.recommended && (
                      <Badge className="bg-secondary/10 text-secondary border-0 text-[9px] px-1.5 py-0">AI Pick</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{form.name}</p>
                </div>
                {showFormPicker ? (
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                  )}>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                  </div>
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Permissions for new invitations */}
      <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-base font-display font-bold text-foreground">{t("attorney.defaultPermissions")}</h2>
          <p className="text-xs text-muted-foreground">{t("attorney.permissionsDesc")}</p>
        </div>
        <div className="divide-y divide-border/50">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{t("attorney.allowUpload")}</p>
              <p className="text-[11px] text-muted-foreground">{t("attorney.allowUploadDesc")}</p>
            </div>
            <Switch checked={uploadAccess} onCheckedChange={setUploadAccess} />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{t("attorney.viewSensitive")}</p>
              <p className="text-[11px] text-muted-foreground">{t("attorney.viewSensitiveDesc")}</p>
            </div>
            <Switch checked={viewSensitive} onCheckedChange={setViewSensitive} />
          </div>
        </div>
      </div>

      {/* Past Invitations */}
      {pastInvitations.length > 0 && (
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-display font-bold text-muted-foreground">{t("attorney.pastInvitations")}</h2>
          </div>
          <div className="divide-y divide-border/50">
            {pastInvitations.map((inv) => {
              const cfg = statusConfig[inv.status];
              return (
                <div key={inv.id} className="flex items-center gap-3 px-4 py-3 opacity-60">
                  <cfg.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{inv.invited_email}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(inv.created_at), "MMM d, yyyy")}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">{inv.status}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground/60 text-center pb-4">
        D.O.M.E. provides educational tools and document organization. D.O.M.E. does not provide legal advice.
      </p>
    </div>
  );
};

export default AttorneyCollaboration;
