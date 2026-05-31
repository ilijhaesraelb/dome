import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Languages, Users, FileText, Clock, Star, Loader2, Plus, BarChart3, Power, UserPlus, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getLangFlag, getLangLabel, SUPPORTED_LANGUAGES } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import SessionNotesDialog from "@/components/communication/SessionNotesDialog";

const CHART_COLORS = ["hsl(218, 41%, 21%)", "hsl(22, 76%, 53%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(262, 52%, 47%)", "hsl(190, 80%, 42%)"];

const AdminLanguageSupport = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [docRequests, setDocRequests] = useState<any[]>([]);
  const [interpreters, setInterpreters] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [sessionNotesBooking, setSessionNotesBooking] = useState<any>(null);
  const [newStaff, setNewStaff] = useState({
    full_name: "", email: "", role: "interpreter", languages: "", specialties: "",
    hourly_rate: "0", is_internal: true, certifications: "", organization_affiliation: "", timezone: "America/New_York", bio: "",
  });

  const loadAll = async () => {
    const [r, b, d, i, rt] = await Promise.all([
      supabase.from("language_support_requests" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("interpreter_bookings" as any).select("*").order("scheduled_at", { ascending: false }),
      supabase.from("document_translation_requests" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("interpreters" as any).select("*").order("full_name"),
      supabase.from("interpreter_session_ratings" as any).select("*"),
    ]);
    setRequests((r.data as any[]) || []);
    setBookings((b.data as any[]) || []);
    setDocRequests((d.data as any[]) || []);
    setInterpreters((i.data as any[]) || []);
    setRatings((rt.data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const updateRequestStatus = async (id: string, status: string) => {
    await supabase.from("language_support_requests" as any).update({ status } as any).eq("id", id);
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    toast({ title: "Updated", description: `Request marked as ${status}` });
  };

  const assignInterpreterToRequest = async (requestId: string, interpreterId: string) => {
    await supabase.from("language_support_requests" as any).update({ assigned_interpreter_id: interpreterId, status: "assigned" } as any).eq("id", requestId);
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, assigned_interpreter_id: interpreterId, status: "assigned" } : r));
    toast({ title: "Assigned", description: "Interpreter assigned to request." });
  };

  const toggleStaffActive = async (id: string, currentActive: boolean) => {
    await supabase.from("interpreters" as any).update({ is_active: !currentActive } as any).eq("id", id);
    setInterpreters((prev) => prev.map((i) => i.id === id ? { ...i, is_active: !currentActive } : i));
    toast({ title: currentActive ? "Deactivated" : "Activated", description: `Staff member ${currentActive ? "deactivated" : "activated"}.` });
  };

  const updateDocTranslationStatus = async (id: string, status: string) => {
    await supabase.from("document_translation_requests" as any).update({ status } as any).eq("id", id);
    setDocRequests((prev) => prev.map((d) => d.id === id ? { ...d, status } : d));
    toast({ title: "Updated", description: `Translation request marked as ${status}` });
  };

  const addStaffMember = async () => {
    const { error } = await supabase.from("interpreters" as any).insert({
      full_name: newStaff.full_name,
      email: newStaff.email || null,
      role: newStaff.role,
      languages: newStaff.languages.split(",").map((s: string) => s.trim()).filter(Boolean),
      specialties: newStaff.specialties.split(",").map((s: string) => s.trim()).filter(Boolean),
      hourly_rate: parseFloat(newStaff.hourly_rate) || 0,
      is_internal: newStaff.is_internal,
      certifications: newStaff.certifications || null,
      organization_affiliation: newStaff.organization_affiliation || null,
      timezone: newStaff.timezone || "America/New_York",
      bio: newStaff.bio || null,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Staff Added" });
      setAddStaffOpen(false);
      loadAll();
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "bg-green-100 text-green-800";
      case "confirmed": case "assigned": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "in_progress": return "bg-purple-100 text-purple-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Analytics
  const langCounts = requests.reduce((acc: any, r: any) => { acc[r.preferred_language] = (acc[r.preferred_language] || 0) + 1; return acc; }, {});
  const langChartData = Object.entries(langCounts).map(([lang, count]) => ({ name: getLangLabel(lang), value: count as number }));
  const urgentCount = requests.filter((r) => r.urgency === "urgent" && r.status === "pending").length;
  const avgRating = ratings.length > 0 ? (ratings.reduce((s, r) => s + (r.overall_rating || 0), 0) / ratings.length).toFixed(1) : "N/A";
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const unassignedCount = requests.filter((r) => r.status === "pending" && !r.assigned_interpreter_id).length;

  // Urgency distribution for bar chart
  const urgencyData = ["urgent", "within_24_hours", "within_3_days", "scheduled"].map((u) => ({
    name: u.replace(/_/g, " "),
    count: requests.filter((r) => r.urgency === u).length,
  }));

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Languages className="w-7 h-7 text-secondary" /> Language Support Admin
          </h1>
          <p className="text-muted-foreground text-sm">Manage requests, staff, bookings, and analytics</p>
        </div>
        <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Add Staff</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Language Support Staff</DialogTitle>
              <DialogDescription>Add a new interpreter, translator, or support specialist.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Full Name *</Label><Input value={newStaff.full_name} onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} /></div>
              <div><Label>Role</Label>
                <Select value={newStaff.role} onValueChange={(v) => setNewStaff({ ...newStaff, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interpreter">Interpreter</SelectItem>
                    <SelectItem value="translator">Translator</SelectItem>
                    <SelectItem value="bilingual_specialist">Bilingual Specialist</SelectItem>
                    <SelectItem value="case_support_assistant">Case Support Assistant</SelectItem>
                    <SelectItem value="language_coordinator">Language Coordinator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Languages (comma-separated codes: en, es, fr)</Label><Input value={newStaff.languages} onChange={(e) => setNewStaff({ ...newStaff, languages: e.target.value })} /></div>
              <div><Label>Specialties (comma-separated)</Label><Input value={newStaff.specialties} onChange={(e) => setNewStaff({ ...newStaff, specialties: e.target.value })} /></div>
              <div><Label>Certifications</Label><Input value={newStaff.certifications} onChange={(e) => setNewStaff({ ...newStaff, certifications: e.target.value })} placeholder="e.g., ATA Certified, Court Interpreter" /></div>
              <div><Label>Organization Affiliation</Label><Input value={newStaff.organization_affiliation} onChange={(e) => setNewStaff({ ...newStaff, organization_affiliation: e.target.value })} /></div>
              <div><Label>Timezone</Label><Input value={newStaff.timezone} onChange={(e) => setNewStaff({ ...newStaff, timezone: e.target.value })} /></div>
              <div><Label>Bio</Label><Textarea value={newStaff.bio} onChange={(e) => setNewStaff({ ...newStaff, bio: e.target.value })} rows={2} /></div>
              <div><Label>Hourly Rate ($)</Label><Input type="number" value={newStaff.hourly_rate} onChange={(e) => setNewStaff({ ...newStaff, hourly_rate: e.target.value })} /></div>
              <div className="flex items-center justify-between">
                <Label>Internal Staff</Label>
                <Switch checked={newStaff.is_internal} onCheckedChange={(v) => setNewStaff({ ...newStaff, is_internal: v })} />
              </div>
              <Button onClick={addStaffMember} className="w-full">Add Staff Member</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{requests.length}</p><p className="text-xs text-muted-foreground">Total Requests</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{urgentCount}</p><p className="text-xs text-muted-foreground">Urgent Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-600">{unassignedCount}</p><p className="text-xs text-muted-foreground">Unassigned</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{completedBookings}</p><p className="text-xs text-muted-foreground">Sessions Done</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{interpreters.length}</p><p className="text-xs text-muted-foreground">Staff Members</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold flex items-center justify-center gap-1"><Star className="w-4 h-4 text-yellow-500" />{avgRating}</p><p className="text-xs text-muted-foreground">Avg Rating</p></CardContent></Card>
      </div>

      <Tabs defaultValue="queue">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="queue">Request Queue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="translations">Doc Translations</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-3 mt-4">
          {requests.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No requests yet.</CardContent></Card>
          ) : requests.map((r) => (
            <Card key={r.id} className={r.urgency === "urgent" && r.status === "pending" ? "border-red-300" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm capitalize">{r.support_type?.replace(/_/g, " ")}</p>
                      {r.urgency === "urgent" && <Badge variant="destructive" className="text-[10px]">URGENT</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{getLangFlag(r.preferred_language)} {getLangLabel(r.preferred_language)} · {r.meeting_type?.replace(/_/g, " ") || "General"}</p>
                    {r.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
                    {r.case_id && <p className="text-[10px] text-secondary mt-1">📎 Case linked</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={statusColor(r.status)}>{r.status}</Badge>
                    {r.status === "pending" && (
                      <div className="space-y-1">
                        <Select onValueChange={(v) => assignInterpreterToRequest(r.id, v)}>
                          <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="Assign staff..." /></SelectTrigger>
                          <SelectContent>
                            {interpreters.filter((i) => i.is_active).map((i) => (
                              <SelectItem key={i.id} value={i.id}>{i.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="secondary" className="w-full" onClick={() => updateRequestStatus(r.id, "completed")}>Complete</Button>
                      </div>
                    )}
                    {r.status === "assigned" && (
                      <Button size="sm" variant="secondary" onClick={() => updateRequestStatus(r.id, "completed")}>Complete</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-3 mt-4">
          {bookings.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No bookings yet.</CardContent></Card>
          ) : bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{b.language_pair}</p>
                  <p className="text-xs text-muted-foreground capitalize">{b.support_type?.replace(/_/g, " ")} · {b.duration_minutes} min</p>
                  {b.case_id && <p className="text-[10px] text-secondary">📎 Case linked</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(b.scheduled_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColor(b.status)}>{b.status}</Badge>
                  {b.status === "confirmed" && (
                    <Button size="sm" variant="outline" onClick={() => setSessionNotesBooking(b)}>
                      <ClipboardList className="w-3.5 h-3.5 mr-1" /> Log Notes
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="translations" className="space-y-3 mt-4">
          {docRequests.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No document translation requests.</CardContent></Card>
          ) : docRequests.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{d.document_title}</p>
                    <p className="text-xs text-muted-foreground">{getLangFlag(d.source_language)} → {getLangFlag(d.target_language)} · {d.request_type?.replace(/_/g, " ")}</p>
                    {d.pricing_mode && <p className="text-[10px] text-muted-foreground capitalize">{d.pricing_mode} mode</p>}
                    {d.deadline && <p className="text-[10px] text-muted-foreground">Due: {new Date(d.deadline).toLocaleDateString()}</p>}
                    {d.file_path && <p className="text-[10px] text-secondary">📎 File attached</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={statusColor(d.status)}>{d.status}</Badge>
                    {d.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => updateDocTranslationStatus(d.id, "in_progress")}>Start</Button>
                        <Button size="sm" variant="secondary" onClick={() => updateDocTranslationStatus(d.id, "completed")}>Done</Button>
                      </div>
                    )}
                    {d.status === "in_progress" && (
                      <Button size="sm" variant="secondary" onClick={() => updateDocTranslationStatus(d.id, "completed")}>Done</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="staff" className="space-y-3 mt-4">
          {interpreters.map((i) => (
            <Card key={i.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{i.full_name}</p>
                      <Badge variant={i.is_active ? "default" : "secondary"} className="text-[10px]">{i.is_active ? "Active" : "Inactive"}</Badge>
                      {i.is_internal && <Badge variant="outline" className="text-[10px]">Internal</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{i.role?.replace(/_/g, " ")}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {i.languages?.map((l: string) => (
                        <Badge key={l} variant="outline" className="text-[10px]">{getLangFlag(l)} {getLangLabel(l)}</Badge>
                      ))}
                    </div>
                    {i.certifications && <p className="text-[10px] text-muted-foreground mt-1">🏅 {i.certifications}</p>}
                    {i.organization_affiliation && <p className="text-[10px] text-muted-foreground">🏢 {i.organization_affiliation}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xs text-muted-foreground">{i.hourly_rate > 0 ? `$${i.hourly_rate}/hr` : "Free"}</p>
                    <Button size="sm" variant={i.is_active ? "destructive" : "default"} onClick={() => toggleStaffActive(i.id, i.is_active)}>
                      <Power className="w-3.5 h-3.5 mr-1" /> {i.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Requests by Language</CardTitle></CardHeader>
              <CardContent>
                {langChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={langChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                        {langChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Urgency Distribution</CardTitle></CardHeader>
              <CardContent>
                {urgencyData.some((d) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={urgencyData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(218, 41%, 21%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Key Metrics</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Requests</span><span className="font-semibold">{requests.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Completed Sessions</span><span className="font-semibold">{completedBookings}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Doc Translations</span><span className="font-semibold">{docRequests.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Urgent Pending</span><span className="font-semibold text-red-600">{urgentCount}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Average Rating</span><span className="font-semibold">{avgRating}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Active Staff</span><span className="font-semibold">{interpreters.filter((i) => i.is_active).length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Paid Requests</span><span className="font-semibold">{requests.filter((r) => r.pricing_mode === "paid").length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sponsored</span><span className="font-semibold">{requests.filter((r) => r.pricing_mode === "free" || r.pricing_mode === "nonprofit_sponsored").length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Low Ratings (&lt;3)</span><span className="font-semibold text-red-600">{ratings.filter((r) => r.overall_rating < 3).length}</span></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {sessionNotesBooking && (
        <SessionNotesDialog
          open={!!sessionNotesBooking}
          onOpenChange={(open) => !open && setSessionNotesBooking(null)}
          bookingId={sessionNotesBooking.id}
          interpreterId={sessionNotesBooking.interpreter_id}
          languagePair={sessionNotesBooking.language_pair}
          supportType={sessionNotesBooking.support_type}
          onSaved={loadAll}
        />
      )}
    </div>
  );
};

export default AdminLanguageSupport;
