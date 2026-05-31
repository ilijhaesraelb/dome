import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Check, X, Eye, Flag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useT } from "@/hooks/useT";

const STATUS_COLORS: Record<string, string> = {
  pending_review: "bg-amber-100 text-amber-800",
  published: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-gray-100 text-gray-800",
};

const AdminListingModeration = () => {
  const t = useT();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    const { data } = await supabase
      .from("business_listings")
      .select("*")
      .in("status", ["pending_review", "published", "suspended"])
      .order("created_at", { ascending: false });
    setListings(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("business_listings").update({
      status: status as any,
      admin_notes: adminNotes[id] || null,
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Listing ${status === "published" ? "approved" : status}`);
    loadListings();
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-secondary" />
        <h1 className="font-display text-2xl font-bold">Listing Moderation</h1>
        <Badge variant="outline">{listings.filter(l => l.status === "pending_review").length} pending</Badge>
      </div>

      {listings.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No listings to review</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {listings.map(listing => (
            <Card key={listing.id}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{listing.company_name}</h3>
                    <p className="text-sm text-muted-foreground">{listing.industry} · {listing.state}</p>
                  </div>
                  <Badge className={STATUS_COLORS[listing.status] || ""}>{listing.status}</Badge>
                </div>
                <p className="text-sm">{listing.summary}</p>
                {listing.amount_sought && <p className="text-sm text-muted-foreground">Amount: ${Number(listing.amount_sought).toLocaleString()}</p>}
                
                <Textarea
                  placeholder="Admin notes..."
                  value={adminNotes[listing.id] || ""}
                  onChange={e => setAdminNotes(p => ({ ...p, [listing.id]: e.target.value }))}
                  className="text-sm"
                />
                
                <div className="flex gap-2 flex-wrap">
                  {listing.status === "pending_review" && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(listing.id, "published")} className="gap-1 bg-green-600 hover:bg-green-700">
                        <Check className="w-4 h-4" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(listing.id, "rejected")} className="gap-1">
                        <X className="w-4 h-4" /> Reject
                      </Button>
                    </>
                  )}
                  {listing.status === "published" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(listing.id, "suspended")} className="gap-1">
                      <Flag className="w-4 h-4" /> Suspend
                    </Button>
                  )}
                  <Link to={`/business/marketplace/${listing.id}`}>
                    <Button size="sm" variant="ghost" className="gap-1"><Eye className="w-4 h-4" /> View</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminListingModeration;
