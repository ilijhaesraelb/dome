import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Store, MapPin, DollarSign, Globe, Mail, AlertTriangle, Shield, Send, Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useT } from "@/hooks/useT";

const ListingDetail = () => {
  const t = useT();
  const { id } = useParams();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [riskAck, setRiskAck] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("business_listings").select("id, company_name, industry, state, summary, category, marketplace_mode, business_stage, amount_sought, founder_overview, traction, use_of_funds, website, contact_method, status, published_at, created_at, updated_at, user_id, disclaimer_accepted, expires_at").eq("id", id).single();
      setListing(data);
      setLoading(false);
    };
    if (id) load();
  }, [id]);

  const handleContact = async () => {
    if (!contactForm.name || !contactForm.email) { toast.error("Name and email required."); return; }
    if (!riskAck) { toast.error("Please acknowledge the risk disclosure."); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("investor_leads").insert({
        listing_id: id,
        user_id: user?.id || null,
        name: contactForm.name,
        email: contactForm.email,
        message: contactForm.message || null,
        risk_ack: true,
      });
      if (error) throw error;
      toast.success("Your interest has been submitted!");
      setShowContact(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!listing) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Listing not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/business/marketplace" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">D.O.M.E.</span>
          </Link>
          <BackButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">{listing.company_name}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {listing.state}</span>
            <Badge variant="outline">{listing.industry}</Badge>
            {listing.amount_sought && <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> ${Number(listing.amount_sought).toLocaleString()}</span>}
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div><h3 className="font-semibold mb-1">Summary</h3><p className="text-sm text-muted-foreground">{listing.summary}</p></div>
            {listing.use_of_funds && <div><h3 className="font-semibold mb-1">Use of Funds</h3><p className="text-sm text-muted-foreground">{listing.use_of_funds}</p></div>}
            {listing.founder_overview && <div><h3 className="font-semibold mb-1">Founder / Organization</h3><p className="text-sm text-muted-foreground">{listing.founder_overview}</p></div>}
            {listing.traction && <div><h3 className="font-semibold mb-1">Traction</h3><p className="text-sm text-muted-foreground">{listing.traction}</p></div>}
            {listing.website && (
              <a href={listing.website} target="_blank" rel="noopener" className="flex items-center gap-1 text-sm text-secondary hover:underline">
                <Globe className="w-4 h-4" /> {listing.website}
              </a>
            )}
          </CardContent>
        </Card>

        {/* Contact / Lead */}
        {!showContact ? (
          <Button onClick={() => setShowContact(true)} className="gap-2 bg-secondary hover:bg-secondary/90">
            <Mail className="w-4 h-4" /> Express Interest
          </Button>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-lg">Express Interest</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Your Name *</Label><Input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Your Email *</Label><Input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div><Label>Message</Label><Textarea value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} /></div>
              <div className="flex items-start gap-2 cursor-pointer" onClick={() => setRiskAck(!riskAck)}>
                <Checkbox checked={riskAck} className="mt-0.5" />
                <span className="text-xs text-muted-foreground">I acknowledge that this is an informational listing only, that I am responsible for my own due diligence, and that D.O.M.E. does not guarantee outcomes or provide investment advice.</span>
              </div>
              <Button onClick={handleContact} className="gap-2 bg-secondary hover:bg-secondary/90"><Send className="w-4 h-4" /> Submit</Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Investment Disclosure:</strong> This listing is for informational purposes only. D.O.M.E. does not verify claims, guarantee returns, or act as a broker-dealer or funding portal. Consult qualified legal and financial professionals before making investment decisions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ListingDetail;
