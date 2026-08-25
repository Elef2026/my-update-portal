import { getPendingTasks } from "@/app/actions/admin-tasks";
import TasksTable from "./components/TasksTable";

export default async function AdminTasksPage() {
  const result = await getPendingTasks();
  const tasks = result.success && result.data ? result.data : [];

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold">አዳዲስ ጥያቄዎች (Pending Tasks)</h1>
          <p className="text-muted-foreground mt-2">
            ክፍያ ፈጽመው ማረጋገጫ የሚጠብቁ የደንበኞች ሰነድ ማደሻ ጥያቄዎችን እዚህ ይመለከታሉ፤ ስራውንም መጀመር ይችላሉ።
          </p>
        </div>

        <TasksTable initialTasks={tasks as any} />

      </div>
    </div>
  );
}
