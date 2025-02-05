"use client";

import { formatDistanceToNow } from "date-fns";

import { Card } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

export const AdminDashboard = () => {
  const { data: users, isLoading } = api.admin.getAllUsers.useQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">User Statistics</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Goals</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.roles.join(", ")}</TableCell>
                <TableCell>
                  {formatDistanceToNow(user.lastActivity, { addSuffix: true })}
                </TableCell>
                <TableCell>{user._count.projects}</TableCell>
                <TableCell>{user._count.Task}</TableCell>
                <TableCell>{user._count.goals}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
