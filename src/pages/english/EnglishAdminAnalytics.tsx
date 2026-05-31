import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackButton from "@/components/BackButton";
import { Users, BookOpen, DollarSign, Award, TrendingUp, Calendar } from "lucide-react";
import { useT } from "@/hooks/useT";

const EnglishAdminAnalytics = () => {
  const t = useT();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalEnrollments: 0,
    totalCourses: 0,
    totalTeachers: 0,
    totalCertificates: 0,
    totalClasses: 0,
    totalBookings: 0,
    totalPackages: 0,
    completedEnrollments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [enrollRes, coursesRes, teachersRes, certsRes, classesRes, bookingsRes, pkgRes] = await Promise.all([
        supabase.from("english_enrollments").select("*", { count: "exact", head: false }),
        supabase.from("english_courses").select("*", { count: "exact", head: true }),
        supabase.from("english_teachers").select("*", { count: "exact", head: true }),
        supabase.from("english_certificates").select("*", { count: "exact", head: true }),
        supabase.from("english_classes").select("*", { count: "exact", head: true }),
        supabase.from("english_lesson_bookings").select("*", { count: "exact", head: true }),
        supabase.from("english_enterprise_packages").select("*", { count: "exact", head: true }),
      ]);

      const enrollments = enrollRes.data || [];
      const uniqueStudents = new Set(enrollments.map((e: any) => e.user_id)).size;
      const completed = enrollments.filter((e: any) => e.status === 'completed').length;

      setStats({
        totalStudents: uniqueStudents,
        totalEnrollments: enrollRes.count || 0,
        totalCourses: coursesRes.count || 0,
        totalTeachers: teachersRes.count || 0,
        totalCertificates: certsRes.count || 0,
        totalClasses: classesRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        totalPackages: pkgRes.count || 0,
        completedEnrollments: completed,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="p-6 text-center text-muted-foreground">Loading analytics...</div>;

  const statCards = [
    { label: "Total Students", value: stats.totalStudents, icon: Users, color: "text-blue-600" },
    { label: "Enrollments", value: stats.totalEnrollments, icon: BookOpen, color: "text-emerald-600" },
    { label: "Completed", value: stats.completedEnrollments, icon: Award, color: "text-purple-600" },
    { label: "Courses", value: stats.totalCourses, icon: BookOpen, color: "text-amber-600" },
    { label: "Teachers", value: stats.totalTeachers, icon: Users, color: "text-secondary" },
    { label: "Classes", value: stats.totalClasses, icon: Calendar, color: "text-pink-600" },
    { label: "Private Bookings", value: stats.totalBookings, icon: DollarSign, color: "text-emerald-600" },
    { label: "Certificates", value: stats.totalCertificates, icon: Award, color: "text-secondary" },
    { label: "Enterprise Inquiries", value: stats.totalPackages, icon: TrendingUp, color: "text-blue-600" },
  ];

  const conversionRate = stats.totalStudents > 0
    ? Math.round((stats.completedEnrollments / stats.totalEnrollments) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <BackButton />
      <h1 className="text-2xl font-display font-bold">📊 {t("engAdmin.title")}</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <s.icon className={`w-6 h-6 mx-auto mb-1 ${s.color}`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Completion Rate</CardTitle></CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-secondary">{conversionRate}%</p>
            <p className="text-xs text-muted-foreground">{stats.completedEnrollments} of {stats.totalEnrollments} enrollments completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue Streams</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subscriptions</span><span className="font-medium">Active via Stripe</span></div>
            <div className="flex justify-between"><span>Private Lessons</span><span className="font-medium">{stats.totalBookings} bookings</span></div>
            <div className="flex justify-between"><span>Enterprise</span><span className="font-medium">{stats.totalPackages} inquiries</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnglishAdminAnalytics;
