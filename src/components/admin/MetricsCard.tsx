"use client";

import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton"; // For loading state

interface MetricsCardProps {
  title: string;
  value: number | string | undefined;
  isLoading?: boolean;
  description?: string;
  icon?: React.ReactNode; // Optional icon
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  isLoading = false,
  description,
  icon,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? <Skeleton className="h-8 w-1/2" /> : (value ?? "-")}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};
