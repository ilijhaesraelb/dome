/**
 * ProTaxFirmAdmin — minimal firm management for owner_admins:
 * lists members, invites, and assignments. Read-only stub for now.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTaxStaff } from "@/hooks/useTaxStaff";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

const ProTaxFirmAdmin = () => {
  const staff = useTaxStaff();
  const [members, setMembers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staff.firmId) { setLoading(false); return; }
    (async () => {
      const [{ data: m }, { data: c }] = await Promise.all([
        (supabase.from("tax_firm_members") as any).select("*").eq("firm_id", staff.firmId).eq("is_active", true),
        (supabase.from("tax_firm_clients") as any).select("*, tax_clients ( legal_name, first_name, last_name )").eq("firm_id", staff.firmId).eq("is_active", true),
      ]);
      setMembers(m ?? []); setClients(c ?? []); setLoading(false);
    })();
  }, [staff.firmId]);

  if (staff.loading || loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <Button asChild size="sm" variant="ghost"><Link to="/tax/pro"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <h1 className="font-display text-xl font-bold">Firm Administration</h1>
      </div>
      {!staff.firmId ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">You are not a member of any tax firm.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Members ({members.length})</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{m.user_id.slice(0, 8)}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{String(m.role).replace(/_/g, " ")}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Clients ({clients.length})</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {clients.map((c) => {
                const tc = Array.isArray(c.tax_clients) ? c.tax_clients[0] : c.tax_clients;
                const name = tc?.legal_name || [tc?.first_name, tc?.last_name].filter(Boolean).join(" ") || "—";
                return <div key={c.id} className="text-sm truncate">{name}</div>;
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
export default ProTaxFirmAdmin;