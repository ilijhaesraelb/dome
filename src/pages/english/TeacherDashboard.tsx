import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Plus, BookOpen, Calendar, Users, Video } from "lucide-react";
import { useT } from "@/hooks/useT";

const TeacherDashboard = () => {
  const t = useT();
  const { session } = useAuth();
  const [teacher, setTeacher] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showScheduleClass, setShowScheduleClass] = useState(false);

  // New course form
  const [newCourse, setNewCourse] = useState({
    title: "", description: "", category: "beginner_english", level: "beginner" as const,
    class_type: "group" as const, max_students: 20, duration_minutes: 60,
  });

  // New class form
  const [newClass, setNewClass] = useState({ title: "", course_id: "", scheduled_at: "", duration_minutes: 60, notes: "" });

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      // Check if user is a teacher
      const { data: t } = await supabase.from("english_teachers").select("*").eq("user_id", session.user.id).maybeSingle();
      
      if (!t) {
        // Auto-register as teacher
        const name = session.user.user_metadata?.display_name || session.user.email?.split("@")[0] || "Teacher";
        const { data: newT } = await supabase.from("english_teachers").insert({
          user_id: session.user.id,
          display_name: name,
        }).select().single();
        setTeacher(newT);
      } else {
        setTeacher(t);
      }

      // Load courses and classes
      const teacherId = t?.id;
      if (teacherId) {
        const [coursesRes, classesRes] = await Promise.all([
          supabase.from("english_courses").select("*").eq("teacher_id", teacherId),
          supabase.from("english_classes").select("*, english_courses(title)").eq("teacher_id", teacherId).order("scheduled_at", { ascending: true }),
        ]);
        setCourses(coursesRes.data || []);
        setClasses(classesRes.data || []);
      }
      setLoading(false);
    };
    load();
  }, [session]);

  const handleCreateCourse = async () => {
    if (!teacher || !newCourse.title) return;
    const { data, error } = await supabase.from("english_courses").insert({
      ...newCourse,
      teacher_id: teacher.id,
    }).select().single();
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCourses(prev => [...prev, data]);
      setShowCreateCourse(false);
      setNewCourse({ title: "", description: "", category: "beginner_english", level: "beginner", class_type: "group", max_students: 20, duration_minutes: 60 });
      toast({ title: "Course created!" });
    }
  };

  const handleScheduleClass = async () => {
    if (!teacher || !newClass.title || !newClass.course_id || !newClass.scheduled_at) return;
    const { data, error } = await supabase.from("english_classes").insert({
      ...newClass,
      teacher_id: teacher.id,
    }).select("*, english_courses(title)").single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setClasses(prev => [...prev, data]);
      setShowScheduleClass(false);
      setNewClass({ title: "", course_id: "", scheduled_at: "", duration_minutes: 60, notes: "" });
      toast({ title: "Class scheduled!" });
    }
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;

  const upcomingClasses = classes.filter(c => new Date(c.scheduled_at) > new Date());

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">📚 Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your English courses and classes.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateCourse} onOpenChange={setShowCreateCourse}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-1" /> New Course</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create Course</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title</Label><Input value={newCourse.title} onChange={e => setNewCourse(p => ({ ...p, title: e.target.value }))} /></div>
                <div><Label>Description</Label><Textarea value={newCourse.description} onChange={e => setNewCourse(p => ({ ...p, description: e.target.value }))} /></div>
                <div><Label>Category</Label>
                  <Select value={newCourse.category} onValueChange={v => setNewCourse(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner_english">Beginner English</SelectItem>
                      <SelectItem value="intermediate_english">Intermediate English</SelectItem>
                      <SelectItem value="english_for_work">English for Work</SelectItem>
                      <SelectItem value="interview_english">Immigration Interviews</SelectItem>
                      <SelectItem value="citizenship_prep">Citizenship Test Prep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Level</Label>
                  <Select value={newCourse.level} onValueChange={v => setNewCourse(p => ({ ...p, level: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Type</Label>
                  <Select value={newCourse.class_type} onValueChange={v => setNewCourse(p => ({ ...p, class_type: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="group">Group Class</SelectItem>
                      <SelectItem value="private">Private Lesson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Max Students</Label><Input type="number" value={newCourse.max_students} onChange={e => setNewCourse(p => ({ ...p, max_students: Number(e.target.value) }))} /></div>
                  <div><Label>Duration (min)</Label><Input type="number" value={newCourse.duration_minutes} onChange={e => setNewCourse(p => ({ ...p, duration_minutes: Number(e.target.value) }))} /></div>
                </div>
                <Button className="w-full" onClick={handleCreateCourse}>Create Course</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showScheduleClass} onOpenChange={setShowScheduleClass}>
            <DialogTrigger asChild>
              <Button variant="outline"><Calendar className="w-4 h-4 mr-1" /> Schedule Class</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Schedule a Class</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Course</Label>
                  <Select value={newClass.course_id} onValueChange={v => setNewClass(p => ({ ...p, course_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Class Title</Label><Input value={newClass.title} onChange={e => setNewClass(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Week 1 - Introductions" /></div>
                <div><Label>Date & Time</Label><Input type="datetime-local" value={newClass.scheduled_at} onChange={e => setNewClass(p => ({ ...p, scheduled_at: e.target.value }))} /></div>
                <div><Label>Duration (min)</Label><Input type="number" value={newClass.duration_minutes} onChange={e => setNewClass(p => ({ ...p, duration_minutes: Number(e.target.value) }))} /></div>
                <div><Label>Notes</Label><Textarea value={newClass.notes} onChange={e => setNewClass(p => ({ ...p, notes: e.target.value }))} /></div>
                <Button className="w-full" onClick={handleScheduleClass}>Schedule Class</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-secondary">{courses.length}</p>
          <p className="text-xs text-muted-foreground">Courses</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-secondary">{classes.length}</p>
          <p className="text-xs text-muted-foreground">Total Classes</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-secondary">{upcomingClasses.length}</p>
          <p className="text-xs text-muted-foreground">Upcoming</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-secondary">0</p>
          <p className="text-xs text-muted-foreground">Students</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-4">
          {courses.length === 0 ? (
            <Card><CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Create your first course to get started.</p>
            </CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {courses.map((course: any) => (
                <Card key={course.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                      </div>
                      <Badge variant="outline">{course.level}</Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="secondary">{course.class_type}</Badge>
                      <Badge variant="secondary">{course.duration_minutes} min</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          {upcomingClasses.length === 0 ? (
            <Card><CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No upcoming classes. Schedule one!</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {upcomingClasses.map((cls: any) => (
                <Card key={cls.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{cls.title}</h3>
                      <p className="text-sm text-muted-foreground">{cls.english_courses?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(cls.scheduled_at).toLocaleString()} · {cls.duration_minutes} min
                      </p>
                    </div>
                    <Button size="sm" asChild>
                      <a href={`https://meet.jit.si/dome-english-${cls.jitsi_room_name}`} target="_blank" rel="noopener noreferrer">
                        <Video className="w-4 h-4 mr-1" /> Host
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;
