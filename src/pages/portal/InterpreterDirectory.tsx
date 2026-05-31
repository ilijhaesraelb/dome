import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Globe, Star, Calendar, Loader2, Award, Building2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_LANGUAGES, getLangFlag, getLangLabel } from "@/hooks/useTranslation";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";

const InterpreterDirectory = () => {
  const navigate = useNavigate();
  const [interpreters, setInterpreters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("interpreters" as any).select("*").eq("is_active", true).order("full_name");
      setInterpreters((data as any[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = interpreters.filter((i: any) => {
    const matchesSearch = !searchTerm || i.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || i.specialties?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())) || i.certifications?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLang = langFilter === "all" || i.languages?.includes(langFilter);
    const matchesRole = roleFilter === "all" || i.role === roleFilter;
    return matchesSearch && matchesLang && matchesRole;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <BackButton />

      <div className="bg-primary rounded-xl p-6 text-primary-foreground">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7" /> Interpreter & Translator Directory
        </h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Browse and book available language support professionals</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input placeholder="Search by name, specialty, or certification..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={langFilter} onValueChange={setLangFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Languages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {SUPPORTED_LANGUAGES.map((l) => (
              <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="interpreter">Interpreter</SelectItem>
            <SelectItem value="translator">Translator</SelectItem>
            <SelectItem value="bilingual_specialist">Bilingual Specialist</SelectItem>
            <SelectItem value="case_support_assistant">Case Support</SelectItem>
            <SelectItem value="language_coordinator">Coordinator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold">No interpreters found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((interp: any) => (
            <Card key={interp.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{interp.full_name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{interp.role?.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex gap-1">
                    {interp.is_internal && <Badge variant="secondary" className="text-[10px]">Internal Staff</Badge>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {interp.languages?.map((lang: string) => (
                    <Badge key={lang} variant="outline" className="text-[10px] gap-1">
                      {getLangFlag(lang)} {getLangLabel(lang)}
                    </Badge>
                  ))}
                </div>

                {interp.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {interp.specialties.map((s: string) => (
                      <Badge key={s} className="text-[10px] bg-accent text-accent-foreground">{s}</Badge>
                    ))}
                  </div>
                )}

                {interp.certifications && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Award className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <span className="line-clamp-1">{interp.certifications}</span>
                  </div>
                )}

                {interp.organization_affiliation && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="line-clamp-1">{interp.organization_affiliation}</span>
                  </div>
                )}

                {interp.bio && <p className="text-xs text-muted-foreground line-clamp-2">{interp.bio}</p>}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    {interp.hourly_rate > 0 ? `$${interp.hourly_rate}/hr` : "Free / Sponsored"}
                    {interp.timezone && (
                      <span className="ml-2 inline-flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> {interp.timezone}
                      </span>
                    )}
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/portal/language-support/book?interpreter=${interp.id}`)}>
                    <Calendar className="w-3.5 h-3.5 mr-1" /> Book
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterpreterDirectory;
