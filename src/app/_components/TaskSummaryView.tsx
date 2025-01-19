import { addDays, isAfter, isBefore, startOfDay } from "date-fns";
import { BarChart3, Calendar, ListTodo, Star } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";

import { TaskField } from "./TaskField";

import type { Task } from "@prisma/client";

interface TaskSummaryViewProps {
  tasks: Task[];
}

export function TaskSummaryView({ tasks }: TaskSummaryViewProps) {
  // Calculate total tasks
  const totalTasks = tasks.length;

  // Calculate tasks due next week
  const today = startOfDay(new Date());
  const nextWeek = addDays(today, 7);
  const tasksDueNextWeek = tasks.filter(
    (task) =>
      task.due_date &&
      isAfter(task.due_date, today) &&
      isBefore(task.due_date, nextWeek),
  );

  // Get top 10 tasks by due date (soonest first)
  const tasksByDueDate = [...tasks]
    .filter((task) => task.due_date)
    .sort((a, b) => {
      if (!a.due_date) {
        return 1;
      }
      if (!b.due_date) {
        return -1;
      }
      return a.due_date.getTime() - b.due_date.getTime();
    })
    .slice(0, 10);

  // Get top 10 tasks by priority
  const tasksByPriority = [...tasks]
    .filter((task) => task.priority)
    .sort((a, b) => {
      if (!a.priority) {
        return 1;
      }
      if (!b.priority) {
        return -1;
      }
      return b.priority.localeCompare(a.priority);
    })
    .slice(0, 10);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Tasks Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTasks}</div>
        </CardContent>
      </Card>

      {/* Tasks Due Next Week Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Due Next Week</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{tasksDueNextWeek.length}</div>
        </CardContent>
      </Card>

      {/* Top Tasks by Due Date Card */}
      <Card className="col-span-2 row-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Top 10 Tasks by Due Date
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {tasksByDueDate.map((task) => (
                <div
                  key={task.task_id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <TaskField task={task} field="title" />
                  <TaskField task={task} field="due_date" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Top Tasks by Priority Card */}
      <Card className="col-span-2 row-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Top 10 Tasks by Priority
          </CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {tasksByPriority.map((task) => (
                <div
                  key={task.task_id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <TaskField task={task} field="title" />
                  <TaskField task={task} field="priority" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
