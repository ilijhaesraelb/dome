import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import BackButton from "@/components/BackButton";
import { Video, Calendar, Clock, Users, BookOpen } from "lucide-react";
import { useT } from "@/hooks/useT";

const EnglishCourseDetail = () => {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [courseRes, classesRes] = await Promise.all([
        supabase.from("english_courses").select("*, english_teachers(display_name, bio, avatar_url, specialties)").eq("id", id).single(),
        supabase.from("english_classes").select("*").eq("course_id", id).order("scheduled_at", { ascending: true }),
      ]);
      setCourse(courseRes.data);
      setClasses(classesRes.data || []);

      if (session) {
        const [enrollRes, progRes] = await Promise.all([
          supabase.from("english_enrollments").select("*").eq("user_id", session.user.id).eq("course_id", id).maybeSingle(),
          supabase.from("english_progress").select("*").eq("user_id", session.user.id).eq("course_id", id).maybeSingle(),
        ]);
        setEnrollment(enrollRes.data);
        setProgress(progRes.data);
      }
      setLoading(false);
    };
    load();
  }, [id, session]);

  const handleEnroll = async () => {
    if (!session || !id) return;
    const { error } = await supabase.from("english_enrollments").insert({ user_id: session.user.id, course_id: id });
    if (!error) {
      setEnrollment({ status: 'enrolled' });
      await supabase.from("english_progress").insert({ user_id: session.user.id, course_id: id, total_classes: classes.length });
    }
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  if (!course) return <div className="p-6 text-center text-muted-foreground">Course not found.</div>;

  const upcomingClasses = classes.filter(c => new Date(c.scheduled_at) > new Date() && c.status === 'scheduled');

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <BackButton />

      <div className="rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/10 p-6">
        <Badge variant="outline" className="mb-2">{course.level}</Badge>
        <h1 className="text-2xl font-display font-bold">{course.title}</h1>
        <p className="text-muted-foreground mt-2">{course.description}</p>
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.duration_minutes} min/class</span>
          <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {course.class_type === 'group' ? `Max ${course.max_students} students` : 'Private 1-on-1'}</span>
          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {classes.length} sessions</span>
        </div>
        {!enrollment ? (
          <Button className="mt-4" onClick={handleEnroll}>Enroll in This Course</Button>
        ) : (
          <Badge className="mt-4 bg-secondary text-secondary-foreground">✓ Enrolled</Badge>
        )}
      </div>

      {/* Teacher */}
      {course.english_teachers && (
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-lg font-bold text-secondary">
              {course.english_teachers.display_name?.[0] || 'T'}
            </div>
            <div>
              <h3 className="font-semibold">{course.english_teachers.display_name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{course.english_teachers.bio}</p>
              {course.english_teachers.specialties?.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {course.english_teachers.specialties.map((s: string) => (
                    <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {progress && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Your Progress</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center"><p className="text-lg font-bold text-secondary">{progress.classes_attended}</p><p className="text-xs text-muted-foreground">Classes</p></div>
              <div className="text-center"><p className="text-lg font-bold text-secondary">{progress.speaking_score}%</p><p className="text-xs text-muted-foreground">Speaking</p></div>
              <div className="text-center"><p className="text-lg font-bold text-secondary">{progress.listening_score}%</p><p className="text-xs text-muted-foreground">Listening</p></div>
              <div className="text-center"><p className="text-lg font-bold text-secondary">{progress.overall_score}%</p><p className="text-xs text-muted-foreground">Overall</p></div>
            </div>
            <Progress value={progress.total_classes > 0 ? (progress.classes_attended / progress.total_classes) * 100 : 0} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Upcoming Classes */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Upcoming Classes ({upcomingClasses.length})</h2>
        {upcomingClasses.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No upcoming classes scheduled.</CardContent></Card>
        ) : (
          <div className="space-y-3">
            {upcomingClasses.map((cls: any) => (
              <Card key={cls.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{cls.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(cls.scheduled_at).toLocaleDateString()} at {new Date(cls.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-muted-foreground">{cls.duration_minutes} minutes</p>
                  </div>
                  {enrollment && (
                    <Button size="sm" asChild>
                      <Link to={`/portal/english/live/${cls.id}`}>
                        <Video className="w-4 h-4 mr-1" /> Join
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnglishCourseDetail;
