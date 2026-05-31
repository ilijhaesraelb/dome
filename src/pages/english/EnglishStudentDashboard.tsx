import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import BackButton from "@/components/BackButton";
import {
  BookOpen, Mic, Award, Video, GraduationCap, Calendar, Clock,
  ArrowRight, Flame, Star, CreditCard, ChevronRight,
} from "lucide-react";
import { useT } from "@/hooks/useT";

const EnglishStudentDashboard = () => {
  const t = useT();
  const { session } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    const uid = session.user.id;
    const load = async () => {
      const [enr, prog, cert, cls, bk] = await Promise.all([
        supabase.from("english_enrollments").select("*, english_courses(title, category, level)").eq("user_id", uid),
        supabase.from("english_progress").select("*").eq("user_id", uid),
        supabase.from("english_certificates").select("*").eq("user_id", uid),
        supabase.from("english_classes").select("*, english_courses(title)").gte("scheduled_at", new Date().toISOString()).order("scheduled_at").limit(5),
        supabase.from("english_lesson_bookings").select("*, english_teachers(display_name)").eq("student_id", uid).order("scheduled_at", { ascending: true }).limit(5),
      ]);
      setEnrollments(enr.data || []);
      setProgress(prog.data || []);
      setCerts(cert.data || []);
      setUpcomingClasses(cls.data || []);
      setBookings(bk.data || []);
      setLoading(false);
    };
    load();
  }, [session]);

  const avgScore = progress.length > 0
    ? Math.round(progress.reduce((a, p) => a + (p.overall_score || 0), 0) / progress.length)
    : 0;
  const totalClasses = progress.reduce((a, p) => a + (p.classes_attended || 0), 0);
  const completedCourses = enrollments.filter((e) => e.status === "completed").length;
  const currentLevel = progress[0]?.placement_level || "Not tested";

  if (loading) return <div className="p-6 text-center text-muted-foreground">{t("engDash.loading")}</div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24">
      <BackButton />
      <div>
        <h1 className="text-2xl font-display font-bold">{t("engDash.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("engDash.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { icon: GraduationCap, value: currentLevel, label: t("engDash.currentLevel"), color: "text-emerald-600" },
          { icon: Video, value: upcomingClasses.length > 0 ? "Upcoming" : "None", label: t("engDash.nextClass"), color: "text-blue-600" },
          { icon: Flame, value: totalClasses, label: t("engDash.practiceStreak"), color: "text-orange-500" },
          { icon: BookOpen, value: enrollments.length, label: t("engDash.enrolled"), color: "text-primary" },
          { icon: Award, value: certs.length, label: t("engDash.certificates"), color: "text-secondary" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-3 text-center space-y-1">
              <s.icon className={`w-5 h-5 mx-auto ${s.color}`} />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { to: "/portal/english/practice", icon: Mic, label: t("engDash.continuePractice") },
          { to: "#", icon: Video, label: t("engDash.joinLiveClass") },
          { to: "/portal/english/lessons", icon: Calendar, label: t("engDash.bookPrivateLesson") },
          { to: "/portal/english/placement", icon: GraduationCap, label: t("engDash.retakePlacement") },
          { to: "/portal/english/pricing", icon: CreditCard, label: t("engDash.manageSubscription") },
        ].map((a, i) => (
          <Link key={i} to={a.to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-3 text-center">
                <a.icon className="w-5 h-5 mx-auto text-secondary mb-1" />
                <p className="text-[10px] font-medium">{a.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
          <Video className="w-4 h-4" /> {t("engDash.upcomingClasses")}
        </h2>
        {upcomingClasses.length === 0 ? (
          <Card><CardContent className="p-4 text-center text-sm text-muted-foreground">{t("engDash.noUpcoming")} <Link to="/portal/english/curriculum" className="text-secondary underline">{t("engDash.browseCourses")}</Link></CardContent></Card>
        ) : (
          <div className="space-y-2">
            {upcomingClasses.map((cls) => (
              <Card key={cls.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{cls.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cls.scheduled_at).toLocaleDateString()} · {new Date(cls.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Button size="sm" asChild>
                    <Link to={`/portal/english/live/${cls.id}`}><Video className="w-3.5 h-3.5 mr-1" /> Join</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> {t("engDash.myCourses")}
        </h2>
        {enrollments.length === 0 ? (
          <Card><CardContent className="p-4 text-center text-sm text-muted-foreground">{t("engDash.notEnrolled")} <Link to="/portal/english/curriculum" className="text-secondary underline">{t("engDash.exploreCurriculum")}</Link></CardContent></Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {enrollments.map((e) => {
              const prog = progress.find((p) => p.course_id === e.course_id);
              const pct = prog?.total_classes > 0 ? Math.round((prog.classes_attended / prog.total_classes) * 100) : 0;
              return (
                <Card key={e.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-semibold">{e.english_courses?.title}</h3>
                      <Badge variant={e.status === "completed" ? "default" : "secondary"} className="text-[10px]">{e.status}</Badge>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{e.english_courses?.level}</Badge>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Progress</span><span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                    <Button size="sm" className="w-full" asChild>
                      <Link to={`/portal/english/course/${e.course_id}`}>Continue <ArrowRight className="w-3 h-3 ml-1" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {bookings.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> {t("engDash.privateLessons")}
          </h2>
          <div className="space-y-2">
            {bookings.map((b) => (
              <Card key={b.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{b.english_teachers?.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.duration_minutes}min · {new Date(b.scheduled_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{b.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">{t("engDash.progressSummary")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: t("engDash.coursesCompleted"), value: completedCourses },
              { label: t("engDash.classesAttended"), value: totalClasses },
              { label: t("engDash.avgScore"), value: `${avgScore}%` },
              { label: t("engDash.certificates"), value: certs.length },
            ].map((s) => (
              <div key={s.label} className="text-center rounded-lg bg-muted p-3">
                <p className="text-lg font-bold text-secondary">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
          <Award className="w-4 h-4" /> {t("engDash.certificates")}
        </h2>
        {certs.length === 0 ? (
          <Card><CardContent className="p-4 text-center text-sm text-muted-foreground">{t("engDash.completeCourse")}</CardContent></Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {certs.map((c) => (
              <Card key={c.id} className="border-secondary/30">
                <CardContent className="p-4 text-center space-y-1">
                  <Award className="w-8 h-8 mx-auto text-secondary" />
                  <p className="font-semibold text-sm">{c.course_title}</p>
                  <p className="text-xs text-muted-foreground">{c.level} · {new Date(c.issued_at).toLocaleDateString()}</p>
                  <p className="text-[9px] text-muted-foreground italic">
                    This certificate reflects course completion and is not a government or academic degree credential.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground/70 text-center italic">
        {t("engHome.disclaimer")}
      </p>
    </div>
  );
};

export default EnglishStudentDashboard;
