"use client";

import { addDays, isAfter, isBefore, startOfDay, subDays } from "date-fns";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Clock,
  ListTodo,
  Star,
} from "lucide-react";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

import { TaskListDialog } from "./TaskListDialog";
import { TaskSummaryDisplay } from "./TaskSummaryDisplay";

import type { Task } from "@prisma/client";

interface TaskSummaryViewProps {
  tasks: Task[];
}

export function TaskSummaryView({ tasks }: TaskSummaryViewProps) {
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [dialogTitle, setDialogTitle] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Calculate total tasks
  const totalTasks = tasks.length;

  // Calculate tasks due this week and next week
  const today = startOfDay(new Date());
  const endOfWeek = addDays(today, 7);
  const endOfNextWeek = addDays(today, 14);

  // Get overdue tasks
  const overdueTasks = tasks.filter(
    (task) => task.due_date && isBefore(task.due_date, today),
  );

  // Get tasks due this week
  const tasksDueThisWeek = tasks.filter(
    (task) =>
      task.due_date &&
      isAfter(task.due_date, today) &&
      isBefore(task.due_date, endOfWeek),
  );

  // Get tasks due next week
  const tasksDueNextWeek = tasks.filter(
    (task) =>
      task.due_date &&
      isAfter(task.due_date, endOfWeek) &&
      isBefore(task.due_date, endOfNextWeek),
  );

  // Get tasks created in the last day
  const tasksCreatedLastDay = tasks.filter(
    (task) => task.created_at && isAfter(task.created_at, subDays(today, 1)),
  );

  // Get tasks created in the last week
  const tasksCreatedLastWeek = tasks.filter(
    (task) => task.created_at && isAfter(task.created_at, subDays(today, 7)),
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

      // attempt to parse priority as a number
      const aPriority = parseInt(a.priority);
      const bPriority = parseInt(b.priority);
      return bPriority - aPriority;
    })
    .slice(0, 10);

  // Get 10 most recently created tasks
  const recentTasks = [...tasks]
    .sort((a, b) => {
      if (!a.created_at) {
        return 1;
      }
      if (!b.created_at) {
        return -1;
      }
      return b.created_at.getTime() - a.created_at.getTime();
    })
    .slice(0, 10);

  const handleCardClick = (tasks: Task[], title: string) => {
    setSelectedTasks(tasks);
    setDialogTitle(title);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {/* Total Tasks Card */}
        <Card
          className={`${
            tasks.length > 0
              ? "cursor-pointer transition-colors hover:bg-muted/50"
              : ""
          }`}
          onClick={() =>
            tasks.length > 0 && handleCardClick(tasks, "All Tasks")
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>

        {/* Overdue Tasks Card */}
        <Card
          className={`${
            overdueTasks.length > 0
              ? "cursor-pointer transition-colors hover:bg-muted/50"
              : ""
          }`}
          onClick={() =>
            overdueTasks.length > 0 &&
            handleCardClick(overdueTasks, "Overdue Tasks")
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {overdueTasks.length}
            </div>
          </CardContent>
        </Card>

        {/* Tasks Due This Week Card */}
        <Card
          className={`${
            tasksDueThisWeek.length > 0
              ? "cursor-pointer transition-colors hover:bg-muted/50"
              : ""
          }`}
          onClick={() =>
            tasksDueThisWeek.length > 0 &&
            handleCardClick(tasksDueThisWeek, "Tasks Due This Week")
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksDueThisWeek.length}</div>
          </CardContent>
        </Card>

        {/* Tasks Due Next Week Card */}
        <Card
          className={`${
            tasksDueNextWeek.length > 0
              ? "cursor-pointer transition-colors hover:bg-muted/50"
              : ""
          }`}
          onClick={() =>
            tasksDueNextWeek.length > 0 &&
            handleCardClick(tasksDueNextWeek, "Tasks Due Next Week")
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Next Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksDueNextWeek.length}</div>
          </CardContent>
        </Card>

        {/* Tasks Created Last Day Card */}
        <Card
          className={`${
            tasksCreatedLastDay.length > 0
              ? "cursor-pointer transition-colors hover:bg-muted/50"
              : ""
          }`}
          onClick={() =>
            tasksCreatedLastDay.length > 0 &&
            handleCardClick(tasksCreatedLastDay, "Tasks Created Last Day")
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Created Last Day
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasksCreatedLastDay.length}
            </div>
          </CardContent>
        </Card>

        {/* Tasks Created Last Week Card */}
        <Card
          className={`${
            tasksCreatedLastWeek.length > 0
              ? "cursor-pointer transition-colors hover:bg-muted/50"
              : ""
          }`}
          onClick={() =>
            tasksCreatedLastWeek.length > 0 &&
            handleCardClick(tasksCreatedLastWeek, "Tasks Created Last Week")
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Created Last Week
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasksCreatedLastWeek.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Top Tasks by Due Date Card */}
        <Card className="col-span-1">
          <CardHeader
            className={`${
              tasksByDueDate.length > 0
                ? "cursor-pointer transition-colors hover:bg-muted/50"
                : ""
            }`}
            onClick={() =>
              tasksByDueDate.length > 0 &&
              handleCardClick(tasksByDueDate, "Top 10 Tasks by Due Date")
            }
          >
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top 10 Tasks by Due Date
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasksByDueDate.map((task) => (
                <TaskSummaryDisplay
                  key={task.task_id}
                  task={task}
                  fields={["title", "due_date"]}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Tasks by Priority Card */}
        <Card className="col-span-1">
          <CardHeader
            className={`${
              tasksByPriority.length > 0
                ? "cursor-pointer transition-colors hover:bg-muted/50"
                : ""
            }`}
            onClick={() =>
              tasksByPriority.length > 0 &&
              handleCardClick(tasksByPriority, "Top 10 Tasks by Priority")
            }
          >
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top 10 Tasks by Priority
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasksByPriority.map((task) => (
                <TaskSummaryDisplay
                  key={task.task_id}
                  task={task}
                  fields={["title", "priority"]}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks Card */}
        <Card className="col-span-1">
          <CardHeader
            className={`${
              recentTasks.length > 0
                ? "cursor-pointer transition-colors hover:bg-muted/50"
                : ""
            }`}
            onClick={() =>
              recentTasks.length > 0 &&
              handleCardClick(recentTasks, "10 Most Recent Tasks")
            }
          >
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                10 Most Recent Tasks
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <TaskSummaryDisplay
                  key={task.task_id}
                  task={task}
                  fields={["title", "created_at"]}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <TaskListDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        tasks={selectedTasks}
        title={dialogTitle}
      />
    </>
  );
}
