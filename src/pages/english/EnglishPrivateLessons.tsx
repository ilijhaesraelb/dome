import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";
import { PRIVATE_LESSON_PRODUCTS } from "@/lib/english-plans";
import { Calendar, Clock, User, Video } from "lucide-react";
import { useT } from "@/hooks/useT";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const EnglishPrivateLessons = () => {
  const t = useT();
  const { session } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"30min" | "60min">("60min");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [teachersRes, bookingsRes] = await Promise.all([
        supabase.from("english_teachers").select("*").eq("is_active", true),
        session ? supabase.from("english_lesson_bookings").select("*, english_teachers(display_name)").eq("student_id", session.user.id).order("scheduled_at", { ascending: true }) : Promise.resolve({ data: [] }),
      ]);
      setTeachers(teachersRes.data || []);
      setBookings((bookingsRes as any).data || []);
      setLoading(false);
    };
    load();
  }, [session]);

  const handleBook = async () => {
    if (!session || !selectedTeacher || !selectedDate || !selectedTime) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setBooking(true);
    const scheduledAt = new Date(`${selectedDate}T${selectedTime}`).toISOString();
    const { data, error } = await supabase.from("english_lesson_bookings").insert({
      student_id: session.user.id,
      teacher_id: selectedTeacher,
      lesson_type: selectedType,
      scheduled_at: scheduledAt,
      duration_minutes: selectedType === "30min" ? 30 : 60,
    }).select("*, english_teachers(display_name)").single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lesson booked!" });
      setBookings(prev => [...prev, data]);
      // Initiate payment
      const product = PRIVATE_LESSON_PRODUCTS[selectedType];
      const { data: checkout } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: product.price_id, mode: "payment" },
      });
      if (checkout?.url) window.open(checkout.url, "_blank");
    }
    setBooking(false);
  };

  const upcomingBookings = bookings.filter(b => new Date(b.scheduled_at) > new Date() && b.status !== 'cancelled');

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <BackButton />
      <h1 className="text-2xl font-display font-bold">📅 Private English Lessons</h1>
      <p className="text-muted-foreground">Book 1-on-1 sessions with expert teachers for personalized learning.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Booking Form */}
        <Card>
          <CardHeader><CardTitle>Book a Lesson</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Lesson Type</label>
              <Select value={selectedType} onValueChange={v => setSelectedType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30min">30 minutes — $20</SelectItem>
                  <SelectItem value="60min">60 minutes — $40</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Teacher</label>
              <Select value={selectedTeacher || ""} onValueChange={setSelectedTeacher}>
                <SelectTrigger><SelectValue placeholder="Choose a teacher" /></SelectTrigger>
                <SelectContent>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTeacher && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  {(() => {
                    const t = teachers.find(t => t.id === selectedTeacher);
                    return t ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary">
                          {t.display_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{t.display_name}</p>
                          {t.bio && <p className="text-xs text-muted-foreground line-clamp-2">{t.bio}</p>}
                          {t.specialties?.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {t.specialties.slice(0, 3).map((s: string) => <Badge key={s} variant="outline" className="text-[9px]">{s}</Badge>)}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            )}

            <div>
              <label className="text-sm font-medium">Date</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Time</label>
              <input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <Button className="w-full" onClick={handleBook} disabled={booking || !selectedTeacher || !selectedDate || !selectedTime}>
              {booking ? "Booking..." : `Book & Pay — $${PRIVATE_LESSON_PRODUCTS[selectedType].price}`}
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Upcoming Lessons ({upcomingBookings.length})</h2>
          {upcomingBookings.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">
              No upcoming lessons. Book one to get started!
            </CardContent></Card>
          ) : (
            upcomingBookings.map(b => (
              <Card key={b.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{b.english_teachers?.display_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" /> {new Date(b.scheduled_at).toLocaleDateString()}
                      <Clock className="w-3 h-3" /> {new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <Badge variant="outline" className="mt-1 text-[10px]">{b.lesson_type} · {b.status}</Badge>
                  </div>
                  {b.status === 'confirmed' && (
                    <Button size="sm" asChild>
                      <a href={`https://meet.jit.si/dome-private-${b.jitsi_room_name}`} target="_blank" rel="noopener noreferrer">
                        <Video className="w-4 h-4 mr-1" /> Join
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/70 text-center">
        D.O.M.E. provides English language learning support and communication training. These courses are not accredited academic degree programs.
      </p>
    </div>
  );
};

export default EnglishPrivateLessons;
