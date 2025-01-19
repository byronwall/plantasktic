import { useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { api } from "~/trpc/react";

interface Goal {
  id: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  status: string;
  startDate?: Date;
  dueDate?: Date;
  targetValue?: number;
  currentValue?: number;
  metricUnit?: string;
  progress?: { value: number; date: Date }[];
}

interface GoalListProps {
  goals: Goal[];
  onGoalUpdate: () => void;
}

export function GoalList({ goals, onGoalUpdate }: GoalListProps) {
  const updateGoal = api.goal.update.useMutation({
    onSuccess: onGoalUpdate,
  });

  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  const calculateProgress = (goal: Goal) => {
    if (goal.targetValue && goal.currentValue) {
      return (goal.currentValue / goal.targetValue) * 100;
    }
    return 0;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) {
      return "";
    }
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <Card key={goal.id} className="overflow-hidden">
          <CardHeader
            className="cursor-pointer"
            onClick={() =>
              setExpandedGoalId(goal.id === expandedGoalId ? null : goal.id)
            }
          >
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{goal.title}</CardTitle>
                <CardDescription>
                  {goal.category && (
                    <Badge variant="outline" className="mr-2">
                      {goal.category}
                    </Badge>
                  )}
                  {goal.priority && (
                    <Badge className={getPriorityColor(goal.priority)}>
                      {goal.priority}
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <Badge
                variant={goal.status === "completed" ? "default" : "secondary"}
              >
                {goal.status}
              </Badge>
            </div>
          </CardHeader>

          {expandedGoalId === goal.id && (
            <CardContent>
              {goal.description && (
                <p className="mb-4 text-sm text-gray-600">{goal.description}</p>
              )}

              <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                {goal.startDate && (
                  <div>
                    <span className="font-medium">Start Date:</span>{" "}
                    {formatDate(goal.startDate)}
                  </div>
                )}
                {goal.dueDate && (
                  <div>
                    <span className="font-medium">Due Date:</span>{" "}
                    {formatDate(goal.dueDate)}
                  </div>
                )}
              </div>

              {goal.targetValue && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      Progress: {goal.currentValue ?? 0} / {goal.targetValue}{" "}
                      {goal.metricUnit}
                    </span>
                    <span>{Math.round(calculateProgress(goal))}%</span>
                  </div>
                  <Progress value={calculateProgress(goal)} />
                </div>
              )}

              <div className="mt-4 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateGoal.mutate({
                      id: goal.id,
                      status:
                        goal.status === "completed" ? "active" : "completed",
                    })
                  }
                >
                  Mark as {goal.status === "completed" ? "Active" : "Complete"}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
