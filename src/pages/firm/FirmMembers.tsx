import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, Users, Shield, Loader2, ArrowLeft } from "lucide-react";
import { useFirm, useFirmMembers } from "@/hooks/useFirm";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import BackButton from "@/components/BackButton";

const roleLabels: Record<string, string> = {
  firm_admin: "Firm Admin",
  attorney: "Attorney",
  paralegal: "Paralegal",
  intake_staff: "Intake Staff",
  reviewer: "Reviewer",
  billing: "Billing",
  readonly: "Read Only",
};

const roleColors: Record<string, string> = {
  firm_admin: "bg-primary/15 text-primary",
  attorney: "bg-secondary/15 text-secondary",
  paralegal: "bg-accent",
  intake_staff: "bg-blue-100 text-blue-700",
  reviewer: "bg-purple-100 text-purple-700",
  billing: "bg-amber-100 text-amber-700",
  readonly: "bg-muted text-muted-foreground",
};

const FirmMembers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { firmId, firmRole } = useFirm();
  const { data: members = [], isLoading } = useFirmMembers(firmId);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("attorney");

  const isAdmin = firmRole === "firm_admin";

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Staff & Team</h1>
          <p className="text-sm text-muted-foreground">Manage your firm's team members and roles</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowInvite(true)} className="gap-1.5">
            <UserPlus className="w-4 h-4" /> Invite Member
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Users className="w-4 h-4" /> Team Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {((member as any).profiles?.display_name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{(member as any).profiles?.display_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{(member as any).profiles?.email || ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-[10px]", roleColors[member.role])}>{roleLabels[member.role]}</Badge>
                  {member.role === "firm_admin" && <Shield className="w-4 h-4 text-primary" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions Reference */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { role: "Firm Admin", perms: "Full access, manage staff, assign cases, firm settings" },
              { role: "Attorney", perms: "Review forms, approve exports, message clients, accept cases" },
              { role: "Paralegal", perms: "Prepare forms, upload documents, organize cases" },
              { role: "Intake Staff", perms: "Review intake requests, create cases, schedule consultations" },
              { role: "Reviewer", perms: "Review forms and documents, add comments" },
              { role: "Read Only", perms: "View-only access to assigned cases" },
            ].map(r => (
              <div key={r.role} className="p-2 rounded bg-muted/30">
                <p className="font-semibold text-foreground">{r.role}</p>
                <p className="text-muted-foreground">{r.perms}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Invite Team Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@firm.com" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="attorney">Attorney</SelectItem>
                  <SelectItem value="paralegal">Paralegal</SelectItem>
                  <SelectItem value="intake_staff">Intake Staff</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="readonly">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button disabled={!inviteEmail.trim()} onClick={() => {
              toast({ title: "Invitation sent", description: `Invite sent to ${inviteEmail} as ${roleLabels[inviteRole]}` });
              setShowInvite(false);
              setInviteEmail("");
            }}>
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-xs text-muted-foreground/60 text-center">
        D.O.M.E. provides digital tools and workflow support. D.O.M.E. does not provide legal advice.
      </p>
    </div>
  );
};

export default FirmMembers;
