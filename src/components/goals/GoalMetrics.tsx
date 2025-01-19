import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";

interface Goal {
  id: string;
  title: string;
  status: string;
  priority?: string;
  targetValue?: number;
  currentValue?: number;
  metricUnit?: string;
  startDate?: Date;
  dueDate?: Date;
}

interface GoalMetricsProps {
  goals: Goal[];
}

export function GoalMetrics({ goals }: GoalMetricsProps) {
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const completionRate = totalGoals ? (completedGoals / totalGoals) * 100 : 0;

  const priorityBreakdown = goals.reduce(
    (acc, goal) => {
      const priority = goal.priority?.toLowerCase() ?? "unset";
      acc[priority] = (acc[priority] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const calculateOverallProgress = () => {
    const goalsWithProgress = goals.filter(
      (g) => g.targetValue && g.currentValue !== undefined,
    );
    if (!goalsWithProgress.length) {
      return 0;
    }

    const totalProgress = goalsWithProgress.reduce((sum, goal) => {
      if (!goal.targetValue || goal.currentValue === undefined) {
        return sum;
      }
      return sum + (goal.currentValue / goal.targetValue) * 100;
    }, 0);

    return totalProgress / goalsWithProgress.length;
  };

  const getDueSoonGoals = () => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return goals.filter((goal) => {
      if (!goal.dueDate || goal.status === "completed") {
        return false;
      }
      const dueDate = new Date(goal.dueDate);
      return dueDate >= now && dueDate <= nextWeek;
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            Progress across all measurable goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Rate</span>
              <span>{Math.round(completionRate)}%</span>
            </div>
            <Progress value={completionRate} />
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Average Progress</span>
              <span>{Math.round(calculateOverallProgress())}%</span>
            </div>
            <Progress value={calculateOverallProgress()} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Priority Breakdown</CardTitle>
          <CardDescription>Goals by priority level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(priorityBreakdown).map(([priority, count]) => (
              <div key={priority} className="flex justify-between text-sm">
                <span className="capitalize">{priority}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Quick statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Goals</span>
              <span>{totalGoals}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Completed</span>
              <span>{completedGoals}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>In Progress</span>
              <span>{totalGoals - completedGoals}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Due Soon</CardTitle>
          <CardDescription>Goals due within the next week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {getDueSoonGoals().map((goal) => (
              <div key={goal.id} className="flex justify-between text-sm">
                <span className="truncate">{goal.title}</span>
                <span>
                  {goal.dueDate && new Date(goal.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
            {getDueSoonGoals().length === 0 && (
              <div className="text-sm text-gray-500">No goals due soon</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
