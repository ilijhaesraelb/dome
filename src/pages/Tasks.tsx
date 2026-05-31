import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { mockTasks, priorityColors } from "@/data/mockData";
import type { TaskStatus } from "@/data/mockData";
import { useT } from "@/hooks/useT";

const Tasks = () => {
  const t = useT();

  const columns: { key: TaskStatus; label: string; color: string }[] = [
    { key: "todo", label: t("tasks.todo"), color: "bg-muted" },
    { key: "in_progress", label: t("tasks.inProgress"), color: "bg-primary/10" },
    { key: "done", label: t("tasks.done"), color: "bg-success/10" },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("tasks.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("tasks.totalTasks", { count: mockTasks.length })}</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> {t("tasks.newTask")}</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map((col) => {
          const tasks = mockTasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-sm flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.key === "todo" ? "bg-muted-foreground" : col.key === "in_progress" ? "bg-primary" : "bg-success"}`} />
                  {col.label}
                </h2>
                <Badge variant="outline">{tasks.length}</Badge>
              </div>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-sm">{task.title}</p>
                        <Badge variant="outline" className={priorityColors[task.priority]}>{task.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{task.caseName}</span>
                        <span>Due {task.dueDate}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tasks;
