import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import {
  Globe, MapPin, ExternalLink, Shield, Star, Mail, AlertTriangle
} from "lucide-react";
import { useT } from "@/hooks/useT";

const NetworkListingDetail = () => {
  const t = useT();
  const { id } = useParams();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["network-listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("network_listings")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md text-center p-8">
          <h2 className="font-display text-xl font-bold mb-2">Listing Not Found</h2>
          <Link to="/network/directory"><Button>Back to Directory</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/network" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">Network</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <BackButton />

        <Card className="mt-4">
          <CardContent className="pt-8 pb-8 px-6 sm:px-10">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline">{(listing.category as string).replace(/_/g, " ")}</Badge>
              {listing.is_featured && <Badge className="bg-secondary/10 text-secondary border-secondary/20 gap-1"><Star className="w-3 h-3" /> Featured</Badge>}
              {listing.is_verified && <Badge variant="outline" className="gap-1"><Shield className="w-3 h-3" /> Verified</Badge>}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold">{listing.title}</h1>
            <p className="text-lg text-muted-foreground mt-1">{listing.organization_name}</p>

            {(listing.location || listing.state) && (
              <div className="flex items-center gap-1.5 mt-3 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {[listing.location, listing.state, listing.country].filter(Boolean).join(", ")}
              </div>
            )}

            {listing.salary_range && (
              <p className="text-lg font-semibold text-secondary mt-3">{listing.salary_range}</p>
            )}

            <hr className="my-6" />

            <div className="space-y-6">
              <div>
                <h2 className="font-display font-semibold text-lg mb-2">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{listing.summary}</p>
              </div>

              {listing.requirements && (
                <div>
                  <h2 className="font-display font-semibold text-lg mb-2">Requirements</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">{listing.requirements}</p>
                </div>
              )}

              {listing.sponsorship_type && (
                <div>
                  <h2 className="font-display font-semibold text-lg mb-2">Sponsorship Type</h2>
                  <p className="text-muted-foreground">{listing.sponsorship_type}</p>
                </div>
              )}

              {listing.credentials && (
                <div>
                  <h2 className="font-display font-semibold text-lg mb-2">Credentials</h2>
                  <p className="text-muted-foreground">{listing.credentials}</p>
                </div>
              )}

              {listing.services_offered && listing.services_offered.length > 0 && (
                <div>
                  <h2 className="font-display font-semibold text-lg mb-2">Services Offered</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.services_offered.map((s: string) => (
                      <Badge key={s} variant="outline">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <hr className="my-6" />

            <div className="flex flex-wrap gap-3">
              {listing.website && (
                <a href={listing.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="w-4 h-4" /> Visit Website
                  </Button>
                </a>
              )}
              {listing.application_link && (
                <a href={listing.application_link} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2">
                    Apply Now <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              )}
              {listing.contact_method && (
                <Button variant="outline" className="gap-2">
                  <Mail className="w-4 h-4" /> {listing.contact_method}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="mt-6 border-warning/30 bg-warning/5">
          <CardContent className="pt-5 pb-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              D.O.M.E. provides informational directory services. D.O.M.E. does not endorse, guarantee, or verify any listing.
              Users should independently verify all information. Professional services are provided by the listed professionals, not by D.O.M.E.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NetworkListingDetail;
