import { type Metadata } from "next";

import { WeeklyCalendar } from "~/components/time-blocks/WeeklyCalendar";

export const metadata: Metadata = {
  title: "Time Blocks",
  description: "Manage your time blocks and task schedules",
};

export default function TimeBlocksPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Time Blocks</h1>
        <p className="text-muted-foreground">
          Schedule and organize your tasks with time blocks
        </p>
      </div>
      <WeeklyCalendar />
    </div>
  );
}
