"use client";

import {
  type Goal,
  type GoalComment,
  type GoalProgress,
  type User,
} from "@prisma/client";
import { Edit } from "lucide-react";
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

import { EditGoalDialog } from "./EditGoalDialog";
import { GoalCommentsDialog } from "./GoalComments";
import { GoalProgressDialog } from "./GoalProgress";

interface GoalListProps {
  goals: (Goal & {
    progress: GoalProgress[];
    comments: (GoalComment & { user: User })[];
  })[];
}

export function GoalList({ goals }: GoalListProps) {
  const updateGoal = api.goal.update.useMutation();

  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

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
          <CardHeader>
            <div className="flex items-start justify-between">
              <div
                className="flex-1 cursor-pointer"
                onClick={() =>
                  setExpandedGoalId(goal.id === expandedGoalId ? null : goal.id)
                }
              >
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
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingGoalId(goal.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Badge
                  variant={
                    goal.status === "completed" ? "default" : "secondary"
                  }
                >
                  {goal.status}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {goal.description && (
                <p className="text-sm text-gray-600">{goal.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
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

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GoalProgressDialog goal={goal} />
                  <GoalCommentsDialog goal={goal} />
                </div>

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

              {expandedGoalId === goal.id && (
                <div className="mt-4 space-y-4">
                  {goal.progress.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">
                        Recent Progress
                      </h4>
                      <div className="space-y-2">
                        {goal.progress
                          .sort(
                            (a, b) =>
                              new Date(b.date).getTime() -
                              new Date(a.date).getTime(),
                          )
                          .slice(0, 3)
                          .map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between rounded-lg border p-2 text-sm"
                            >
                              <div>
                                <span className="font-medium">
                                  {p.value} {goal.metricUnit}
                                </span>
                                {p.notes && (
                                  <p className="mt-1 text-muted-foreground">
                                    {p.notes}
                                  </p>
                                )}
                              </div>
                              <span className="text-muted-foreground">
                                {new Date(p.date).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {goal.comments.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium">
                        Recent Comments
                      </h4>
                      <div className="space-y-2">
                        {goal.comments
                          .sort(
                            (a, b) =>
                              new Date(b.created_at).getTime() -
                              new Date(a.created_at).getTime(),
                          )
                          .slice(0, 3)
                          .map((comment) => (
                            <div
                              key={comment.id}
                              className="rounded-lg border p-3 text-sm"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {comment.user.image && (
                                    <img
                                      src={comment.user.image}
                                      alt={comment.user.name ?? ""}
                                      className="h-6 w-6 rounded-full"
                                    />
                                  )}
                                  <span className="font-medium">
                                    {comment.user.name ?? "Anonymous"}
                                  </span>
                                </div>
                                <span className="text-muted-foreground">
                                  {new Date(
                                    comment.created_at,
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap">
                                {comment.content}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>

          {editingGoalId === goal.id && (
            <EditGoalDialog
              goal={goal}
              open={true}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingGoalId(null);
                }
              }}
            />
          )}
        </Card>
      ))}
    </div>
  );
}
