import { type Metadata } from "next";

import { WeeklyCalendar } from "~/components/time-blocks/WeeklyCalendar";

export const metadata: Metadata = {
  title: "Time Blocks",
  description: "Manage your time blocks and task schedules",
};

export default function TimeBlocksPage() {
  return (
    <div className="mx-auto p-4">
      <WeeklyCalendar />
    </div>
  );
}
